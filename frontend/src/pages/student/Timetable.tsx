import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRecordId } from '../../utils/studentContext';
import { getTimetable } from '../../api';
import type { TimetableEntry } from '../../api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_SHORT: Record<string, string> = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat' };
const COLORS = ['bg-brand-indigo/10 border-brand-indigo/20 text-brand-indigo',
  'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald',
  'bg-brand-amber/10 border-brand-amber/20 text-brand-amber',
  'bg-brand-rose/10 border-brand-rose/20 text-brand-rose',
  'bg-purple-100 border-purple-200 text-purple-600',
  'bg-cyan-100 border-cyan-200 text-cyan-600'];

export default function Timetable() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sid = getStudentRecordId(currentUser);
    if (!sid) return;
    getTimetable({ studentId: sid })
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const entriesByDay = DAYS.reduce((acc, day) => {
    acc[day] = entries.filter(e => e.dayOfWeek === day);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  const colorMap: Record<string, string> = {};
  let colorIdx = 0;
  entries.forEach(e => { if (!colorMap[e.course]) { colorMap[e.course] = COLORS[colorIdx++ % COLORS.length]; } });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Timetable</h1>
        <p className="text-sm text-slate-500 mt-1">Your weekly class schedule</p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No timetable entries yet</p>
          <p className="text-sm text-slate-400 mt-1">Your schedule will appear here once set by your faculty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAYS.map(day => (
            <div key={day} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <h3 className="font-bold text-brand-navy text-sm">{day.charAt(0) + day.slice(1).toLowerCase()}</h3>
                <p className="text-xs text-slate-400">{DAY_SHORT[day]}</p>
              </div>
              <div className="p-4 space-y-3 min-h-[80px]">
                {entriesByDay[day].length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No classes</p>
                ) : (
                  entriesByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(e => (
                    <div key={e.id} className={`p-3 rounded-lg border ${colorMap[e.course]}`}>
                      <p className="font-bold text-sm">{e.subject}</p>
                      <p className="text-xs opacity-70 mt-0.5">{e.course}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs opacity-60">
                        <span className="flex items-center gap-1"><Clock size={11} />{e.startTime}–{e.endTime}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} />{e.room}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
