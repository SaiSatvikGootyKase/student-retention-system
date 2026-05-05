import React, { useCallback, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { facultyNavItems, firstNavMatchForEnter } from '../config/dashboardNav';
import FacultyHome from './faculty/FacultyHome';
import CreateAssignment from './faculty/CreateAssignment';
import Evaluation from './faculty/Evaluation';
import AttendancePage from './faculty/Attendance';
import ExamScheduling from './faculty/ExamScheduling';
import Messaging from './faculty/Messaging';
import AnnouncementsFaculty from './faculty/AnnouncementsFaculty';
import Profile from './faculty/Profile';

export default function TeacherDashboard() {
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchEnter = useCallback(() => {
    const id = firstNavMatchForEnter(facultyNavItems, searchQuery);
    if (id) setActivePage(id);
  }, [searchQuery]);

  const renderPage = () => {
    switch (activePage) {
      case 'create-assignment': return <CreateAssignment />;
      case 'evaluation': return <Evaluation />;
      case 'attendance': return <AttendancePage />;
      case 'exams': return <ExamScheduling />;
      case 'messaging': return <Messaging />;
      case 'announcements-faculty': return <AnnouncementsFaculty />;
      case 'profile': return <Profile />;
      default: return <FacultyHome onNavigate={setActivePage} searchQuery={searchQuery} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} searchQuery={searchQuery} />
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchEnter={handleSearchEnter}
          onBellClick={() => setActivePage('announcements-faculty')}
        />
        <main key={activePage} className="page-enter flex-1 overflow-y-auto bg-brand-slate p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
