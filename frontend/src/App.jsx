import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

export default function App() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [studentActiveTab, setStudentActiveTab] = useState('pending');

  if (!user) {
    return <LoginPage />;
  }

  const isStudent = user.role === 'USER';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        unreadCount={unreadCount}
        onNotificationClick={() => setStudentActiveTab('notices')}
      />

      <main className="flex-1">
        {isStudent ? (
          <StudentDashboard
            activeTab={studentActiveTab}
            setActiveTab={setStudentActiveTab}
            setUnreadCount={setUnreadCount}
          />
        ) : (
          <AdminDashboard />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Data Empowerment and Protection Architecture (DEPA) — Consent Artifacts &amp; Direct P2P Encryption
      </footer>
    </div>
  );
}
