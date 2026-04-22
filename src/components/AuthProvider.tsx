import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSessionUser, login } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const fetchProfile = async (uid: string) => {
    try {
      const res = await fetch(`/api/users/${uid}`);
      if (res.ok) {
        let data = await res.json();
        
        const coupleRes = await fetch(`/api/couples/search/${uid}`);
        if (coupleRes.ok) {
          const couple = await coupleRes.json();
          
          // Case 1: Server has a couple for us, but client profile is missing it or out of sync
          if (couple) {
            if (data.coupleId !== couple.id) {
              const partnerUid = couple.partner1 === uid ? couple.partner2 : couple.partner1;
              const updateRes = await fetch(`/api/users/${uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coupleId: couple.id, partnerUid }),
              });
              if (updateRes.ok) {
                data = await updateRes.json();
              }
            }
          } 
          // Case 2: Server has NO couple for us, but client profile THINKS it has one (Stale Data)
          // Or Case 3: Both are missing it (New User)
          else {
            // Auto-create a mock couple for demo solo play / re-sync
            const mockCoupleRes = await fetch('/api/couples', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ partner1: uid, partner2: 'mock_partner' }),
            });
            if (mockCoupleRes.ok) {
              const mockCouple = await mockCoupleRes.json();
              const updateRes = await fetch(`/api/users/${uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coupleId: mockCouple.id, partnerUid: 'mock_partner' }),
              });
              if (updateRes.ok) {
                data = await updateRes.json();
              }
            }
          }
        }
        setProfile(data);
        localStorage.setItem(`profile_${uid}`, JSON.stringify(data));
      } else if (res.status === 404) {
        // If server lost the user but we have a session, re-sync/re-login
        const sessionUser = getSessionUser();
        const savedProfile = localStorage.getItem(`profile_${uid}`);
        const parsedSaved = savedProfile ? JSON.parse(savedProfile) : null;

        if (sessionUser) {
          const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sessionUser),
          });
          if (loginRes.ok) {
            let freshUser = await loginRes.json();
            
            // If we have a saved profile with onboarding complete, restore it to server
            if (parsedSaved?.onboardingComplete) {
              const restoreRes = await fetch(`/api/users/${uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedSaved),
              });
              if (restoreRes.ok) {
                freshUser = await restoreRes.json();
              }
            }
            
            setProfile(freshUser);
            return;
          }
        }
        
        // Fallback default or saved
        const defaultProfile: UserProfile = parsedSaved || {
          uid,
          displayName: user?.displayName || 'User',
          email: user?.email || '',
          photoURL: user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          onboardingComplete: false,
          joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          loveLanguages: {
            wordsOfAffirmation: 0,
            actsOfService: 0,
            receivingGifts: 0,
            qualityTime: 0
          }
        };
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      // Auto-login for demo
      login({
        uid: "demo_user",
        email: "demo@example.com",
        displayName: "Demo User",
        photoURL: "https://picsum.photos/seed/demo/200",
      });
      return;
    }
    
    setUser(sessionUser);
    setIsAuthReady(true);

    if (sessionUser) {
      fetchProfile(sessionUser.uid);
      
      const interval = setInterval(() => fetchProfile(sessionUser.uid), 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
