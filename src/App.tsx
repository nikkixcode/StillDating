import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { DateIdeas } from './pages/DateIdeas';
import { Profile } from './pages/Profile';
import { PastDates } from './pages/PastDates';
import { RecordMemory } from './pages/RecordMemory';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="animate-bounce bg-rose-500 p-4 rounded-full shadow-lg">
          <div className="w-8 h-8 text-white fill-current">❤️</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (profile && !profile.onboardingComplete && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  if (profile?.onboardingComplete && window.location.pathname === '/onboarding') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/ideas" element={
              <ProtectedRoute>
                <DateIdeas />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/past-dates" element={
              <ProtectedRoute>
                <PastDates />
              </ProtectedRoute>
            } />
            <Route path="/record-memory" element={
              <ProtectedRoute>
                <RecordMemory />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
