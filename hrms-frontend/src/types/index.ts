export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  roles?: UserRole[];
}

export interface UserRole {
  id: string;
  role: string;
  role_name: string;
  assigned_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface PaginatedResponse<T> {
  pagination: {
    count: number;
    total_pages: number;
    current_page: number;
    next: string | null;
    previous: string | null;
    page_size: number;
  };
  data: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  registration_number: string;
  tax_id: string;
  website: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  employee_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  company: string;
  company_name: string;
  name: string;
  slug: string;
  code: string;
  description: string;
  head_name: string | null;
  parent: string | null;
  parent_name: string | null;
  employee_count: number;
  is_active: boolean;
}

export interface Designation {
  id: string;
  name: string;
  slug: string;
  department: string;
  department_name: string;
  level: number;
  min_salary: number;
  max_salary: number;
  is_active: boolean;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
  is_active: boolean;
}

export interface Team {
  id: string;
  department: string;
  department_name: string;
  name: string;
  slug: string;
  lead_name: string | null;
  member_count: number;
  is_active: boolean;
}

export interface Employee {
  id: string;
  user: string;
  user_full_name: string;
  email: string;
  employee_id: string;
  employee_code: string;
  company: string;
  department: string;
  department_name: string;
  designation: string;
  designation_name: string;
  team: string;
  team_name: string;
  manager: string;
  manager_name: string | null;
  employment_type: string;
  status: string;
  date_of_joining: string;
  date_of_exit: string | null;
  work_email: string;
  location: string;
  location_name: string;
  reporting_to: string | null;
  notice_period_days: number;
  probation_end_date: string | null;
  personal_info?: EmployeePersonalInfo;
  addresses?: EmployeeAddress[];
  emergency_contacts?: EmployeeEmergencyContact[];
  education?: EmployeeEducation[];
  experience?: EmployeeExperience[];
  documents?: EmployeeDocument[];
  created_at: string;
}

export interface EmployeePersonalInfo {
  id: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  nationality: string;
  blood_group: string;
  father_name: string;
  mother_name: string;
  pan_number: string;
  aadhaar_number: string;
  photo: string | null;
}

export interface EmployeeAddress {
  id: string;
  address_type: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}

export interface EmployeeEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone_number: string;
  is_primary: boolean;
}

export interface EmployeeEducation {
  id: string;
  degree: string;
  institution: string;
  specialization: string;
  university: string;
  start_year: number;
  end_year: number | null;
  grade: string;
}

export interface EmployeeExperience {
  id: string;
  company_name: string;
  designation: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

export interface Attendance {
  id: string;
  employee: string;
  employee_name: string;
  employee_id: string;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: number;
  overtime_hours: number;
  is_approved: boolean;
  notes: string;
  breaks?: AttendanceBreak[];
  logs?: AttendanceLog[];
}

export interface AttendanceBreak {
  id: string;
  break_type: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
}

export interface AttendanceLog {
  id: string;
  action: string;
  timestamp: string;
  ip_address: string;
}

export interface LeaveType {
  id: string;
  name: string;
  slug: string;
  days_per_year: number;
  is_paid: boolean;
  is_carry_forward: boolean;
  max_carry_forward_days: number;
  is_encashable: boolean;
  is_active: boolean;
}

export interface LeaveBalance {
  id: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  leave_type_name: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  carry_forward_days: number;
  available_days: number;
}

export interface LeaveApplication {
  id: string;
  employee: string;
  employee_name: string;
  employee_id: string;
  leave_type: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  applied_at: string;
  is_emergency: boolean;
  reviewed_by?: string;
  reviewed_by_name?: string;
  review_comments: string;
  approvals?: any[];
}

export interface LeaveApproval {
  id: string;
  leave_application: string;
  approver: string;
  approver_name: string;
  status: string;
  level: number;
  comments: string;
  approved_at: string | null;
}

export interface Payroll {
  id: string;
  employee: string;
  employee_name: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  status: string;
  paid_date: string | null;
  allowances?: Allowance[];
  deductions?: Deduction[];
}

export interface Payslip {
  id: string;
  employee: string;
  employee_name: string;
  employee_id: string;
  department_name?: string;
  designation_name?: string;
  month: number;
  year: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  status: string;
  generated_date: string;
  generated_by: string | null;
  generated_by_name: string | null;
  notes?: string;
  earnings?: PayslipEarning[];
  payslip_deductions?: PayslipDeduction[];
  has_pdf: boolean;
  pdf_file: string | null;
  publish_at?: string | null;
  original_filename?: string;
}

export interface PayslipEarning {
  id: string;
  name: string;
  amount: number;
}

export interface PayslipDeduction {
  id: string;
  name: string;
  amount: number;
}

export interface Allowance {
  id: string;
  name: string;
  amount: number;
  is_taxable: boolean;
}

export interface Deduction {
  id: string;
  deduction_type: string;
  name: string;
  amount: number;
}

export interface Asset {
  id: string;
  name: string;
  asset_code: string;
  category: string;
  status: string;
  brand: string;
  model_name: string;
  purchase_date: string;
  purchase_price: number;
  condition: string;
  assigned_to_name: string | null;
}

export interface AssetAssignment {
  id: string;
  asset: string;
  asset_name: string;
  asset_code: string;
  employee: string;
  employee_name: string;
  assigned_date: string;
  is_returned: boolean;
  condition_at_assignment: string;
}

export interface Resignation {
  id: string;
  employee: string;
  employee_name: string;
  employee_id: string;
  last_working_day: string;
  status: string;
  notice_period_days: number;
  applied_date: string;
  is_relieved: boolean;
}

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url: string;
}

export interface DashboardStats {
  total_employees: number;
  present_today: number;
  absent_today: number;
  pending_leaves: number;
  active_leaves_today: number;
  new_joins_this_month: number;
  exits_this_month: number;
  pending_resignations: number;
  asset_stats: { total: number; assigned: number };
  payroll_stats: { total_gross: number; total_deductions: number; total_net: number };
}

export interface EmployeeDocument {
  id: string;
  employee: string;
  document_type: string;
  title: string;
  file: string;
  description: string;
  expiry_date: string | null;
  created_at: string;
}

export interface SalaryStructure {
  id: string;
  name: string;
  description: string;
  basic_percentage: number;
  hra_percentage: number;
  special_allowance_percentage: number;
  pf_percentage: number;
  esi_percentage: number;
  professional_tax: number;
  is_active: boolean;
}

export interface Reimbursement {
  id: string;
  employee: string;
  employee_name: string;
  expense_type: string;
  amount: number;
  description: string;
  receipt: string;
  status: string;
  reviewed_by: string;
  reviewed_at: string | null;
  comments: string;
  created_at: string;
}

export interface ResignationDetail {
  id: string;
  employee: string;
  employee_name: string;
  employee_id: string;
  last_working_day: string;
  reason: string;
  status: string;
  notice_period_days: number;
  applied_date: string;
  is_relieved: boolean;
  approvals: LeaveApproval[];
}

export interface FullAndFinal {
  id: string;
  resignation: string;
  employee_name: string;
  status: string;
  final_settlement_amount: number;
  pending_dues: number;
  assets_returned: boolean;
  documents_submitted: boolean;
  access_revoked: boolean;
  completed_at: string | null;
  notes: string;
}

export interface ExperienceLetter {
  id: string;
  employee: string;
  employee_name: string;
  issue_date: string;
  letter_file: string;
}

export interface PayslipAuditLog {
  id: string;
  payslip: string | null;
  payslip_period: string;
  employee_id: string | null;
  employee_name: string | null;
  user: string | null;
  user_name: string | null;
  action: 'UPLOAD' | 'PUBLISH' | 'VIEW' | 'DOWNLOAD' | 'DELETE';
  timestamp: string;
  ip_address: string | null;
  user_agent: string;
  details: string;
}
