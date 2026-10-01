import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDemo, setActiveDemo] = useState(null);

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(x, [-0.5, 0.5], ['-7deg', '7deg']);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`/api/auth/login`, {
        identifier: username.trim(),
        email: username.trim(),
        username: username.trim(),
        password: password
      });
      const { access_token, user } = response.data;
      localStorage.setItem('campusmind_token', access_token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#0ea5e9', '#a855f7']
      });

      setTimeout(() => {
        onLoginSuccess(user);
      }, 1000);
    } catch (err) {
      setError('Invalid username or password. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoSelect = (role) => {
    setActiveDemo(role);
    if (role === 'student') {
      setUsername('STU_2024_015');
      setPassword('password123');
    } else {
      setUsername('FAC_DEMO_01');
      setPassword('password123');
    }
    setError('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
      {/* Ambient Glowing Canvas Backdrop */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            x: ['-5%', '5%', '-5%'],
            y: ['-5%', '5%', '-5%'],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#6366f1] opacity-40 mix-blend-screen"
          style={{ filter: 'blur(120px)' }}
        />
        <motion.div
          animate={{
            x: ['5%', '-5%', '5%'],
            y: ['5%', '-5%', '5%'],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] rounded-full bg-[#0ea5e9] opacity-40 mix-blend-screen"
          style={{ filter: 'blur(120px)' }}
        />
        <motion.div
          animate={{
            x: ['-10%', '10%', '-10%'],
            y: ['10%', '-10%', '10%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[40%] left-[50%] w-[600px] h-[600px] rounded-full bg-[#a855f7] opacity-30 mix-blend-screen"
          style={{ filter: 'blur(120px)' }}
        />
      </div>

      {/* 3D Glassmorphic Card Container */}
      <div className="relative z-10 w-full max-w-md p-4 perspective-1000">
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full rounded-3xl overflow-hidden p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(28px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
            rotateX, 
            rotateY,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8" style={{ transform: 'translateZ(30px)' }}>
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366f1] via-[#0ea5e9] to-[#a855f7] flex items-center justify-center p-[1.5px] mb-4 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            >
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[#0ea5e9]" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400 tracking-tight">
              CampusMIND Portal
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1.5 text-center">
              Enterprise Academic Intelligence & Knowledge Graph
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1-Click Demo Quick-Fill Switcher */}
          <div className="flex gap-3 mb-6" style={{ transform: 'translateZ(20px)' }}>
            <button
              type="button"
              onClick={() => handleDemoSelect('student')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300 ${
                activeDemo === 'student'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
              }`}
            >
              <span>🎓</span> Student Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('faculty')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300 ${
                activeDemo === 'faculty'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
              }`}
            >
              <span>👨‍🏫</span> Faculty Demo
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4" style={{ transform: 'translateZ(40px)' }}>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="User ID or Email"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:opacity-95 text-white font-bold rounded-xl shadow-[0_5px_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 overflow-hidden relative"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <span>Access Dashboard</span>
              )}
            </motion.button>
          </form>

          {/* Footer Security Badge */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium" style={{ transform: 'translateZ(20px)' }}>
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>End-to-End JWT RBAC & OKF Triplestore Protected</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
