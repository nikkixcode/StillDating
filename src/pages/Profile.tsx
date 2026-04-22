import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { UserProfile, LoveLanguages } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Edit2, Check, X, Users, Sparkles, UserPlus, LogOut, ChevronRight, Share2, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

import { logout } from '../firebase';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [connectError, setConnectError] = useState('');

  useEffect(() => {
    if (profile?.partnerUid) {
      const fetchPartner = async () => {
        try {
          const res = await fetch(`/api/users/${profile.partnerUid}`);
          if (res.ok) {
            setPartner(await res.json());
          }
        } catch (error) {
          console.error("Error fetching partner:", error);
        }
      };
      fetchPartner();
    }
  }, [profile?.partnerUid]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editName }),
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPartner = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setConnectError('');
    try {
      const codeRes = await fetch(`/api/joinCodes/${partnerCode.toUpperCase()}`);
      if (!codeRes.ok) {
        setConnectError('Invalid partner code. Please check and try again.');
        setLoading(false);
        return;
      }
      const { uid: partnerUid } = await codeRes.json();

      if (partnerUid === user.uid) {
        setConnectError("You can't connect with yourself!");
        setLoading(false);
        return;
      }

      const partnerRes = await fetch(`/api/users/${partnerUid}`);
      if (!partnerRes.ok) {
        setConnectError('Partner profile not found.');
        setLoading(false);
        return;
      }
      const partnerData = await partnerRes.json();

      const coupleRes = await fetch('/api/couples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner1: user.uid, partner2: partnerUid }),
      });
      const couple = await coupleRes.json();
      
      await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerUid, coupleId: couple.id }),
      });

      setPartner(partnerData);
    } catch (err) {
      setConnectError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (profile?.joinCode) {
      navigator.clipboard.writeText(profile.joinCode);
      alert('Join code copied to clipboard!');
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const LoveLanguageChart = ({ data }: { data: LoveLanguages }) => {
    const max = Math.max(...Object.values(data));
    return (
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-rose-400 uppercase tracking-widest">
              <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span>{value}/5</span>
            </div>
            <div className="h-2 bg-rose-50 rounded-full overflow-hidden border border-rose-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(value / 5) * 100}%` }}
                className="h-full bg-rose-500 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
          <img 
            src={profile?.photoURL} 
            alt={profile?.displayName} 
            className="w-24 h-24 rounded-full border-4 border-white shadow-xl group-hover:scale-105 transition-all"
            referrerPolicy="no-referrer"
          />
          <button className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-rose-600 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white border-2 border-rose-100 rounded-xl px-4 py-1 text-center font-bold text-rose-900 focus:border-rose-500 outline-none"
              />
              <button onClick={handleUpdateProfile} className="text-green-500"><Check className="w-5 h-5" /></button>
              <button onClick={() => setIsEditing(false)} className="text-red-500"><X className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <h2 className="text-2xl font-black text-rose-900 tracking-tight">{profile?.displayName}</h2>
              <button onClick={() => setIsEditing(true)} className="text-rose-300 hover:text-rose-500"><Edit2 className="w-4 h-4" /></button>
            </div>
          )}
          <p className="text-rose-400 text-sm font-medium">{profile?.email}</p>
        </div>
      </div>

      {/* Love Languages & Hobbies */}
      <section className="bg-white p-8 rounded-[2rem] border border-rose-100 shadow-sm space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-black text-rose-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-current" />
            My Love Languages
          </h3>
          {profile?.loveLanguages ? (
            <LoveLanguageChart data={profile.loveLanguages} />
          ) : (
            <p className="text-rose-400 text-sm">No data yet. Take the quiz!</p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-black text-rose-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            My Hobbies
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile?.hobbies?.map(hobby => (
              <span key={hobby} className="bg-rose-50 text-rose-600 text-xs font-bold px-4 py-2 rounded-xl border border-rose-100">
                {hobby}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Section */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-rose-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-rose-500" />
          My Partner
        </h3>

        {partner ? (
          <div className="bg-white p-8 rounded-[2rem] border border-rose-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <img 
                src={partner.photoURL} 
                className="w-16 h-16 rounded-full border-2 border-rose-100" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-xl font-black text-rose-900">{partner.displayName}</h4>
                <p className="text-rose-400 text-sm font-medium">Connected Partner</p>
              </div>
            </div>

            <div className="space-y-6">
              <h5 className="text-xs font-black text-rose-400 uppercase tracking-widest">Partner's Love Languages</h5>
              {partner.loveLanguages && <LoveLanguageChart data={partner.loveLanguages} />}
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-black text-rose-400 uppercase tracking-widest">Partner's Hobbies</h5>
              <div className="flex flex-wrap gap-2">
                {partner.hobbies?.map(hobby => (
                  <span key={hobby} className="bg-rose-50 text-rose-600 text-xs font-bold px-4 py-2 rounded-xl border border-rose-100">
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-rose-100/50 p-8 rounded-[2rem] border-2 border-dashed border-rose-200 text-center space-y-6">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <UserPlus className="w-8 h-8 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-rose-900">No Partner Connected</h4>
              <p className="text-rose-600 text-sm">Share your code with your partner or enter theirs below!</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
              <div>
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-2">Your Join Code</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black text-rose-600 tracking-widest">{profile?.joinCode}</span>
                  <button onClick={copyJoinCode} className="text-rose-400 hover:text-rose-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-50 space-y-3 text-center">
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">Enter Partner's Code</span>
                <input 
                  type="text" 
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF"
                  className="w-full bg-rose-50 border-2 border-rose-100 rounded-xl px-4 py-3 text-center font-bold text-rose-900 focus:border-rose-500 outline-none transition-all uppercase tracking-widest text-lg"
                />
                <button 
                  onClick={handleConnectPartner}
                  disabled={loading || !partnerCode}
                  className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-rose-600 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? 'Connecting...' : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Connect to Partner
                    </>
                  )}
                </button>
                {connectError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-tight">{connectError}</p>}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Settings & More */}
      <section className="space-y-3">
        <button className="w-full bg-white p-5 rounded-2xl border border-rose-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-rose-50 p-2 rounded-xl group-hover:bg-rose-100 transition-colors">
              <Settings className="w-5 h-5 text-rose-500" />
            </div>
            <span className="font-bold text-rose-900">Account Settings</span>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-200" />
        </button>
        <button 
          onClick={() => navigate('/past-dates')}
          className="w-full bg-white p-5 rounded-2xl border border-rose-100 flex items-center justify-between group hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-rose-50 p-2 rounded-xl group-hover:bg-rose-100 transition-colors">
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
            <span className="font-bold text-rose-900">Our Memories</span>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-200" />
        </button>

        <button 
          onClick={handleSignOut}
          className="w-full bg-rose-50 p-5 rounded-2xl border border-rose-200 hover:bg-rose-100 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl group-hover:bg-rose-50 transition-colors shadow-sm">
              <LogOut className="w-5 h-5 text-rose-600" />
            </div>
            <span className="font-bold text-rose-900">Sign Out</span>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-300" />
        </button>
      </section>
    </div>
  );
};
