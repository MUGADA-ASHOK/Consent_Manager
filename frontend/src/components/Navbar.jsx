import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Bell, User, Building2 } from 'lucide-react';

export default function Navbar({ unreadCount = 0, onNotificationClick }) {
  const { user, logout } = useAuth();

  const isStudent = user?.role === 'USER';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                DEPA Consent Manager
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {isStudent ? 'Data Principal Consent & Privacy Portal' : 'Governance & Trust Architecture'}
            </p>
          </div>
        </div>

        {/* User Status & Actions */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isStudent
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              {isStudent ? 'Student / Data Principal' : user.role}
            </span>

            {/* Notification Bell (for Student) */}
            {isStudent && (
              <button
                onClick={onNotificationClick}
                className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile Info */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">{user.name || user.email}</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
