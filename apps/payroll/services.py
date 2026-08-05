from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.payroll.models import (
    SalaryStructure, Payroll, Allowance, Deduction, Reimbursement,
    Payslip, PayslipEarning, PayslipDeduction, PayslipAuditLog,
)
from apps.notifications.services import create_notification

MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]


def calculate_salary(structure, gross_salary):
    gross = Decimal(str(gross_salary))
    basic = gross * (structure.basic_percentage / 100)
    hra = gross * (structure.hra_percentage / 100)
    special_allowance = gross * (structure.special_allowance_percentage / 100)
    pf = basic * (structure.pf_percentage / 100)
    esi = gross * (structure.esi_percentage / 100) if gross <= 21000 else Decimal('0')
    professional_tax = min(structure.professional_tax, gross)
    total_deductions = pf + esi + professional_tax
    net_salary = gross - total_deductions
    return {
        'basic_salary': round(basic, 2),
        'hra': round(hra, 2),
        'special_allowance': round(special_allowance, 2),
        'pf': round(pf, 2),
        'esi': round(esi, 2),
        'professional_tax': round(professional_tax, 2),
        'total_deductions': round(total_deductions, 2),
        'net_salary': round(net_salary, 2),
    }


def generate_payroll(employee, month, year, salary_structure_id=None):
    with transaction.atomic():
        existing = Payroll.objects.filter(employee=employee, month=month, year=year).first()
        if existing:
            return existing, False, 'Payroll already exists for this period'
        if not salary_structure_id:
            salary_structure_id = SalaryStructure.objects.filter(is_active=True).first()
            if not salary_structure_id:
                return None, False, 'No salary structure found'
        structure = SalaryStructure.objects.get(id=salary_structure_id) if isinstance(salary_structure_id, str) else salary_structure_id
        gross_salary = getattr(employee.designation, 'max_salary', Decimal('50000'))
        if not gross_salary:
            gross_salary = Decimal('50000')
        salary_calc = calculate_salary(structure, gross_salary)
        payroll = Payroll.objects.create(
            employee=employee, month=month, year=year,
            basic_salary=salary_calc['basic_salary'], gross_salary=gross_salary,
            total_deductions=salary_calc['total_deductions'], net_salary=salary_calc['net_salary'],
            status='DRAFT',
        )
        Allowance.objects.create(payroll=payroll, name='Basic Salary', amount=salary_calc['basic_salary'], is_taxable=True)
        Allowance.objects.create(payroll=payroll, name='HRA', amount=salary_calc['hra'], is_taxable=True)
        Allowance.objects.create(payroll=payroll, name='Special Allowance', amount=salary_calc['special_allowance'], is_taxable=False)
        Deduction.objects.create(payroll=payroll, deduction_type='PF', name='Provident Fund', amount=salary_calc['pf'])
        if salary_calc['esi'] > 0:
            Deduction.objects.create(payroll=payroll, deduction_type='ESI', name='Employee State Insurance', amount=salary_calc['esi'])
        Deduction.objects.create(payroll=payroll, deduction_type='PROFESSIONAL_TAX', name='Professional Tax', amount=salary_calc['professional_tax'])
        return payroll, True, 'Payroll generated'


def process_payroll(payroll_id, processed_by):
    with transaction.atomic():
        try:
            payroll = Payroll.objects.get(id=payroll_id, status='DRAFT')
        except Payroll.DoesNotExist:
            return None, False, 'Payroll not found or not in draft status'
        payroll.status = 'PROCESSED'
        payroll.processed_by = processed_by
        payroll.processed_at = timezone.now()
        payroll.save(update_fields=['status', 'processed_by', 'processed_at'])
        Payslip.objects.create(payroll=payroll)
        return payroll, True, 'Payroll processed'


def approve_payroll(payroll_id):
    try:
        payroll = Payroll.objects.get(id=payroll_id, status='PROCESSED')
    except Payroll.DoesNotExist:
        return None, False, 'Payroll not found or not in processed status'
    payroll.status = 'APPROVED'
    payroll.save(update_fields=['status'])
    return payroll, True, 'Payroll approved'


def mark_payroll_paid(payroll_id, payment_method='', transaction_id=''):
    try:
        payroll = Payroll.objects.get(id=payroll_id, status='APPROVED')
    except Payroll.DoesNotExist:
        return None, False, 'Payroll not found or not approved'
    payroll.status = 'PAID'
    payroll.paid_date = timezone.now().date()
    payroll.payment_method = payment_method
    payroll.transaction_id = transaction_id
    payroll.save(update_fields=['status', 'paid_date', 'payment_method', 'transaction_id'])
    return payroll, True, 'Payroll marked as paid'


def submit_reimbursement(employee, expense_type, amount, description, receipt):
    reimbursement = Reimbursement.objects.create(
        employee=employee, expense_type=expense_type, amount=amount,
        description=description, receipt=receipt, status='PENDING',
    )
    return reimbursement


def approve_reimbursement(reimbursement_id, reviewed_by, comments=''):
    try:
        reimbursement = Reimbursement.objects.get(id=reimbursement_id, status='PENDING')
    except Reimbursement.DoesNotExist:
        return None, False, 'Reimbursement not found or already processed'
    reimbursement.status = 'APPROVED'
    reimbursement.reviewed_by = reviewed_by
    reimbursement.reviewed_at = timezone.now()
    reimbursement.comments = comments
    reimbursement.save()
    return reimbursement, True, 'Reimbursement approved'


def reject_reimbursement(reimbursement_id, reviewed_by, comments=''):
    try:
        reimbursement = Reimbursement.objects.get(id=reimbursement_id, status='PENDING')
    except Reimbursement.DoesNotExist:
        return None, False, 'Reimbursement not found or already processed'
    reimbursement.status = 'REJECTED'
    reimbursement.reviewed_by = reviewed_by
    reimbursement.reviewed_at = timezone.now()
    reimbursement.comments = comments
    reimbursement.save()
    return reimbursement, True, 'Reimbursement rejected'


def get_payroll_summary(employee, year):
    payrolls = Payroll.objects.filter(employee=employee, year=year)
    return {
        'total_payrolls': payrolls.count(),
        'total_earned': sum(p.net_salary for p in payrolls),
        'total_deductions': sum(p.total_deductions for p in payrolls),
        'paid_count': payrolls.filter(status='PAID').count(),
        'pending_count': payrolls.exclude(status='PAID').count(),
    }


def bulk_generate_payroll(month, year, salary_structure_id=None):
    from apps.employees.models import Employee
    employees = Employee.objects.filter(is_active=True).select_related('user', 'designation')
    created = 0
    skipped = 0
    errors = []
    for employee in employees:
        payroll, success, message = generate_payroll(employee, month, year, salary_structure_id)
        if success:
            created += 1
        else:
            skipped += 1
            errors.append(f'{employee.employee_id}: {message}')
    return {'created': created, 'skipped': skipped, 'errors': errors}


def generate_payslip(employee, month, year, earnings_data, deductions_data, notes='', generated_by=None):
    with transaction.atomic():
        existing = Payslip.objects.filter(employee=employee, month=month, year=year).first()
        if existing:
            return existing, False, 'Payslip already exists for this period'

        gross_salary = sum(Decimal(str(e.get('amount', 0))) for e in earnings_data)
        total_deductions = sum(Decimal(str(d.get('amount', 0))) for d in deductions_data)
        net_salary = gross_salary - total_deductions

        payslip = Payslip.objects.create(
            employee=employee, month=month, year=year,
            gross_salary=gross_salary, total_deductions=total_deductions,
            net_salary=net_salary, generated_by=generated_by, notes=notes,
            status='DRAFT',
        )

        for e in earnings_data:
            PayslipEarning.objects.create(
                payslip=payslip, name=e['name'],
                amount=Decimal(str(e['amount'])),
            )

        for d in deductions_data:
            PayslipDeduction.objects.create(
                payslip=payslip, name=d['name'],
                amount=Decimal(str(d['amount'])),
            )

        _generate_payslip_file(payslip)

        return payslip, True, 'Payslip generated'


def upload_payslip(employee, month, year, pdf_file, generated_by=None):
    with transaction.atomic():
        existing = Payslip.objects.filter(employee=employee, month=month, year=year).first()
        if existing:
            if existing.pdf_file:
                existing.pdf_file.delete(save=False)
            existing.pdf_file = pdf_file
            existing.generated_by = generated_by
            existing.generated_date = timezone.now()
            existing.status = 'DRAFT'
            existing.save(update_fields=['pdf_file', 'generated_by', 'generated_date', 'status'])
            return existing, False, 'Payslip updated with new file'

        payslip = Payslip.objects.create(
            employee=employee, month=month, year=year,
            pdf_file=pdf_file, generated_by=generated_by,
            status='DRAFT',
        )
        return payslip, True, 'Payslip uploaded'


def publish_payslip(payslip_id):
    try:
        payslip = Payslip.objects.get(id=payslip_id)
    except Payslip.DoesNotExist:
        return None, False, 'Payslip not found'

    if payslip.status == 'PUBLISHED':
        return payslip, False, 'Payslip is already published'

    payslip.status = 'PUBLISHED'
    payslip.save(update_fields=['status'])

    month_name = MONTH_NAMES[payslip.month]
    create_notification(
        user=payslip.employee.user,
        notification_type='PAYROLL',
        title='Payslip Available',
        message=f'Your payslip for {month_name} {payslip.year} is now available for download.',
        action_url='/emp/payslips',
    )

    return payslip, True, 'Payslip published and employee notified'


def _generate_payslip_file(payslip):
    emp = payslip.employee
    earnings = payslip.earnings.all()
    deductions = payslip.payslip_deductions.all()
    month_name = MONTH_NAMES[payslip.month]
    dept_name = emp.department.name if emp.department else 'N/A'
    designation_name = emp.designation.name if emp.designation else 'N/A'

    lines = []
    lines.append('=' * 56)
    lines.append('                        PAY SLIP')
    lines.append(f'               {month_name} {payslip.year}')
    lines.append('=' * 56)
    lines.append('')
    lines.append(f'  Employee Name   : {emp.user.full_name}')
    lines.append(f'  Employee ID     : {emp.employee_id}')
    lines.append(f'  Department      : {dept_name}')
    lines.append(f'  Designation     : {designation_name}')
    lines.append(f'  Pay Period      : {month_name} {payslip.year}')
    lines.append('')
    lines.append('-' * 56)
    lines.append('  EARNINGS')
    lines.append('-' * 56)
    for e in earnings:
        lines.append(f'  {e.name:<30s}  {"{:,.2f}".format(e.amount):>15s}')
    lines.append(f'  {"GROSS SALARY":<30s}  {"{:,.2f}".format(payslip.gross_salary):>15s}')
    lines.append('')
    lines.append('-' * 56)
    lines.append('  DEDUCTIONS')
    lines.append('-' * 56)
    for d in deductions:
        lines.append(f'  {d.name:<30s}  {"{:,.2f}".format(d.amount):>15s}')
    lines.append(f'  {"TOTAL DEDUCTIONS":<30s}  {"{:,.2f}".format(payslip.total_deductions):>15s}')
    lines.append('')
    lines.append('=' * 56)
    lines.append(f'  {"NET PAY":<30s}  {"{:,.2f}".format(payslip.net_salary):>15s}')
    lines.append('=' * 56)
    lines.append('')
    lines.append(f'  Status: {payslip.status}')
    if payslip.notes:
        lines.append(f'  Notes: {payslip.notes}')
    lines.append('')
    lines.append('-' * 56)
    lines.append('  This is a computer-generated payslip.')
    lines.append('  For queries, contact HR department.')
    lines.append('-' * 56)

    content = '\n'.join(lines)
    filename = f'payslip_{emp.employee_id}_{payslip.month}_{payslip.year}.txt'

    from django.core.files.base import ContentFile
    payslip.pdf_file.save(filename, ContentFile(content.encode('utf-8')), save=False)
    payslip.save(update_fields=['pdf_file'])


def log_payslip_action(user, action, payslip=None, ip_address=None, user_agent='', details=''):
    try:
        PayslipAuditLog.objects.create(
            payslip=payslip,
            user=user if user and user.is_authenticated else None,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details
        )
    except Exception as e:
        import logging
        logger = logging.getLogger('apps')
        logger.error(f"Error logging payslip action: {str(e)}")


def encrypt_pdf(file_like_object, password):
    import pypdf
    from io import BytesIO
    try:
        reader = pypdf.PdfReader(file_like_object)
        writer = pypdf.PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.encrypt(password)
        out_buffer = BytesIO()
        writer.write(out_buffer)
        out_buffer.seek(0)
        return out_buffer
    except Exception as e:
        import logging
        logger = logging.getLogger('apps')
        logger.warning(f"Failed to encrypt PDF (non-pdf format or read error): {str(e)}")
        if hasattr(file_like_object, 'seek'):
            file_like_object.seek(0)
        return file_like_object


def extract_employee_id_from_text(text):
    import re
    # Match explicitly labeled Employee ID: EMP001
    match = re.search(r'(?:employee\s*id|emp\s*id|emp\s*code|employee\s*code)\s*[:\-#]?\s*([A-Za-z0-9_-]+)', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # General fallback pattern search (e.g. EMP001, MGR001)
    match = re.search(r'\b(EMP\d+|MGR\d+|HR\d+)\b', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    return None


def extract_financials_from_text(text):
    import re
    financials = {'gross_salary': 0.0, 'total_deductions': 0.0, 'net_salary': 0.0}
    
    net_match = re.search(r'(?:net\s*pay|net\s*salary|take\s*home)\s*[:\-]?\s*[\$₹]?\s*([0-9,]+\.?[0-9]*)', text, re.IGNORECASE)
    if net_match:
        try: financials['net_salary'] = float(net_match.group(1).replace(',', ''))
        except ValueError: pass
        
    gross_match = re.search(r'(?:gross\s*pay|gross\s*salary|total\s*earnings)\s*[:\-]?\s*[\$₹]?\s*([0-9,]+\.?[0-9]*)', text, re.IGNORECASE)
    if gross_match:
        try: financials['gross_salary'] = float(gross_match.group(1).replace(',', ''))
        except ValueError: pass
        
    ded_match = re.search(r'(?:total\s*deductions|deductions)\s*[:\-]?\s*[\$₹]?\s*([0-9,]+\.?[0-9]*)', text, re.IGNORECASE)
    if ded_match:
        try: financials['total_deductions'] = float(ded_match.group(1).replace(',', ''))
        except ValueError: pass
        
    return financials


def process_bulk_payslip_upload(upload_file, month, year, user):
    import zipfile
    import pypdf
    from io import BytesIO
    from django.core.files.base import ContentFile
    from apps.employees.models import Employee
    
    results = []
    
    # 1. Check if ZIP
    if zipfile.is_zipfile(upload_file):
        if hasattr(upload_file, 'seek'):
            upload_file.seek(0)
        with zipfile.ZipFile(upload_file) as z:
            for filename in z.namelist():
                if filename.endswith('/') or '__MACOSX' in filename:
                    continue
                
                file_data = z.read(filename)
                text = ""
                is_pdf = filename.lower().endswith('.pdf')
                
                if is_pdf:
                    try:
                        reader = pypdf.PdfReader(BytesIO(file_data))
                        for page in reader.pages:
                            text += page.extract_text() or ""
                    except Exception:
                        pass
                else:
                    text = file_data.decode('utf-8', errors='ignore')
                
                employee_id = extract_employee_id_from_text(text)
                financials = extract_financials_from_text(text)
                
                employee = None
                if employee_id:
                    employee = Employee.objects.filter(employee_id=employee_id).first()
                
                # Save Payslip
                payslip = Payslip.objects.create(
                    employee=employee,
                    month=month,
                    year=year,
                    gross_salary=financials['gross_salary'],
                    total_deductions=financials['total_deductions'],
                    net_salary=financials['net_salary'],
                    status='PENDING_VERIFICATION',
                    original_filename=filename,
                    generated_by=user
                )
                
                django_file = ContentFile(file_data, name=filename)
                payslip.pdf_file.save(filename, django_file, save=True)
                
                results.append({
                    'id': str(payslip.id),
                    'filename': filename,
                    'parsed_employee_id': employee_id,
                    'matched': employee is not None,
                    'employee_name': employee.user.full_name if employee else 'Not Found',
                    'net_salary': financials['net_salary']
                })
                
    # 2. Check if single merged PDF
    elif upload_file.name.lower().endswith('.pdf'):
        if hasattr(upload_file, 'seek'):
            upload_file.seek(0)
        try:
            reader = pypdf.PdfReader(upload_file)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                employee_id = extract_employee_id_from_text(text)
                financials = extract_financials_from_text(text)
                
                employee = None
                if employee_id:
                    employee = Employee.objects.filter(employee_id=employee_id).first()
                
                # Split page
                writer = pypdf.PdfWriter()
                writer.add_page(page)
                pdf_buffer = BytesIO()
                writer.write(pdf_buffer)
                pdf_content = pdf_buffer.getvalue()
                
                filename = f"payslip_{employee_id or 'unmapped'}_page{idx+1}.pdf"
                
                payslip = Payslip.objects.create(
                    employee=employee,
                    month=month,
                    year=year,
                    gross_salary=financials['gross_salary'],
                    total_deductions=financials['total_deductions'],
                    net_salary=financials['net_salary'],
                    status='PENDING_VERIFICATION',
                    original_filename=f"{upload_file.name} (Page {idx+1})",
                    generated_by=user
                )
                
                django_file = ContentFile(pdf_content, name=filename)
                payslip.pdf_file.save(filename, django_file, save=True)
                
                results.append({
                    'id': str(payslip.id),
                    'filename': f"Page {idx+1}",
                    'parsed_employee_id': employee_id,
                    'matched': employee is not None,
                    'employee_name': employee.user.full_name if employee else 'Not Found',
                    'net_salary': financials['net_salary']
                })
        except Exception as e:
            import logging
            logger = logging.getLogger('apps')
            logger.error(f"Error parsing merged PDF: {str(e)}")
            
    return results

