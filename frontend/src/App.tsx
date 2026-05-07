import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminPortal from './pages/AdminPortal';
import DropoutProfileForm from './pages/student/DropoutProfileForm';

function AppInner() {
  const { currentUser, markDropoutProfileComplete } = useAuth();

  if (!currentUser) return <LoginPage />;

  const role = (currentUser.role ?? '').toString().toUpperCase();
  const needsDropoutProfile =
    role === 'STUDENT' && currentUser.dropoutProfileComplete === false;

  if (needsDropoutProfile) {
    return <DropoutProfileForm onComplete={markDropoutProfileComplete} />;
  }

  if (role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-brand-slate font-sans">
        <AdminPortal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-slate font-sans">
      {role === 'FACULTY' ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
