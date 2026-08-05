import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Users, CalendarCheck, Clock, FileCheck, UserCheck, AlertCircle } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  employee: number;
  employee_name: string;
  date: string;
  status: string;
  check_in_time: string;
  check_out_time: string;
  is_approved: boolean;
}

interface LeaveApproval {
  id: number;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  days: number;
  status: string;
  approval_level: string;
}

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  department_name: string;
  designation_name: string;
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveApproval[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [attendanceRes, leavesRes, teamRes] = await Promise.all([
        api.get(`/attendance/monthly/?month=${today.slice(5, 7)}&year=${today.slice(0, 4)}`),
        api.get('/leave/pending-approvals/'),
        api.get('/employees/?search=')
      ]);
      setAttendance(attendanceRes.data.results || attendanceRes.data);
      setPendingLeaves(leavesRes.data.results || leavesRes.data);
      setTeamMembers(teamRes.data.results || teamRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentCount = todayAttendance.filter(a => a.status === 'PRESENT' || a.status === 'WORK_FROM_HOME').length;
  const absentCount = todayAttendance.filter(a => a.status === 'ABSENT').length;
  const lateCount = todayAttendance.filter(a => a.status === 'LATE').length;
  const pendingLeaveCount = pendingLeaves.filter(l => l.status === 'PENDING').length;
  const unapprovedCount = todayAttendance.filter(a => !a.is_approved && a.status !== 'ABSENT').length;

  const stats = [
    { label: 'Present Today', value: presentCount, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Absent Today', value: absentCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Late Today', value: lateCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Leaves', value: pendingLeaveCount, icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Unapproved Attendance', value: unapprovedCount, icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Team Size', value: teamMembers.length, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <span className="text-sm text-gray-500">{todayStr}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/manager/leaves')}
          className="btn-primary flex items-center justify-center gap-2 py-4"
        >
          <FileCheck className="w-5 h-5" />
          Approve Leaves ({pendingLeaveCount})
        </button>
        <button
          onClick={() => navigate('/manager/team')}
          className="btn-primary flex items-center justify-center gap-2 py-4"
        >
          <Users className="w-5 h-5" />
          View Team ({teamMembers.length})
        </button>
        <button
          onClick={() => navigate('/manager/attendance')}
          className="btn-primary flex items-center justify-center gap-2 py-4"
        >
          <CalendarCheck className="w-5 h-5" />
          Approve Attendance ({unapprovedCount})
        </button>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members - Today's Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header text-left">Employee</th>
                <th className="table-header text-left">Employee ID</th>
                <th className="table-header text-left">Department</th>
                <th className="table-header text-left">Today's Status</th>
                <th className="table-header text-left">Approved</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                const memberAttendance = todayAttendance.find(a => a.employee === member.id);
                const status = memberAttendance?.status || 'NO_RECORD';
                return (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-emerald-700">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{member.employee_id}</td>
                    <td className="table-cell text-gray-600">{member.department_name}</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(status)}`}>{status}</span>
                    </td>
                    <td className="table-cell">
                      {memberAttendance ? (
                        <span className={`badge ${memberAttendance.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {memberAttendance.is_approved ? 'Yes' : 'Pending'}
                        </span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-500">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {teamMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-gray-500 py-8">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingLeaves.length > 0 && (
        <div className="card">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header text-left">Employee</th>
                  <th className="table-header text-left">Leave Type</th>
                  <th className="table-header text-left">From</th>
                  <th className="table-header text-left">To</th>
                  <th className="table-header text-left">Days</th>
                  <th className="table-header text-left">Level</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.filter(l => l.status === 'PENDING').slice(0, 5).map((leave) => (
                  <tr key={leave.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell font-medium text-gray-900">{leave.employee_name}</td>
                    <td className="table-cell text-gray-600">{leave.leave_type}</td>
                    <td className="table-cell text-gray-600">{leave.from_date}</td>
                    <td className="table-cell text-gray-600">{leave.to_date}</td>
                    <td className="table-cell text-gray-600">{leave.days}</td>
                    <td className="table-cell">
                      <span className="badge bg-blue-100 text-blue-700">{leave.approval_level}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PRESENT': return 'bg-emerald-100 text-emerald-700';
    case 'WORK_FROM_HOME': return 'bg-blue-100 text-blue-700';
    case 'ABSENT': return 'bg-red-100 text-red-700';
    case 'LATE': return 'bg-amber-100 text-amber-700';
    case 'HALF_DAY': return 'bg-orange-100 text-orange-700';
    case 'ON_LEAVE': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-500';
  }
}
