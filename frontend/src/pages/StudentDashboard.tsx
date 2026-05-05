import React, { useCallback, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { firstNavMatchForEnter, studentNavItems } from '../config/dashboardNav';
import StudentHome from './student/StudentHome';
import Assignments from './student/Assignments';
import Announcements from './student/Announcements';
import Fees from './student/Fees';
import Timetable from './student/Timetable';
import Chat from './student/Chat';
import Results from './student/Results';
import Profile from './student/Profile';
import Recommendations from './student/Recommendations';

export default function StudentDashboard() {
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchEnter = useCallback(() => {
    const id = firstNavMatchForEnter(studentNavItems, searchQuery);
    if (id) setActivePage(id);
  }, [searchQuery]);

  const renderPage = () => {
    switch (activePage) {
      case 'assignments': return <Assignments />;
      case 'announcements': return <Announcements />;
      case 'fees': return <Fees />;
      case 'timetable': return <Timetable />;
      case 'chat': return <Chat />;
      case 'results': return <Results />;
      case 'profile': return <Profile />;
      case 'recommendations': return <Recommendations />;
      default: return <StudentHome onNavigate={setActivePage} searchQuery={searchQuery} />;
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
          onBellClick={() => setActivePage('announcements')}
        />
        <main key={activePage} className="page-enter flex-1 overflow-y-auto bg-brand-slate p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
