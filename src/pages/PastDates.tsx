import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Couple, DailyDate } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Calendar, ChevronLeft, Sparkles, Filter, Camera, Image as ImageIcon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const PastDates: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupleData = async () => {
      if (!user || !profile?.coupleId) return;
      try {
        const res = await fetch(`/api/couples/${profile.coupleId}`);
        if (res.ok) {
          setCouple(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupleData();
  }, [user, profile]);

  if (loading) return <div className="flex items-center justify-center h-full"><Sparkles className="w-8 h-8 text-rose-500 animate-spin" /></div>;

  const history = couple?.history || [];

  return (
    <div className="space-y-6 pb-20">
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.img 
              layoutId={selectedPhoto}
              src={selectedPhoto}
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-rose-900 tracking-tight">Our Memories</h1>
          <p className="text-rose-400 text-xs font-bold uppercase tracking-widest">{history.length} Dates Recorded</p>
        </div>
      </header>

      {history.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-rose-100 text-center space-y-4">
          <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8 text-rose-200" />
          </div>
          <p className="text-rose-900 font-bold">No memories yet!</p>
          <p className="text-rose-400 text-sm">Once you scratch and complete a date, it will appear here for you to look back on.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((date, index) => (
            <motion.div
              key={date.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[2rem] border border-rose-100 shadow-sm overflow-hidden group hover:shadow-md transition-all"
            >
              {/* Photo Strip */}
              {date.photos && date.photos.length > 0 && (
                <div className="flex overflow-x-auto gap-2 p-4 border-b border-rose-50 scrollbar-hide">
                  {date.photos.map((photo, i) => (
                    <motion.div 
                      key={i}
                      layoutId={photo}
                      onClick={() => setSelectedPhoto(photo)}
                      className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden cursor-zoom-in"
                    >
                      <img 
                        src={photo} 
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ))}
                  <div className="flex-shrink-0 w-12 flex flex-col items-center justify-center gap-1 text-rose-200 text-[8px] font-bold uppercase">
                    <Camera className="w-4 h-4" />
                    Moments
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1 italic">
                      {format(new Date(date.date), 'MMMM d, yyyy')}
                    </span>
                    <h3 className="text-xl font-black text-rose-900 leading-tight">
                      {date.title}
                    </h3>
                  </div>
                  <div className="bg-rose-50 px-3 py-1 rounded-full text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    {date.category}
                  </div>
                </div>

                <p className="text-rose-600 text-sm leading-relaxed">
                  {date.description}
                </p>

                <div className="pt-4 border-t border-rose-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-rose-50 p-1.5 rounded-lg">
                      <Heart className="w-3 h-3 text-rose-400 fill-current" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                      {date.loveLanguage?.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  {date.completedAt && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-rose-300">
                      <Check className="w-3 h-3 text-green-400" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
