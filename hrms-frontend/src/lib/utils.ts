import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    ACTIVE: 'badge-success',
    PRESENT: 'badge-success',
    APPROVED: 'badge-success',
    PAID: 'badge-success',
    AVAILABLE: 'badge-success',
    RELIEVED: 'badge-success',
    INACTIVE: 'badge-danger',
    ABSENT: 'badge-danger',
    REJECTED: 'badge-danger',
    LOST: 'badge-danger',
    PENDING: 'badge-warning',
    DRAFT: 'badge-info',
    PUBLISHED: 'badge-success',
    ARCHIVED: 'badge-info',
    PROCESSED: 'badge-info',
    PROCESSING: 'badge-info',
    LATE: 'badge-warning',
    HALF_DAY: 'badge-warning',
    ON_NOTICE: 'badge-warning',
    MAINTENANCE: 'badge-warning',
    RETIRED: 'badge-info',
    CANCELLED: 'badge-danger',
    EXITED: 'badge-danger',
    PROBATION: 'badge-info',
  };
  return colors[status] || 'badge-info';
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    ADMIN: 'Admin',
    HR_ADMIN: 'HR Admin',
    HR_EXECUTIVE: 'HR Executive',
    MANAGER: 'Manager',
    TEAM_LEAD: 'Team Lead',
    EMPLOYEE: 'Employee',
  };
  return labels[role] || role;
}

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
