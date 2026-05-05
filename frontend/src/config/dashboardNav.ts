import type { LucideIcon } from 'lucide-react';
import {
  Home,
  BookOpen,
  Bell,
  DollarSign,
  Calendar,
  MessageSquare,
  BarChart2,
  User,
  ClipboardList,
  CheckSquare,
  FileText,
  Sparkles,
} from 'lucide-react';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Extra tokens matched by the top search (e.g. course, grade). */
  keywords?: string[];
}

export const studentNavItems: DashboardNavItem[] = [
  { id: 'home', label: 'Dashboard', icon: Home, keywords: ['home', 'main', 'overview'] },
  { id: 'assignments', label: 'Assignments', icon: BookOpen, keywords: ['assignment', 'homework', 'course', 'submit'] },
  { id: 'announcements', label: 'Announcements', icon: Bell, keywords: ['news', 'notice', 'update'] },
  { id: 'fees', label: 'Fee Payments', icon: DollarSign, keywords: ['fee', 'payment', 'pay', 'tuition'] },
  { id: 'timetable', label: 'Timetable', icon: Calendar, keywords: ['schedule', 'calendar', 'class'] },
  { id: 'chat', label: 'Chat with Mentor', icon: MessageSquare, keywords: ['chat', 'message', 'mentor', 'faculty'] },
  { id: 'results', label: 'Results', icon: BarChart2, keywords: ['grade', 'marks', 'gpa', 'result', 'score'] },
  {
    id: 'recommendations',
    label: 'Recommendations',
    icon: Sparkles,
    keywords: ['lecture', 'ml', 'course', 'suggest', 'recommend', 'learning', 'plan'],
  },
  { id: 'profile', label: 'Profile', icon: User, keywords: ['account', 'settings', 'me'] },
];

export const facultyNavItems: DashboardNavItem[] = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: Home,
    keywords: ['home', 'main', 'overview', 'risk', 'performance', 'at risk', 'kpi', 'roster', 'intervention'],
  },
  { id: 'create-assignment', label: 'Create Assignments', icon: BookOpen, keywords: ['assignment', 'create', 'course', 'homework'] },
  { id: 'evaluation', label: 'Evaluation', icon: ClipboardList, keywords: ['grade', 'mark', 'submission', 'evaluate'] },
  { id: 'attendance', label: 'Attendance', icon: CheckSquare, keywords: ['present', 'absent', 'roll', 'class'] },
  { id: 'exams', label: 'Exam Scheduling', icon: FileText, keywords: ['exam', 'test', 'schedule', 'venue'] },
  { id: 'messaging', label: 'Messaging', icon: MessageSquare, keywords: ['chat', 'message', 'student'] },
  { id: 'announcements-faculty', label: 'Announcements', icon: Bell, keywords: ['news', 'notice', 'post'] },
  { id: 'profile', label: 'Profile', icon: User, keywords: ['account', 'settings', 'me'] },
];

export function filterNavBySearch(items: DashboardNavItem[], query: string): DashboardNavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(item => {
    const parts = [item.label, item.id.replace(/-/g, ' '), ...(item.keywords ?? [])];
    return parts.some(p => p.toLowerCase().includes(q));
  });
}

/** First sidebar page to open when user presses Enter in search (skips home unless it is the only match). */
export function firstNavMatchForEnter(items: DashboardNavItem[], query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const matches = filterNavBySearch(items, query);
  if (matches.length === 0) return null;
  const nonHome = matches.find(m => m.id !== 'home');
  return (nonHome ?? matches[0]).id;
}
