import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Couple, DailyDate, UserProfile } from '../types';
import { generateDailyDateIdea } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, Clock, Check, Share2, Heart, Lock, Unlock, X, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ScratchCard } from '../components/ScratchCard';
import { DATE_POOL } from '../constants/datePool';

export const Dashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [suggestTime, setSuggestTime] = useState('');
  const [pingSent, setPingSent] = useState(false);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memoryNote, setMemoryNote] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const [error, setError] = useState(false);

  // Cycle through ideas during loading
  useEffect(() => {
    let interval: any;
    if (generating) {
      interval = setInterval(() => {
        setCycleIndex(prev => (prev + 1) % DATE_POOL.length);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const fetchCoupleData = async () => {
    if (!user || !profile?.coupleId) return;

    try {
      let coupleRes = await fetch(`/api/couples/${profile.coupleId}`);
      
      // If 404, server might have restarted and lost in-memory state. 
      // Try to re-lookup via search
      if (coupleRes.status === 404) {
        coupleRes = await fetch(`/api/couples/search/${user.uid}`);
      }

      if (!coupleRes.ok) {
        // One final try after a brief delay for server reboot
        await new Promise(r => setTimeout(r, 1000));
        coupleRes = await fetch(`/api/couples/search/${user.uid}`);
        if (!coupleRes.ok) {
          // Instead of crashing, just keep loading and wait for AuthProvider interval
          // Unless it's a persistent error
          console.warn("Could not fetch couple, waiting for re-sync...");
          return;
        }
      }

      const coupleData = await coupleRes.json();
      // Search might return null if not found yet (server restart)
      if (!coupleData) {
        console.warn("Couple not found in search, waiting for re-sync...");
        return;
      }

      setCouple(coupleData);
      setError(false);

      // Fetch partner info
      const partnerId = coupleData.partner1 === user.uid ? coupleData.partner2 : coupleData.partner1;
      if (partnerId) {
        const partnerRes = await fetch(`/api/users/${partnerId}`);
        if (partnerRes.ok) {
          setPartner(await partnerRes.json());
        }
      }

      // Check if daily date needs generating
      const today = format(new Date(), 'yyyy-MM-dd');
      if (!coupleData.dailyDate || coupleData.dailyDate.date !== today) {
        generateNewDailyDate(coupleData, partnerId);
      }
    } catch (err) {
      console.error('Error fetching couple data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupleData();
    const interval = setInterval(fetchCoupleData, 5000);
    return () => clearInterval(interval);
  }, [user?.uid, profile?.coupleId]);

  const generateNewDailyDate = async (coupleData: Couple, partnerId: string) => {
    // If no partner, we can still generate for demo
    const effectiveLoveLanguages = profile?.loveLanguages || {
      wordsOfAffirmation: 25,
      actsOfService: 25,
      receivingGifts: 25,
      qualityTime: 25
    };
    
    setGenerating(true);
    const start = Date.now();
    
    try {
      let partnerLoveLanguages = effectiveLoveLanguages;
      if (partnerId) {
        const partnerRes = await fetch(`/api/users/${partnerId}`);
        if (partnerRes.ok) {
          const pData = await partnerRes.json();
          partnerLoveLanguages = pData.loveLanguages || effectiveLoveLanguages;
        }
      }

      // Start AI generation or use pool if AI fails/taking too long
      // Add a random seed to the prompt or shuffle a bit for variety
      const ideaPromise = generateDailyDateIdea(
        effectiveLoveLanguages,
        partnerLoveLanguages,
        [...(profile?.hobbies || []), Date.now().toString().slice(-4)] // Inject a random entropy
      ).catch(() => DATE_POOL[Math.floor(Math.random() * DATE_POOL.length)]);

      // Enforce 2 second minimum wait as requested
      const [idea] = await Promise.all([
        ideaPromise,
        new Promise(resolve => setTimeout(resolve, Math.max(0, 2000 - (Date.now() - start))))
      ]);

      const dailyDate: DailyDate = {
        ...idea,
        date: format(new Date(), 'yyyy-MM-dd'),
        scratchedBy: [],
        status: 'pending'
      };

      const newHistory = [...(coupleData.history || [])];
      if (coupleData.dailyDate && coupleData.dailyDate.scratchedBy?.length > 0) {
        newHistory.push(coupleData.dailyDate);
      }

      const updatedCouple = {
        ...coupleData,
        dailyDate,
        history: newHistory,
        pings: []
      };

      await fetch(`/api/couples/${coupleData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyDate, history: newHistory, pings: [] }),
      });
      
      // Update local state immediately for instant feedback
      setCouple(updatedCouple);
      await fetchCoupleData();
    } catch (err) {
      console.error('Error generating daily date:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleScratch = async () => {
    if (!user || !couple?.dailyDate) return;
    
    setIsScratching(true);
    const scratchedBy = [...(couple.dailyDate.scratchedBy || [])];
    if (!scratchedBy.includes(user.uid)) {
      scratchedBy.push(user.uid);
    }

    try {
      await fetch(`/api/couples/${couple.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyDate: {
            ...couple.dailyDate,
            scratchedBy
          }
        }),
      });
      fetchCoupleData();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsScratching(false), 1000);
    }
  };

  const handleNextDate = () => {
    if (couple && user) {
      const partnerId = couple.partner1 === user.uid ? couple.partner2 : couple.partner1;
      generateNewDailyDate(couple, partnerId || "");
    }
  };

  const handlePingPartner = async () => {
    if (!user || !couple) return;
    setPingSent(true);
    
    const isRevealed = couple.dailyDate?.scratchedBy?.length === 2;
    const pingType = isRevealed ? 'plan' : 'scratch';
    
    try {
      const newPings = [...(couple.pings || []), {
        from: user.uid,
        type: pingType,
        timestamp: new Date().toISOString()
      }];
      
      await fetch(`/api/couples/${couple.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pings: newPings }),
      });
      setTimeout(() => setPingSent(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteDate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !couple?.dailyDate || !couple.id) return;
    
    const files = e.target.files;
    let photos: string[] = [];
    
    if (files && files.length > 0) {
      setCompleting(true);
      try {
        // Convert images to base64
        for (let i = 0; i < Math.min(files.length, 3); i++) {
          const file = files[i];
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          photos.push(base64);
        }
      } catch (err) {
        console.error('Error processing photos:', err);
      }
    }

    setCompleting(true);
    try {
      const completedDate = {
        ...couple.dailyDate,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        photos
      };

      const newHistory = [...(couple.history || []), completedDate];

      await fetch(`/api/couples/${couple.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dailyDate: null, 
          history: newHistory,
          pings: [] 
        }),
      });
      
      await fetchCoupleData();
      navigate('/past-dates');
    } catch (err) {
      console.error('Error completing date:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleSuggestTime = async () => {
    if (!user || !couple?.dailyDate || !suggestTime) return;
    
    try {
      await fetch(`/api/couples/${couple.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyDate: {
            ...couple.dailyDate,
            suggestedTime: suggestTime,
            status: 'confirmed'
          }
        }),
      });
      
      const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(couple.dailyDate.title)}&details=${encodeURIComponent(couple.dailyDate.description)}&dates=${suggestTime.replace(/[-:]/g, '')}/${suggestTime.replace(/[-:]/g, '')}`;
      window.open(googleCalendarUrl, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Sparkles className="w-10 h-10 text-rose-500 animate-spin" />
      <p className="text-rose-400 font-bold text-xs uppercase tracking-widest animate-pulse">Syncing Love...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
      <div className="bg-rose-50 p-6 rounded-3xl">
        <X className="w-12 h-12 text-rose-500" />
      </div>
      <h2 className="text-2xl font-bold text-rose-900">Connection Issue</h2>
      <p className="text-rose-600">We're having trouble reaching the server. Please check your connection and try again.</p>
      <button 
        onClick={() => {
          refreshProfile();
          fetchCoupleData();
        }}
        className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-rose-600 transition-all"
      >
        Retry Connection
      </button>
    </div>
  );

  if (!profile?.coupleId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
        <div className="bg-rose-100 p-6 rounded-3xl">
          <Heart className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-rose-900">Waiting for Partner</h2>
        <p className="text-rose-600">Connect with your partner in the profile tab to start your journey together!</p>
        <div className="bg-white p-6 rounded-2xl border border-rose-100 w-full">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-2">Your Join Code</span>
          <span className="text-3xl font-black text-rose-600 tracking-widest">{profile?.joinCode}</span>
        </div>
      </div>
    );
  }

  const isScratchedByMe = couple?.dailyDate?.scratchedBy?.includes(user?.uid || '');
  const isScratchedByPartner = couple?.dailyDate?.scratchedBy?.includes(partner?.uid || '') || couple?.dailyDate?.scratchedBy?.includes('partner_sim');
  const partnerPinged = couple?.pings?.find(p => p.from !== user?.uid && p.from !== 'partner_sim');

  const DateIdeaContent = () => {
    if (!couple?.dailyDate) return null;
    
    return (
      <div className="w-full h-full bg-white rounded-[2rem] border-2 border-rose-200 flex flex-col p-10 space-y-10 shadow-inner">
        <div className="flex justify-between items-start">
          <span className="bg-rose-600 text-white text-[12px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full shadow-lg">
            {couple.dailyDate.category}
          </span>
          <Heart className="w-10 h-10 text-rose-500 fill-current drop-shadow-md" />
        </div>
        
        <div className="flex-1 space-y-6">
          <h3 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter">
            {couple.dailyDate.title}
          </h3>
          <p className="text-slate-700 leading-relaxed text-lg font-bold">
            {couple.dailyDate.description}
          </p>
        </div>

        <div className="bg-rose-50/50 p-6 rounded-3xl border-2 border-rose-100/50">
          <p className="text-[12px] font-black text-rose-400 uppercase tracking-widest mb-3">Power Up:</p>
          <p className="text-lg font-black text-rose-900 capitalize italic">
            {couple.dailyDate.loveLanguage.replace(/([A-Z])/g, ' $1').trim()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Partner Status */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-rose-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={profile?.photoURL} 
              className="w-10 h-10 rounded-full border-2 border-rose-500" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white" />
          </div>
          <div className="h-0.5 w-8 bg-rose-100" />
          <div className="relative">
            {partner || (profile?.partnerUid === 'mock_partner') ? (
              <div className="relative">
                <img 
                  src={partner?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=partner"} 
                  className="w-10 h-10 rounded-full border-2 border-rose-200" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-50 border-2 border-dashed border-rose-200 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-200" />
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-tighter">Together for</p>
          <p className="text-sm font-bold text-rose-900">124 Days</p>
        </div>
      </div>

      {/* Ping Notification */}
      <AnimatePresence>
        {partnerPinged && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <p className="text-sm font-bold">
                {partnerPinged.type === 'scratch' 
                  ? `${partner?.displayName} wants to see today's date! Scratch it off?` 
                  : `${partner?.displayName} is excited about today's date! No pressure, check it out when you're free.`}
              </p>
            </div>
            <button 
              onClick={async () => {
                const newPings = couple.pings?.filter(p => p.from === user?.uid) || [];
                await fetch(`/api/couples/${couple.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pings: newPings }),
                });
                fetchCoupleData();
              }}
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Date Card */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-rose-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            Today's To-Do
          </h2>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">{format(new Date(), 'MMM dd, yyyy')}</span>
        </div>

        <div className="relative aspect-[4/5] w-full max-w-sm mx-auto group">
          <AnimatePresence mode="wait">
            {!isScratchedByMe ? (
              <motion.div
                key={`scratch-layer-${couple?.dailyDate?.id || 'none'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full relative"
              >
                <ScratchCard 
                  key={couple?.dailyDate?.id || 'empty'}
                  isCompleted={isScratchedByMe} 
                  onComplete={handleScratch}
                  threshold={0.6}
                >
                  <DateIdeaContent />
                </ScratchCard>

                {/* Ready to Scratch Signal */}
                <AnimatePresence>
                  {!generating && couple?.dailyDate && !isScratchedByMe && (
                    <motion.div
                      key="ready-signal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: 1 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                    >
                      <Sparkles className="w-12 h-12 text-white/50" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                key="revealed-controls"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full bg-white rounded-[2rem] border-4 border-rose-500 shadow-2xl p-6 flex flex-col relative overflow-hidden"
              >
                {/* Background Sparkles */}
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles className="w-32 h-32 text-rose-500" />
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-10 scrollbar-hide pb-6">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="bg-rose-500 text-white text-[12px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full w-fit mb-4">
                        {couple?.dailyDate?.category}
                      </span>
                      <h3 className="text-4xl font-black text-slate-910 leading-tight tracking-tighter">
                        {couple?.dailyDate?.title}
                      </h3>
                    </div>
                    <Heart className="w-14 h-14 text-rose-500 fill-current animate-pulse" />
                  </div>
                  
                  <p className="text-slate-700 leading-relaxed text-2xl font-bold">
                    {couple?.dailyDate?.description}
                  </p>

                  <div className="bg-rose-100/30 p-8 rounded-[2.5rem] border-2 border-rose-200/50 shadow-inner">
                    <p className="text-[12px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4 text-center">Love Language Focus</p>
                    <p className="text-center font-black text-rose-900 capitalize text-3xl italic">
                      {couple?.dailyDate?.loveLanguage?.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-rose-100 flex gap-4 bg-white mt-auto">
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={handleNextDate}
                      disabled={generating}
                      className="flex-1 bg-rose-50 text-rose-600 font-black py-5 px-4 rounded-2xl border-2 border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest active:scale-95"
                    >
                      {generating ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      Reroll Idea
                    </button>
                    <button 
                      onClick={handlePingPartner}
                      disabled={pingSent}
                      className="bg-rose-50 text-rose-500 font-bold py-5 px-6 rounded-2xl border-2 border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center shadow-sm active:scale-95"
                    >
                      {pingSent ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Capture Memory Modal */}
          <AnimatePresence>
            {showMemoryModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/80 backdrop-blur-sm"
                onClick={() => setShowMemoryModal(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-8 pb-12 sm:pb-8 space-y-8"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-3xl font-black text-rose-900 tracking-tight">Capture Memory</h3>
                      <p className="text-rose-400 text-sm font-bold uppercase tracking-widest mt-1">Today's To-Do: {couple?.dailyDate?.title}</p>
                    </div>
                    <button onClick={() => setShowMemoryModal(false)} className="bg-rose-50 text-rose-300 hover:text-rose-600 p-3 rounded-2xl transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-rose-400 uppercase tracking-widest px-1">Share the visual</label>
                      <label className={cn(
                        "w-full aspect-video rounded-[2rem] border-4 border-dashed border-rose-100 flex flex-col items-center justify-center gap-4 hover:bg-rose-50 hover:border-rose-400 transition-all cursor-pointer overflow-hidden group",
                        selectedFiles?.length && "border-rose-500 bg-rose-50 border-solid"
                      )}>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden"
                          onChange={e => setSelectedFiles(e.target.files)}
                        />
                        {selectedFiles?.length ? (
                          <div className="text-center">
                            <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                              <Check className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-lg font-black text-rose-900">{selectedFiles.length} Photos Added</p>
                            <p className="text-sm font-bold text-rose-400 uppercase tracking-widest mt-1">Tap to change</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Camera className="w-8 h-8 text-rose-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-black text-slate-700">Drop or tap to upload</p>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">JPG, PNG up to 10MB</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-rose-400 uppercase tracking-widest px-1">Highlight note</label>
                      <textarea 
                        value={memoryNote}
                        onChange={e => setMemoryNote(e.target.value)}
                        placeholder="What was the most special part...?"
                        className="w-full h-36 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-base font-bold focus:border-rose-500 focus:bg-white outline-none resize-none transition-all placeholder:text-slate-300 text-slate-900"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      const event = { target: { files: selectedFiles } } as any;
                      await handleCompleteDate(event);
                      setShowMemoryModal(false);
                      setMemoryNote('');
                      setSelectedFiles(null);
                    }}
                    disabled={completing}
                    className="w-full h-18 bg-rose-600 text-white rounded-2xl font-black shadow-2xl shadow-rose-200 text-xl uppercase tracking-[0.15em] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {completing ? <Clock className="w-7 h-7 animate-spin" /> : <Heart className="w-7 h-7 fill-white/20" />}
                    Lock in Memory
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent Loading Overlay */}
          <AnimatePresence>
            {(generating || (couple && !couple.dailyDate)) && (
              <motion.div
                key="generating-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md rounded-[2rem] flex flex-col items-center justify-center p-8 text-center space-y-6"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Sparkles className="w-16 h-16 text-rose-500" />
                  </motion.div>
                  <Heart className="w-8 h-8 text-rose-300 fill-current absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-rose-900 tracking-tight">Cupid is thinking...</h3>
                  <p className="text-xs text-rose-300 max-w-[200px] mx-auto leading-tight">
                    Preparing a perfect surprise for you both...
                  </p>
                </div>

                {/* Progress Mini-dots */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1, 
                        delay: i * 0.1 
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-rose-500"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Capture the Moment Primary Action */}
        <AnimatePresence>
          {isScratchedByMe && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-2"
            >
              <button 
                onClick={() => navigate('/record-memory', { state: { idea: couple?.dailyDate } })}
                className="w-full h-20 bg-rose-600 text-white rounded-[2rem] font-black shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-4 text-xl uppercase tracking-[0.2em] active:scale-[0.98] group"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                Capture the moment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <button className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group">
          <div className="bg-rose-50 p-3 rounded-2xl group-hover:bg-rose-100 transition-colors">
            <Share2 className="w-6 h-6 text-rose-500" />
          </div>
          <span className="text-sm font-bold text-rose-900">Share Memory</span>
        </button>
        <button 
          onClick={() => navigate('/past-dates')}
          className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group"
        >
          <div className="bg-rose-50 p-3 rounded-2xl group-hover:bg-rose-100 transition-colors">
            <Clock className="w-6 h-6 text-rose-500" />
          </div>
          <span className="text-sm font-bold text-rose-900">Past Dates</span>
        </button>
      </section>
    </div>
  );
};
