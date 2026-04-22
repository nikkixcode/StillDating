import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { DateIdea, LoveLanguages } from '../types';
import { generateDateIdeasByCategory } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Calendar, ArrowRight, Filter, Search, Clock, MapPin, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Creative', 'Relaxing', 'Active', 'Foodie', 'Learning'];
const LOVE_LANGUAGES: (keyof LoveLanguages)[] = ['wordsOfAffirmation', 'actsOfService', 'receivingGifts', 'qualityTime'];

export const DateIdeas: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedLoveLanguage, setSelectedLoveLanguage] = useState<keyof LoveLanguages>(LOVE_LANGUAGES[0]);
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const newIdeas = await generateDateIdeasByCategory(selectedCategory, selectedLoveLanguage);
      setIdeas(newIdeas);
    } catch (err) {
      console.error('Error fetching ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [selectedCategory, selectedLoveLanguage]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-rose-900 tracking-tight">Date Library</h1>
        <p className="text-rose-600 text-sm">Discover perfect long-distance dates tailored to your love languages.</p>
      </div>

      {/* Filters */}
      <div className="space-y-6">
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all border-2",
                selectedCategory === cat 
                  ? "bg-rose-600 text-white border-rose-600 shadow-lg scale-105" 
                  : "bg-white text-rose-400 border-rose-100 hover:border-rose-300 hover:text-rose-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {LOVE_LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => setSelectedLoveLanguage(lang)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2",
                selectedLoveLanguage === lang 
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm scale-105" 
                  : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600"
              )}
            >
              {lang.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Sparkles className="w-10 h-10 text-rose-500 animate-spin" />
            <p className="text-rose-400 text-xs font-bold uppercase tracking-widest">Curating ideas for you...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {ideas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => navigate('/record-memory', { state: { idea } })}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-rose-50 p-3 rounded-2xl">
                    <Heart className="w-6 h-6 text-rose-500 fill-current" />
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                      {idea.category}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-rose-900 mb-3 group-hover:text-rose-600 transition-colors leading-tight">
                  {idea.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-8 font-medium line-clamp-2">
                  {idea.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">60 min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Camera className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Photo</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/record-memory', { state: { idea } });
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95 text-[10px] uppercase font-black tracking-widest"
                  >
                    <Sparkles className="w-4 h-4" />
                    Record
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Refresh Button */}
      {!loading && (
        <button 
          onClick={fetchIdeas}
          className="w-full py-4 text-rose-400 text-xs font-black uppercase tracking-widest hover:text-rose-600 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Load More Ideas
        </button>
      )}
    </div>
  );
};
