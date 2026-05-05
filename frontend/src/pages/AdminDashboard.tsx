import React, { useState } from 'react';
import { Users, Shield, CheckCircle2, ShieldAlert } from 'lucide-react';

const SYSTEM_USERS = [
  { id: 1, name: 'Alex Waverly', email: 'alex@uni.edu', role: 'student', active: true },
  { id: 2, name: 'Mr. Thompson', email: 'thompson@uni.edu', role: 'teacher', active: true },
  { id: 3, name: 'Admin User', email: 'admin@uni.edu', role: 'admin', active: true },
  { id: 4, name: 'Sarah Jenkins', email: 'sarah@uni.edu', role: 'student', active: true },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState(SYSTEM_USERS);

  const toggleRole = (userId: number, currentRole: string) => {
    const nextRole = currentRole === 'student' ? 'teacher' : (currentRole === 'teacher' ? 'admin' : 'student');
    setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole } : u));
  };

  return (
    <div className="space-y-8 py-2 page-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy tracking-tight">Admin Console</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage system roles, access, and global configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Total Users</p>
            <h3 className="text-3xl font-bold text-brand-navy">1,042</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
            <Users size={20} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">System Status</p>
            <h3 className="text-xl font-bold text-brand-emerald mt-1 flex items-center gap-2">
              <CheckCircle2 size={24} /> Optimal
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <Shield size={20} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between opacity-50">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Failed Jobs</p>
            <h3 className="text-xl font-bold text-brand-navy mt-1">0</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center text-brand-rose">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-brand-navy">Role Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold text-slate-500">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4">Update Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-brand-navy">{user.name}</div>
                    <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 capitalize">
                    <span className={`px-2 py-1 rounded text-xs tracking-wider uppercase font-bold ${
                      user.role === 'admin' ? 'bg-brand-indigo/10 text-brand-indigo' :
                      user.role === 'teacher' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => toggleRole(user.id, user.role)}
                      className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-brand-navy rounded transition-colors"
                    >
                      Cycle Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
