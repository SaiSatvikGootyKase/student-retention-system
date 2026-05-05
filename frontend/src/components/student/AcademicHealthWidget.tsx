import React from 'react';
import { Target, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AcademicHealthWidget() {
  const score = 82; // Example score 0-100
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-8">
      {/* Circular Progress */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="64" cy="64" r={radius} 
            className="stroke-slate-100" 
            strokeWidth="8" fill="transparent" 
          />
          <circle 
            cx="64" cy="64" r={radius} 
            className="stroke-brand-emerald" 
            strokeWidth="8" fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-brand-navy">{score}</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Health</span>
        </div>
      </div>

      {/* Context & Mini-Goals */}
      <div className="flex-1 space-y-4 text-center sm:text-left">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">You're On Track!</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Your overall academic health is strong. However, we noticed you could use a little boost in <span className="text-brand-indigo font-bold">Calculus II</span>.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 justify-center sm:justify-start">
            <Target size={14} className="text-brand-indigo" />
            Recommended Mini-Goals
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 p-3 bg-brand-slate rounded-lg border border-slate-200/50">
              <CheckCircle2 size={18} className="text-slate-300 shrink-0" />
              <span className="text-sm font-semibold text-brand-navy flex-1">Watch recommended Derivative Rules lecture</span>
              <button className="text-brand-indigo hover:text-brand-navy shrink-0 transition-colors">
                <ArrowRight size={18} />
              </button>
            </li>
            <li className="flex items-center gap-3 p-3 bg-brand-slate rounded-lg border border-slate-200/50">
              <CheckCircle2 size={18} className="text-brand-emerald shrink-0" />
              <span className="text-sm font-semibold text-slate-500 line-through flex-1">Complete Week 3 Assignment</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
