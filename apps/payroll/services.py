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


def number_to_words(number):
    number = int(number)
    if number == 0:
        return "Zero"
        
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
             "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    def helper(n):
        if n < 20:
            return units[n]
        elif n < 100:
            return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")
        elif n < 1000:
            return units[n // 100] + " Hundred" + (" and " + helper(n % 100) if n % 100 != 0 else "")
        elif n < 100000:
            thousands = n // 1000
            rem = n % 1000
            return helper(thousands) + " Thousand" + (" " + helper(rem) if rem != 0 else "")
        else:
            lakhs = n // 100000
            rem = n % 100000
            return helper(lakhs) + " Lakh" + (" " + helper(rem) if rem != 0 else "")
            
    words = helper(number)
    return words.strip() + " Rupees Only"


def draw_decorations(canvas, doc):
    from reportlab.lib import colors
    canvas.saveState()
    
    # 1. Top orange swoosh background
    canvas.setFillColor(colors.HexColor('#ea580c'))
    p = canvas.beginPath()
    p.moveTo(0, 842)
    p.lineTo(260, 842)
    p.curveTo(180, 800, 100, 720, 0, 680)
    p.close()
    canvas.drawPath(p, fill=True, stroke=False)
    
    # 2. Bottom right orange swoosh background
    canvas.setFillColor(colors.HexColor('#ea580c'))
    p = canvas.beginPath()
    p.moveTo(595, 0)
    p.lineTo(595, 140)
    p.curveTo(540, 90, 480, 30, 420, 0)
    p.close()
    canvas.drawPath(p, fill=True, stroke=False)
    
    # 3. Bottom left dark navy blue footer background
    canvas.setFillColor(colors.HexColor('#071c35'))
    p = canvas.beginPath()
    p.moveTo(0, 0)
    p.lineTo(420, 0)
    p.curveTo(340, 50, 180, 75, 0, 70)
    p.close()
    canvas.drawPath(p, fill=True, stroke=False)
    
    # 4. Thin orange stripe on top of footer
    canvas.setFillColor(colors.HexColor('#ea580c'))
    p = canvas.beginPath()
    p.moveTo(0, 70)
    p.curveTo(180, 75, 340, 50, 420, 0)
    p.lineTo(422, 0)
    p.curveTo(342, 53, 182, 78, 0, 73)
    p.close()
    canvas.drawPath(p, fill=True, stroke=False)
    
    # 5. Top Left "K" logo
    canvas.setFillColor(colors.HexColor('#ea580c'))
    # Stem
    stem = canvas.beginPath()
    stem.moveTo(35, 750)
    stem.lineTo(47, 750)
    stem.lineTo(47, 800)
    stem.lineTo(35, 800)
    stem.close()
    canvas.drawPath(stem, fill=True, stroke=False)
    # Top branch
    branch1 = canvas.beginPath()
    branch1.moveTo(47, 775)
    branch1.lineTo(65, 800)
    branch1.lineTo(77, 800)
    branch1.lineTo(53, 765)
    branch1.close()
    canvas.drawPath(branch1, fill=True, stroke=False)
    # Bottom branch
    branch2 = canvas.beginPath()
    branch2.moveTo(47, 765)
    branch2.lineTo(67, 750)
    branch2.lineTo(79, 750)
    branch2.lineTo(53, 775)
    branch2.close()
    canvas.drawPath(branch2, fill=True, stroke=False)
    
    # 6. Top Right Company Details
    canvas.setFillColor(colors.HexColor('#111827'))
    canvas.setFont('Helvetica-Bold', 22)
    canvas.drawRightString(560, 780, "KODERZ")
    
    canvas.setFillColor(colors.HexColor('#ea580c'))
    canvas.setFont('Helvetica-Bold', 10)
    canvas.drawRightString(560, 768, "TECHNOLOGY")
    
    canvas.setFillColor(colors.HexColor('#4b5563'))
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(560, 752, "info@koderztechnology.com")
    canvas.drawRightString(560, 742, "www.koderztechnology.com")
    
    # 7. Bottom Footer Text
    canvas.setFillColor(colors.HexColor('#ffffff'))
    canvas.setFont('Helvetica-Bold', 7.5)
    canvas.drawString(30, 48, "170 Homefield Park, Grove Road, Sutton, SM1 2DZ, England")
    canvas.setFont('Helvetica', 7)
    canvas.drawString(30, 39, "Phone: +1 (845) 915-4360")
    
    canvas.setFont('Helvetica-Bold', 7.5)
    canvas.drawString(30, 26, "501, 5th Floor, Bagmane Tech Park, C V Raman Nagar, Bangalore")
    canvas.setFont('Helvetica', 7)
    canvas.drawString(30, 17, "Phone: +91 976 619 9667")
    
    canvas.setFont('Helvetica-Bold', 8)
    canvas.drawRightString(400, 36, "hrd@koderztechnology.com")
    canvas.drawRightString(400, 24, "careers@koderztechnology.com")
    
    canvas.restoreState()


def _generate_payslip_file(payslip):
    import hashlib
    from io import BytesIO
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from django.core.files.base import ContentFile
    from apps.attendance.models import Attendance
    import calendar

    emp = payslip.employee
    earnings = list(payslip.earnings.all())
    deductions = list(payslip.payslip_deductions.all())
    month_name = MONTH_NAMES[payslip.month]
    dept_name = emp.department.name if emp.department else 'N/A'
    designation_name = emp.designation.name if emp.designation else 'N/A'

    # Compute attendance metrics
    try:
        att_qs = Attendance.objects.filter(employee=emp, date__year=payslip.year, date__month=payslip.month)
        present_count = att_qs.filter(status__in=['PRESENT', 'LATE', 'WFH']).count()
        half_day_count = att_qs.filter(status='HALF_DAY').count()
        absent_count = att_qs.filter(status='ABSENT').count()
        leave_count = att_qs.filter(status='LEAVE').count()
        holiday_count = att_qs.filter(status='HOLIDAY').count()
        
        present_days = float(present_count) + float(half_day_count) * 0.5
        absent_days = float(absent_count) + float(half_day_count) * 0.5
        
        if att_qs.count() == 0:
            present_days = 30.0
            absent_days = 0.0
            payable_days = 30.0
        else:
            payable_days = present_days + float(leave_count) + float(holiday_count)
    except Exception:
        present_days = 30.0
        absent_days = 0.0
        payable_days = 30.0

    def fmt_days(val):
        return f"{int(val)}" if val.is_integer() else f"{val:.1f}"

    # Stable Bank Account Number
    h = hashlib.sha256(emp.employee_id.encode('utf-8')).hexdigest()
    bank_acc_num = ''.join(filter(str.isdigit, h))[:10] or "1234567890"
    bank_acc_str = f"77780{bank_acc_num}"[:14]

    # Convert Net Pay to Words
    net_pay_words = number_to_words(payslip.net_salary)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=135,
        bottomMargin=95
    )

    story = []
    styles = getSampleStyleSheet()

    # Metadata Table
    meta_data = [
        [Paragraph("<b>Name of Employee</b>", styles['Normal']), Paragraph(f"{emp.user.first_name} {emp.user.last_name}", styles['Normal']),
         Paragraph("<b>Salary Slip for the month of</b>", styles['Normal']), Paragraph(f"{month_name}-{str(payslip.year)[2:]}", styles['Normal'])],
        [Paragraph("<b>Designation</b>", styles['Normal']), Paragraph(designation_name, styles['Normal']),
         Paragraph("<b>Present Days</b>", styles['Normal']), Paragraph(fmt_days(present_days), styles['Normal'])],
        [Paragraph("<b>Employee ID</b>", styles['Normal']), Paragraph(emp.employee_id, styles['Normal']),
         Paragraph("<b>Absent Days</b>", styles['Normal']), Paragraph(fmt_days(absent_days), styles['Normal'])],
        [Paragraph("<b>Bank A/c No.</b>", styles['Normal']), Paragraph(bank_acc_str, styles['Normal']),
         Paragraph("<b>Payable Days</b>", styles['Normal']), Paragraph(fmt_days(payable_days), styles['Normal'])],
    ]

    meta_table = Table(meta_data, colWidths=[125, 145, 150, 115])
    meta_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ffffff')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # Salary breakdown table
    max_len = max(len(earnings), len(deductions))
    breakdown_data = [
        ["A", "Amount in Rs", "B", "Amount in Rs"],
        ["Earnings", "", "Deductions", ""]
    ]

    for i in range(max_len):
        row = ["", "", "", ""]
        if i < len(earnings):
            row[0] = earnings[i].name
            row[1] = f"{earnings[i].amount:,.2f}"
        if i < len(deductions):
            row[2] = deductions[i].name
            row[3] = f"{deductions[i].amount:,.2f}"
        breakdown_data.append(row)

    # Add totals & summary
    breakdown_data.append([
        "Total Earnings (A)", f"{payslip.gross_salary:,.2f}",
        "Total Deduction (B)", f"{payslip.total_deductions:,.2f}"
    ])
    breakdown_data.append([
        "Earned Salary (Net Pay)", f"{payslip.net_salary:,.2f}/-",
        "", ""
    ])
    breakdown_data.append([
        f"( {net_pay_words} )", "", "", ""
    ])

    breakdown_table = Table(breakdown_data, colWidths=[165, 100, 170, 100])
    
    bt_styles = [
        ('GRID', (0,0), (-1,-4), 0.5, colors.HexColor('#d1d5db')),
        ('LINEBELOW', (0,0), (-1,1), 1.2, colors.HexColor('#9ca3af')),
        ('BACKGROUND', (0,0), (-1,1), colors.HexColor('#f9fafb')),
        
        ('GRID', (0,-3), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
        
        ('SPAN', (0,1), (1,1)),
        ('SPAN', (2,1), (3,1)),
        ('SPAN', (0,-2), (1,-2)),
        ('SPAN', (2,-2), (3,-2)),
        ('SPAN', (0,-1), (3,-1)),
        
        ('FONTNAME', (0,0), (-1,1), 'Helvetica-Bold'),
        ('FONTNAME', (0,-3), (-1,-2), 'Helvetica-Bold'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Oblique'),
        
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-2), 'RIGHT'),
        ('ALIGN', (3,0), (3,-2), 'RIGHT'),
        ('ALIGN', (0,-1), (-1,-1), 'CENTER'),
        
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
    ]

    breakdown_table.setStyle(TableStyle(bt_styles))
    story.append(breakdown_table)
    story.append(Spacer(1, 45))

    # Signatures
    sig_data = [
        ["Employer Signature", "Employee Signature"],
        ["", ""],
        ["", ""],
        ["_________________________", "_________________________"]
    ]
    sig_table = Table(sig_data, colWidths=[267, 268])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 25))

    # Footer note
    note_style = ParagraphStyle(
        'FooterNote',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=colors.HexColor('#9ca3af'),
        alignment=1
    )
    story.append(Paragraph("This is system generated payslip", note_style))

    # Generate document
    doc.build(story, onFirstPage=draw_decorations)

    pdf_data = buffer.getvalue()
    buffer.close()

    filename = f'payslip_{emp.employee_id}_{payslip.month}_{payslip.year}.pdf'
    payslip.pdf_file.save(filename, ContentFile(pdf_data), save=False)
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

