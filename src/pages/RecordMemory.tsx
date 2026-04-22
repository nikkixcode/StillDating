import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera, Image as ImageIcon, Send, Sparkles, Check, X, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { DateIdea, DailyDate } from '../types';

export const RecordMemory: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const idea = location.state?.idea as DateIdea | undefined;

  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
        <div className="bg-rose-100 p-6 rounded-3xl">
          <Heart className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-rose-900">Choose an Idea First</h2>
        <p className="text-rose-600">Head back to the library to pick a special moment to record!</p>
        <button 
          onClick={() => navigate('/ideas')}
          className="bg-rose-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-rose-600 transition-all"
        >
          To Library
        </button>
      </div>
    );
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < Math.min(files.length, 3); i++) {
      const file = files[i];
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setPhotos(prev => [...prev, base64].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveMemory = async () => {
    if (!user || !profile?.coupleId) return;
    setSaving(true);
    try {
      const completedDate: DailyDate = {
        ...idea,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        completedAt: new Date().toISOString(),
        photos,
        notes,
        scratchedBy: [user.uid] // Simplified for manual save
      };

      const res = await fetch(`/api/couples/${profile.coupleId}`);
      if (!res.ok) throw new Error('Couple not found');
      const couple = await res.json();

      const newHistory = [...(couple.history || []), completedDate];

      await fetch(`/api/couples/${profile.coupleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: newHistory }),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/past-dates');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-rose-900 tracking-tight">Record Memory</h1>
          <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest italic">Capturing Magic</p>
        </div>
      </header>

      {/* Idea Card Summary */}
      <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-sm space-y-3 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Heart className="w-24 h-24 text-rose-500 fill-current" />
        </div>
        <div className="flex justify-between items-center relative z-10">
          <span className="bg-rose-50 text-rose-500 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-rose-100">
            {idea.category}
          </span>
        </div>
        <h3 className="text-xl font-black text-rose-900 relative z-10 leading-tight">
          {idea.title}
        </h3>
        <p className="text-slate-500 text-sm italic relative z-10">
          {idea.description}
        </p>
      </div>

      {/* Photo Upload Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Our Photos</h3>
          <span className="text-[10px] font-bold text-rose-300">{photos.length}/5 photos</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence>
            {photos.map((photo, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-3xl overflow-hidden bg-rose-50 group shadow-sm border border-rose-100"
              >
                <img src={photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {photos.length < 5 && (
            <label className="aspect-square rounded-3xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center gap-3 bg-white hover:bg-rose-50 hover:border-rose-400 transition-all cursor-pointer group p-4 text-center">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handlePhotoUpload}
                className="hidden" 
              />
              <div className="bg-rose-50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-black text-rose-900 uppercase tracking-widest">Add Photos</p>
                <p className="text-[10px] text-rose-300 font-bold">Snap a moment</p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Notes Area */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Private Notes</h3>
        <textarea 
          placeholder="How did it go? What was your favorite moment? (Only you two can see this)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full min-h-[150px] bg-white rounded-3xl p-6 border-2 border-rose-50 focus:border-rose-400 focus:bg-rose-50 outline-none transition-all text-rose-900 font-medium placeholder:text-rose-200 shadow-inner"
        />
      </div>

      {/* Action Button */}
      <div className="pt-4">
        <button 
          onClick={handleSaveMemory}
          disabled={saving || photos.length === 0 || success}
          className={cn(
            "w-full h-20 rounded-[2.5rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl relative overflow-hidden group",
            success ? "bg-green-500 text-white" : "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 active:scale-95"
          )}
        >
          {saving ? (
            <Sparkles className="w-8 h-8 animate-spin" />
          ) : success ? (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <Check className="w-8 h-8" /> Saved to Memories!
            </motion.div>
          ) : (
            <>
              <Send className="w-6 h-6" /> Save to Memories
            </>
          )}
          
          {/* Animated subtle shimmer */}
          {!saving && !success && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
        </button>
      </div>
    </div>
  );
};
