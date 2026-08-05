import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Company, Department, Designation, Location } from '../../types';
import { Building2, MapPin, Users, Briefcase } from 'lucide-react';

export default function OrganizationPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'company' | 'departments' | 'designations' | 'locations'>('company');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [compRes, deptRes, desigRes, locRes] = await Promise.all([
        api.get('/organization/companies/'),
        api.get('/organization/departments/'),
        api.get('/organization/designations/'),
        api.get('/organization/locations/'),
      ]);
      setCompany(compRes.data.data?.[0] || null);
      setDepartments(deptRes.data.data);
      setDesignations(desigRes.data.data);
      setLocations(locRes.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const tabs = [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'departments', label: 'Departments', icon: Users },
    { key: 'designations', label: 'Designations', icon: Briefcase },
    { key: 'locations', label: 'Locations', icon: MapPin },
  ] as const;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Organization</h2>
        <p className="text-gray-500">Manage company structure and hierarchy</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Company */}
      {activeTab === 'company' && company && (
        <div className="card p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Company Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ['Name', company.name],
              ['Code', company.code],
              ['Registration No.', company.registration_number],
              ['Website', company.website || '-'],
              ['Email', company.email],
              ['Phone', company.phone],
              ['Address', [company.address_line1, company.city, company.state, company.country].filter(Boolean).join(', ')],
              ['Tax ID', company.tax_id || '-'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-sm text-gray-500">{label}</div>
                <div className="mt-1 font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Departments */}
      {activeTab === 'departments' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Head</th>
                  <th className="px-6 py-3">Parent</th>
                  <th className="px-6 py-3">Employee Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{d.name}</td>
                    <td className="table-cell font-mono text-xs">{d.code}</td>
                    <td className="table-cell">{d.head_name || '-'}</td>
                    <td className="table-cell">{d.parent_name || '-'}</td>
                    <td className="table-cell">{d.employee_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Designations */}
      {activeTab === 'designations' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {designations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{d.name}</td>
                    <td className="table-cell font-mono text-xs">{d.code}</td>
                    <td className="table-cell">{d.department_name || '-'}</td>
                    <td className="table-cell">{d.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Locations */}
      {activeTab === 'locations' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{l.name}</td>
                    <td className="table-cell font-mono text-xs">{l.code}</td>
                    <td className="table-cell">{l.city}</td>
                    <td className="table-cell">{l.state}</td>
                    <td className="table-cell">{l.country}</td>
                    <td className="table-cell">{l.is_default ? <span className="badge badge-success">Default</span> : '-'}</td>
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
