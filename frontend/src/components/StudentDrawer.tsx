import React from 'react';
import { X, Mail, Calendar, TrendingDown } from 'lucide-react';
import type { Student } from '../types';

interface StudentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export default function StudentDrawer({ isOpen, onClose, student }: StudentDrawerProps) {
  if (!isOpen || !student) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-brand-navy/20 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-slate-200`}>
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-brand-navy tracking-tight">Student 360</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-brand-navy rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-navy flex items-center justify-center text-white text-xl font-bold shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-navy">{student.name}</h3>
              <p className="text-sm font-medium text-slate-500">Major: Computer Science | Year 2</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Risk Score</p>
              <p className="text-2xl font-bold text-brand-navy tabular-nums">{student.score}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Attendance</p>
              <p className="text-2xl font-bold text-brand-navy tabular-nums">{student.attendance}%</p>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Risk Factors</h4>
            {student.risk === 'HIGH' ? (
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-3 bg-brand-rose/5 border border-brand-rose/10 rounded-lg">
                  <TrendingDown className="text-brand-rose mt-0.5 shrink-0" size={16} />
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">Sharp drop in quiz scores</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Scored 45% on last two quizzes (Avg: 80%)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 bg-brand-amber/5 border border-brand-amber/10 rounded-lg">
                  <Calendar className="text-brand-amber mt-0.5 shrink-0" size={16} />
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">Frequent Absences</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Missed 3 out of last 5 classes</p>
                  </div>
                </li>
              </ul>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-500 font-medium text-center">
                No immediate escalating risk factors detected.
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Suggested Actions</h4>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-indigo hover:bg-brand-indigo/90 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm">
              <Mail size={16} />
              Email Student
            </button>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-brand-navy rounded-lg font-semibold text-sm transition-colors shadow-sm">
              <Calendar size={16} />
              Schedule Intervention
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
}
