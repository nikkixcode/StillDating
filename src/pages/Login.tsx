import React, { useEffect } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { login } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const autoLogin = async () => {
      try {
        await login();
        navigate('/');
      } catch (error) {
        console.error('Login failed:', error);
      }
    };
    autoLogin();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center px-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full border border-rose-100"
      >
        <div className="bg-rose-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Heart className="w-10 h-10 text-white fill-current" />
        </div>
        <h1 className="text-4xl font-bold text-rose-900 mb-4 tracking-tight">StillDating</h1>
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-rose-500 animate-spin" />
          <p className="text-rose-600 font-medium">Entering your private space...</p>
        </div>
      </motion.div>
    </div>
  );
};
