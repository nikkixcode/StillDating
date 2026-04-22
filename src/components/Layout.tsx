import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Heart, User, Calendar, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { logout } from '../firebase';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Outlet />;

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-rose-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-rose-500 p-1.5 rounded-lg">
            <Heart className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="font-bold text-xl text-rose-900 tracking-tight">StillDating</span>
        </div>
        <div className="flex items-center gap-3">
          {profile?.photoURL && (
            <img 
              src={profile.photoURL} 
              alt={profile.displayName} 
              className="w-8 h-8 rounded-full border border-rose-200"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full px-6 pt-6">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 px-6 py-3 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50">
        <NavLink 
          to="/" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all duration-200",
            isActive ? "text-rose-500 scale-110" : "text-rose-300 hover:text-rose-400"
          )}
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Daily</span>
        </NavLink>
        <NavLink 
          to="/ideas" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all duration-200",
            isActive ? "text-rose-500 scale-110" : "text-rose-300 hover:text-rose-400"
          )}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Ideas</span>
        </NavLink>
        <NavLink 
          to="/profile" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all duration-200",
            isActive ? "text-rose-500 scale-110" : "text-rose-300 hover:text-rose-400"
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};
