import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { LoveLanguages, Couple } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Check, ArrowRight, ArrowLeft, Users, Sparkles, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

const LOVE_LANGUAGE_QUESTIONS = [
  { id: 'wordsOfAffirmation', text: 'I feel most loved when my partner tells me how much they appreciate me.' },
  { id: 'actsOfService', text: 'I feel most loved when my partner helps me with tasks or chores.' },
  { id: 'receivingGifts', text: 'I feel most loved when my partner gives me a thoughtful gift.' },
  { id: 'qualityTime', text: 'I feel most loved when my partner spends undivided attention with me.' },
];

const HOBBY_OPTIONS = [
  'Gaming', 'Cooking', 'Reading', 'Watching Movies', 'Fitness', 'Music', 'Art', 'Travel', 'Coding', 'Gardening', 'Photography', 'Writing'
];

export const Onboarding: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loveLanguages, setLoveLanguages] = useState<LoveLanguages>({
    wordsOfAffirmation: 3,
    actsOfService: 3,
    receivingGifts: 3,
    qualityTime: 3,
  });
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoveLanguageChange = (id: keyof LoveLanguages, value: number) => {
    setLoveLanguages(prev => ({ ...prev, [id]: value }));
  };

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev => 
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loveLanguages,
          hobbies: selectedHobbies,
          onboardingComplete: true,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update profile on server');
      }

      await refreshProfile();
      navigate('/');
    } catch (err) {
      console.error(err);
      setErrorMsg('Oops! We couldn\'t save your quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-rose-100">
        {/* Progress Bar */}
        <div className="h-2 bg-rose-100 w-full">
          <motion.div 
            className="h-full bg-rose-500"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="bg-rose-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-rose-500 fill-current" />
                  </div>
                  <h2 className="text-2xl font-bold text-rose-900">Love Languages</h2>
                  <p className="text-rose-600 text-sm mt-2">Rate how much each of these resonates with you (1-5)</p>
                </div>

                <div className="space-y-6">
                  {LOVE_LANGUAGE_QUESTIONS.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <label className="text-sm font-medium text-rose-800 block">{q.text}</label>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleLoveLanguageChange(q.id as keyof LoveLanguages, val)}
                            className={cn(
                              "w-10 h-10 rounded-xl font-bold transition-all duration-200 border-2",
                              loveLanguages[q.id as keyof LoveLanguages] === val
                                ? "bg-rose-500 text-white border-rose-500 scale-110 shadow-md"
                                : "bg-white text-rose-300 border-rose-100 hover:border-rose-300"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 mt-8 transition-all shadow-md active:scale-95"
                >
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="bg-rose-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-rose-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-rose-900">Your Hobbies</h2>
                  <p className="text-rose-600 text-sm mt-2">Select things you enjoy doing together or separately.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {HOBBY_OPTIONS.map((hobby) => (
                    <button
                      key={hobby}
                      onClick={() => toggleHobby(hobby)}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200 flex items-center justify-between",
                        selectedHobbies.includes(hobby)
                          ? "bg-rose-50 border-rose-500 text-rose-700"
                          : "bg-white border-rose-100 text-rose-400 hover:border-rose-200"
                      )}
                    >
                      {hobby}
                      {selectedHobbies.includes(hobby) && <Check className="w-4 h-4 text-rose-500" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 bg-rose-50 text-rose-500 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button 
                    onClick={handleCompleteOnboarding}
                    disabled={loading}
                    className="flex-[2] bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Finish Quiz'} <Check className="w-5 h-5" />
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-red-500 text-sm font-bold text-center mt-4 bg-red-50 p-3 rounded-xl border border-red-100 italic animate-pulse">
                    {errorMsg}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
