import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useRedux';
import api from '../../api/axios';
import type { Employee } from '../../types';
import { formatDate, getStatusColor, formatCurrency } from '../../lib/utils';
import {
  ArrowLeft, User, Mail, Phone, Building2, MapPin, Calendar, Briefcase, FileText,
  CheckCircle2, AlertCircle, Trash2, Download, Upload, ShieldAlert
} from 'lucide-react';

const DOCUMENT_SLOTS = [
  { type: 'AADHAAR', label: 'Aadhaar Card', description: 'Mandatory 12-digit Indian national identity card', required: true },
  { type: 'PAN', label: 'PAN Card', description: 'Mandatory Indian Permanent Account Number card', required: true },
  { type: 'RESUME', label: 'Resume / CV', description: 'Mandatory latest curriculum vitae document', required: true },
  { type: 'PASSPORT', label: 'Passport', description: 'Optional national passport copy', required: false },
  { type: 'DRIVING_LICENSE', label: 'Driving License', description: 'Optional state-issued driving permit copy', required: false },
  { type: 'OFFER_LETTER', label: 'Offer Letter', description: 'Optional company signed job offer letter', required: false },
  { type: 'APPOINTMENT_LETTER', label: 'Appointment Letter', description: 'Optional employment appointment document', required: false },
  { type: 'EXPERIENCE', label: 'Experience Letter', description: 'Optional previous employment experience letter', required: false },
  { type: 'EDUCATION', label: 'Education Certificate', description: 'Optional degree or board marksheet certificate', required: false },
  { type: 'OTHER', label: 'Other Documents', description: 'Any other miscellaneous employee documents', required: false },
];

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR_ADMIN';
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'education' | 'experience' | 'documents'>('overview');
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => { if (id) fetchEmployee(); }, [id]);

  const fetchEmployee = async () => {
    try {
      const res = await api.get(`/employees/${id}/`);
      setEmployee(res.data.data || res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string, label: string) => {
    const file = event.target.files?.[0];
    if (!file || !employee) return;

    setUploadingType(type);
    const formData = new FormData();
    formData.append('employee', employee.id);
    formData.append('document_type', type);
    formData.append('title', label);
    formData.append('file', file);

    try {
      await api.post('/employees/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchEmployee();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingType(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/employees/documents/${docId}/`);
      fetchEmployee();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  if (!employee) return <div className="text-center py-12 text-gray-400">Employee not found</div>;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'personal', label: 'Personal' },
    { key: 'education', label: 'Education' },
    { key: 'experience', label: 'Experience' },
    { key: 'documents', label: 'Documents' },
  ] as const;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft size={18} /> Back to Employees
      </button>

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {employee.user_full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{employee.user_full_name}</h2>
            <p className="text-gray-500">{employee.employee_id} &middot; {employee.designation_name || 'No designation'}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className={`badge ${getStatusColor(employee.status)}`}>{employee.status}</span>
              <span className="badge badge-info">{employee.employment_type?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-600"><Mail size={16} className="text-gray-400" /> {employee.email}</div>
          <div className="flex items-center gap-2 text-gray-600"><Building2 size={16} className="text-gray-400" /> {employee.department_name || '-'}</div>
          <div className="flex items-center gap-2 text-gray-600"><Calendar size={16} className="text-gray-400" /> Joined {formatDate(employee.date_of_joining)}</div>
          <div className="flex items-center gap-2 text-gray-600"><User size={16} className="text-gray-400" /> {employee.manager_name || 'No manager'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ['Employee ID', employee.employee_id],
              ['Work Email', employee.work_email || '-'],
              ['Location', employee.location || '-'],
              ['Team', employee.team_name || '-'],
              ['Notice Period', `${employee.notice_period_days} days`],
              ['Probation End', employee.probation_end_date ? formatDate(employee.probation_end_date) : '-'],
              ['Date of Exit', employee.date_of_exit ? formatDate(employee.date_of_exit) : '-'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-sm text-gray-500">{label}</div>
                <div className="mt-1 font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="space-y-6">
            {/* Personal Details */}
            <div>
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Personal Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-150/40">
                {[
                  ['Date of Birth', employee.personal_info?.date_of_birth ? formatDate(employee.personal_info.date_of_birth) : '-'],
                  ['Gender', employee.personal_info?.gender || '-'],
                  ['Marital Status', employee.personal_info?.marital_status || '-'],
                  ['Nationality', employee.personal_info?.nationality || '-'],
                  ['Personal Email', employee.personal_info?.personal_email || '-'],
                  ['Blood Group', employee.personal_info?.blood_group || '-'],
                  ['Father Name', employee.personal_info?.father_name || '-'],
                  ['Mother Name', employee.personal_info?.mother_name || '-'],
                  ['PAN Number', employee.personal_info?.pan_number || '-'],
                  ['Aadhaar Number', employee.personal_info?.aadhaar_number || '-'],
                  ['Passport', employee.personal_info?.passport_number || '-'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs font-bold text-gray-400">{label}</div>
                    <div className="mt-1 font-semibold text-gray-700">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Address Details</h4>
              {!employee.addresses || employee.addresses.length === 0 ? (
                <div className="text-sm text-gray-400 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">No addresses registered</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.addresses.map((addr) => (
                    <div key={addr.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-150/40 relative">
                      <span className="absolute top-4 right-4 text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-orange-100 text-[#ea580c]">
                        {addr.address_type}
                      </span>
                      <div className="text-xs font-bold text-gray-400">Address</div>
                      <div className="mt-1 text-sm font-semibold text-gray-700">
                        {addr.address_line_1}
                        {addr.address_line_2 && `, ${addr.address_line_2}`}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 mt-1">
                        {addr.city}, {addr.state}, {addr.country} - {addr.postal_code}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Contacts */}
            <div>
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Emergency Contacts</h4>
              {!employee.emergency_contacts || employee.emergency_contacts.length === 0 ? (
                <div className="text-sm text-gray-400 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">No emergency contacts registered</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.emergency_contacts.map((contact) => (
                    <div key={contact.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-150/40 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-gray-700">{contact.name}</div>
                        <div className="text-xs text-gray-400 font-bold uppercase mt-0.5">{contact.relationship}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-700 flex items-center gap-1 justify-end"><Phone size={12} /> {contact.phone_number}</div>
                        {contact.email && <div className="text-xs text-gray-400 font-medium mt-0.5">{contact.email}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-4">
            {employee.education?.length === 0 ? <p className="text-gray-400">No education records</p> : employee.education?.map((edu) => (
              <div key={edu.id} className="p-4 border border-gray-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800">{edu.degree}</div>
                    <div className="text-sm text-gray-500">{edu.institution}</div>
                  </div>
                  <div className="text-right text-sm text-gray-400">{edu.start_year} - {edu.end_year || 'Present'}</div>
                </div>
                {edu.specialization && <div className="text-sm text-gray-500 mt-1">Specialization: {edu.specialization}</div>}
                {edu.grade && <div className="text-sm text-gray-500">Grade: {edu.grade}</div>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-4">
            {employee.experience?.length === 0 ? <p className="text-gray-400">No experience records</p> : employee.experience?.map((exp) => (
              <div key={exp.id} className="p-4 border border-gray-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800">{exp.designation}</div>
                    <div className="text-sm text-gray-500">{exp.company_name}</div>
                  </div>
                  <div className="text-right text-sm text-gray-400">{formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Present'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documents' && (() => {
          const uploadedMandatoryCount = DOCUMENT_SLOTS.filter(
            slot => slot.required && employee.documents?.some(doc => doc.document_type === slot.type)
          ).length;
          const compliancePercentage = Math.round((uploadedMandatoryCount / 3) * 100);

          return (
            <div>
              {/* Compliance Banner */}
              <div className={`p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border ${
                compliancePercentage === 100
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}>
                <div className="flex items-center gap-3">
                  {compliancePercentage === 100 ? (
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  ) : (
                    <ShieldAlert size={24} className="text-amber-600" />
                  )}
                  <div>
                    <h4 className="font-semibold text-sm md:text-base">
                      Document Compliance: {compliancePercentage}%
                    </h4>
                    <p className="text-[11px] md:text-xs opacity-90 mt-0.5">
                      {compliancePercentage === 100
                        ? 'All mandatory documents (Aadhaar Card, PAN Card, Resume) have been uploaded.'
                        : 'Missing mandatory onboarding documents. Please upload Aadhaar Card, PAN Card, and Resume.'}
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-32 bg-gray-200 rounded-full h-2 overflow-hidden flex-shrink-0">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      compliancePercentage === 100 ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                    style={{ width: `${compliancePercentage}%` }}
                  />
                </div>
              </div>

              {/* Document Slots Checklist */}
              <div className="space-y-3">
                {DOCUMENT_SLOTS.map((slot) => {
                  const doc = employee.documents?.find(d => d.document_type === slot.type);
                  const isUploaded = !!doc;
                  const inputId = `file-input-${slot.type}`;
                  
                  return (
                    <div key={slot.type} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isUploaded 
                        ? 'bg-white border-gray-100 hover:border-gray-200 shadow-sm' 
                        : slot.required 
                          ? 'bg-red-50/20 border-red-100 hover:border-red-200' 
                          : 'bg-gray-50/50 border-gray-100/80'
                    }`}>
                      {/* Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          isUploaded 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : slot.required 
                              ? 'bg-red-50 text-red-600' 
                              : 'bg-gray-100 text-gray-400'
                        }`}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 text-sm">{slot.label}</span>
                            {slot.required && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">REQUIRED</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{slot.description}</p>
                          {isUploaded && doc && (
                            <p className="text-[10px] text-gray-400 mt-1 font-mono">
                              Uploaded: {formatDate(doc.created_at)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge & Actions */}
                      <div className="flex items-center gap-3 justify-between sm:justify-end flex-shrink-0">
                        {isUploaded ? (
                          <>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Uploaded
                            </span>
                            <div className="flex items-center gap-1">
                              {doc && (
                                <a
                                  href={doc.file}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title="Download Document"
                                >
                                  <Download size={16} />
                                </a>
                              )}
                              {isHrOrAdmin && doc && (
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                  title="Delete Document"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                              slot.required 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              <AlertCircle size={12} /> {slot.required ? 'Missing' : 'Not Uploaded'}
                            </span>
                            {isHrOrAdmin && (
                              <div>
                                <input
                                  id={inputId}
                                  type="file"
                                  ref={(el) => { fileInputRefs.current[slot.type] = el; }}
                                  onChange={(e) => handleFileUpload(e, slot.type, slot.label)}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <button
                                  onClick={() => fileInputRefs.current[slot.type]?.click()}
                                  disabled={uploadingType === slot.type}
                                  className={`btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 ${
                                    slot.required ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : ''
                                  }`}
                                >
                                  <Upload size={14} /> 
                                  {uploadingType === slot.type ? 'Uploading...' : 'Upload'}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
