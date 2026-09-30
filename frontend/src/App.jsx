import React, { useState, useEffect, useRef } from 'react';
import { getStoredUser, logoutUser, fetchStudentProfile, fetchStudentMarks, fetchStudentTimetable, fetchFacultyDashboard, fetchNotices, changePassword, fetchGraphElements, fetchGraphStats, postPortalChat, fetchStudentPerformance } from './lib/api';
import axios from 'axios';
import CytoscapeComponent from 'react-cytoscapejs';
import { Book, Calendar, ClipboardList, LayoutDashboard, LogOut, Network, Shield, Bell, X, Check, Search, MessageCircle, Sparkles, Send, ChevronDown, ChevronUp, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import confetti from 'canvas-confetti';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';
import ChatAssistant from './components/ChatAssistant';

import LoginPage from './pages/LoginPage';

// --- Password Modal ---
function PasswordModal({ user, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await changePassword({ user_id: user.id, old_password: oldPassword, new_password: newPassword });
      setStatus('Success! Password updated.');
      setTimeout(onClose, 1500);
    } catch (err) {
      setStatus('Error updating password.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card p-6 rounded-2xl w-96 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><Shield size={20} className="text-sky-500"/> Change Password</h3>
          {status && <div className="mb-4 text-sm font-medium text-sky-600 bg-sky-50 p-2 rounded-lg border border-sky-100">{status}</div>}
          <form onSubmit={handleSubmit}>
            <input className="w-full bg-white/50 border border-slate-200 text-primary p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400" type="password" placeholder="Old Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
            <input className="w-full bg-white/50 border border-slate-200 text-primary p-3 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-sky-400" type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium p-3 rounded-xl transition shadow-lg shadow-slate-900/20">Update Password</button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// --- Drawers ---
function Drawer({ isOpen, onClose, title, icon: Icon, children, position = 'right', onOpenEffect }) {
  useEffect(() => {
    if (isOpen && onOpenEffect) onOpenEffect();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" 
          />
          <motion.div 
            initial={{ x: position === 'right' ? '100%' : position === 'left' ? '-100%' : 0, y: position === 'bottom' ? '100%' : 0 }} 
            animate={{ x: 0, y: 0 }} 
            exit={{ x: position === 'right' ? '100%' : position === 'left' ? '-100%' : 0, y: position === 'bottom' ? '100%' : 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed ${position === 'bottom' ? 'bottom-0 left-0 right-0 h-2/3 rounded-t-3xl' : position === 'right' ? 'top-0 right-0 bottom-0 w-full max-w-md rounded-l-3xl' : 'top-0 left-0 bottom-0 w-full max-w-md rounded-r-3xl'} glass-card z-50 flex flex-col shadow-2xl overflow-hidden border-0 ${position === 'bottom' ? 'border-t' : position === 'right' ? 'border-l' : 'border-r'} border-white/80`}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/40">
              <h2 className="text-xl font-bold flex items-center gap-3 text-primary">
                {Icon && <div className="p-2 bg-sky-100 rounded-lg text-sky-600"><Icon size={20} /></div>}
                {title}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- Dashboard Components ---
function MainDashboard({ setDrawerState }) {
  // Mock performance data for charts
  const performanceData = [
    { subject: 'AI301', score: 38, max: 40 },
    { subject: 'CS201', score: 35, max: 40 },
    { subject: 'MATH202', score: 32, max: 40 },
    { subject: 'AI302', score: 39, max: 40 },
  ];

  const attendanceData = [
    { name: 'Present', value: 88.5, color: '#0ea5e9' },
    { name: 'Absent', value: 11.5, color: '#e2e8f0' }
  ];
  
  const radarData = [
    { subject: "Deep Learning", score: 95, class_avg: 78 },
    { subject: "Data Structures", score: 87.5, class_avg: 72 },
    { subject: "Discrete Math", score: 80, class_avg: 68 },
    { subject: "Knowledge Graphs", score: 97.5, class_avg: 74 },
    { subject: "Applied Stats", score: 90, class_avg: 71 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-float-slow" style={{ animationDuration: '8s' }}>
      {/* Attendance Analytics Card */}
      <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-200/50 rounded-full blur-2xl"></div>
        <h3 className="text-lg font-semibold text-primary w-full text-left mb-2">Attendance Analytics 📌</h3>
        <div className="h-48 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} startAngle={90} endAngle={-270} dataKey="value" stroke="none" cornerRadius={10}>
                {attendanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold text-slate-900">88.5%</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-4 w-full">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">✅ 160 Present</span>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">⚠️ 20 Absent</span>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">🎯 Exam Eligible</span>
        </div>
      </div>

      {/* Academic Mastery & Performance Card */}
      <div className="glass-card p-6 rounded-3xl col-span-1 lg:col-span-2 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary">Academic Mastery & Performance 📈</h3>
          <button onClick={() => setDrawerState(prev => ({...prev, exam: true}))} className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-3 py-1.5 rounded-full transition">
            Open Detailed Marks 📑 <ChevronRight size={16}/>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="bg-white/60 border border-white/80 p-3 rounded-2xl flex-1 text-center shadow-sm">
            <div className="text-2xl mb-1">🏆</div>
            <div className="font-bold text-slate-800">3.85 / 4.0</div>
            <div className="text-xs text-slate-500 font-semibold uppercase">CGPA</div>
          </div>
          <div className="bg-white/60 border border-white/80 p-3 rounded-2xl flex-1 text-center shadow-sm">
            <div className="text-2xl mb-1">🎖️</div>
            <div className="font-bold text-slate-800">Top 5% (Rank 3 of 68)</div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Class Standing</div>
          </div>
          <div className="bg-white/60 border border-white/80 p-3 rounded-2xl flex-1 text-center shadow-sm">
            <div className="text-2xl mb-1">📚</div>
            <div className="font-bold text-slate-800">52 / 160 Credits</div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Completed Credits</div>
          </div>
        </div>

        <div className="flex-1 min-h-[250px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10}} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Student Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Radar name="Class Average" dataKey="class_avg" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} />
              <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Schedule Summary */}
      <div className="glass-card p-6 rounded-3xl col-span-1 lg:col-span-3">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-primary">Today's Schedule ⏰</h3>
          <button onClick={() => setDrawerState(prev => ({...prev, timetable: true}))} className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-3 py-1.5 rounded-full transition">
            View Full Weekly Timetable 🗓️ <ChevronRight size={16}/>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { time: "09:00 AM - 10:15 AM", course: "AI301", name: "Deep Learning & Neural Networks", room: "Lab 1 (AI Cluster)", instructor: "Dr. Alan Turing", emoji: "🕘" },
            { time: "10:30 AM - 11:45 AM", course: "CS201", name: "Data Structures & Algorithms", room: "Room 302", instructor: "Dr. Cynthia A.", emoji: "🕙" },
            { time: "12:00 PM - 01:15 PM", course: "AI302", name: "Knowledge Representation & Ontologies", room: "Room 304", instructor: "Dr. Alan Turing", emoji: "🕛" },
            { time: "02:00 PM - 03:15 PM", course: "MATH202", name: "Discrete Mathematics & Linear Algebra", room: "Lecture Hall 2", instructor: "Dr. John Simon", emoji: "🕑" },
            { time: "03:30 PM - 04:45 PM", course: "AI303", name: "Applied Statistics & Machine Learning", room: "Computing Lab 3", instructor: "Dr. Leslie Alexander", emoji: "🕒" }
          ].map((cls, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/60 border border-white/80 shadow-sm hover:shadow-md transition flex flex-col h-full">
              <div className="text-xs font-bold text-sky-600 mb-1 flex items-center gap-1">{cls.emoji} {cls.time}</div>
              <div className="font-bold text-slate-800">{cls.course}</div>
              <div className="text-sm text-slate-600 line-clamp-2 mb-3">{cls.name}</div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                <span className="text-[10px] flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md truncate"><MapPin size={10}/> {cls.room}</span>
                <span className="text-[10px] flex items-center gap-1 text-slate-500 truncate"><User size={10}/> {cls.instructor.split(' ').pop()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Knowledge Graph Explorer ---
function GraphExplorer() {
  const [elements, setElements] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    fetchGraphElements(150).then(data => {
      setElements([
        ...data.nodes.map(n => ({ data: { id: n.id, label: n.label, type: n.type, ...n.properties } })),
        ...data.edges.map(e => ({ data: { source: e.source, target: e.target, label: e.label } }))
      ]);
    }).catch(console.error);
  }, []);

  const layout = { name: 'cose', animate: false };
  const style = [
    { selector: 'node', style: {
      'label': 'data(label)',
      'background-color': (ele) => {
        const type = ele.data('type');
        if(type === 'Course') return '#3b82f6';
        if(type === 'Faculty') return '#10b981';
        if(type === 'Student') return '#8b5cf6';
        if(type === 'Department') return '#f59e0b';
        return '#64748b';
      },
      'color': '#0f172a',
      'text-valign': 'bottom',
      'text-margin-y': 5,
      'font-size': '12px',
      'font-family': 'Inter',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.8,
      'text-background-padding': 2,
      'text-background-shape': 'roundrectangle'
    }},
    { selector: 'edge', style: {
      'width': 2,
      'line-color': '#cbd5e1',
      'target-arrow-color': '#cbd5e1',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '10px',
      'text-rotation': 'autorotate',
      'color': '#94a3b8',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.8
    }}
  ];

  return (
    <div className="h-[calc(100vh-140px)] w-full rounded-3xl overflow-hidden glass-card relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=')]">
      {elements.length > 0 && (
        <CytoscapeComponent 
          elements={elements} 
          style={{ width: "100%", height: "600px", minHeight: "600px", position: "relative" }} 
          layout={layout} 
          stylesheet={style}
          cy={cy => {
            cy.resize();
            cy.fit();
            cy.on('tap', 'node', (evt) => setSelectedNode(evt.target.data()));
            cy.on('tap', (evt) => { if(evt.target === cy) setSelectedNode(null); });
          }}
        />
      )}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
            className="absolute top-4 right-4 w-72 glass-card p-5 rounded-2xl border border-white shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-800 text-lg">{selectedNode.label}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
            </div>
            <div className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold mb-4">{selectedNode.type}</div>
            <div className="space-y-2 text-sm text-slate-600">
              {Object.entries(selectedNode).map(([k, v]) => {
                if (['id', 'label', 'type'].includes(k)) return null;
                return <div key={k}><span className="font-semibold capitalize">{k.replace('_', ' ')}:</span> {String(v)}</div>
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 glass-card px-4 py-2 rounded-full border border-white">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600"><div className="w-3 h-3 rounded-full bg-[#4f46e5]"></div> Courses</div>
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600"><div className="w-3 h-3 rounded-full bg-[#059669]"></div> Faculty</div>
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600"><div className="w-3 h-3 rounded-full bg-[#9333ea]"></div> Students</div>
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600"><div className="w-3 h-3 rounded-full bg-[#d97706]"></div> Depts</div>
      </div>
    </div>
  );
}

// --- Main App Root ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard | graph
  const [drawers, setDrawers] = useState({ notice: false, exam: false, timetable: false, password: false });

  useEffect(() => {
    const existingUser = getStoredUser();
    if (existingUser) setUser(existingUser);
  }, []);

  if (!user) return <LoginPage onLoginSuccess={setUser} />;

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#38bdf8', '#818cf8', '#34d399'] });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-primary relative z-0">
      <div className="absolute inset-0 ambient-blur -z-10 bg-[radial-gradient(circle_at_15%_50%,_rgba(56,189,248,0.15),_transparent_50%),radial-gradient(circle_at_85%_30%,_rgba(168,85,247,0.15),_transparent_50%)] fixed pointer-events-none" />
      
      {/* Top Floating Navbar */}
      <div className="p-4 fixed top-0 w-full z-30">
        <header className="glass-card max-w-7xl mx-auto rounded-full px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-2xl">🎓</span> CampusMIND Portal
            </h1>
            <nav className="hidden md:flex gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200">
              <button onClick={() => setActiveView('dashboard')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${activeView === 'dashboard' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-500 hover:text-slate-800'}`}>📊 Dashboard</button>
              <button onClick={() => setActiveView('graph')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${activeView === 'graph' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-500 hover:text-slate-800'}`}>🌐 Knowledge Graph</button>
              <button onClick={() => setDrawers(p => ({...p, notice: true}))} className="px-4 py-1.5 rounded-full text-sm font-semibold text-slate-500 hover:text-slate-800 transition">📢 Notice Board</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 bg-white/50 pl-2 pr-4 py-1.5 rounded-full border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg">👤</div>
              <div className="text-left leading-tight">
                <div className="text-sm font-bold text-slate-800">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-semibold">{user.id.replace('STU_', '')} | {user.department}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDrawers(p => ({...p, password: true}))} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white text-slate-600 border border-slate-200 transition shadow-sm" title="Change Password"><Shield size={18}/></button>
              <button onClick={() => { logoutUser(); setUser(null); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-red-50 text-red-500 border border-slate-200 transition shadow-sm" title="Logout"><LogOut size={18}/></button>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pt-28 px-6 pb-24 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto h-full">
          {activeView === 'dashboard' ? (
            user.role === 'faculty' ? <FacultyDashboard user={user} setDrawerState={setDrawers} /> : <StudentDashboard setDrawerState={setDrawers} />
          ) : <GraphExplorer />}
        </div>
      </main>

      {/* Drawers */}
      <Drawer isOpen={drawers.exam} onClose={() => setDrawers(p => ({...p, exam: false}))} title="Exam Results" icon={ClipboardList} position="right" onOpenEffect={triggerConfetti}>
        <div className="space-y-4">
          {[
            { course: "AI301", name: "Deep Learning", score: 38, max: 40, grade: "A+" },
            { course: "CS201", name: "Data Structures", score: 35, max: 40, grade: "A" },
            { course: "MATH202", name: "Discrete Math", score: 32, max: 40, grade: "B+" },
            { course: "AI302", name: "Knowledge Representation", score: 39, max: 40, grade: "A+" }
          ].map((res, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="p-4 glass-card bg-white/80 rounded-2xl flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-sky-600">{res.course}</div>
                <div className="font-bold text-slate-800">{res.name}</div>
                <div className="text-sm font-semibold text-slate-500 mt-1">Score: {res.score}/{res.max} ({Math.round(res.score/res.max*100)}%)</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 text-white font-bold text-lg">{res.grade}</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-green-200">Pass</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Drawer>

      <Drawer isOpen={drawers.timetable} onClose={() => setDrawers(p => ({...p, timetable: false}))} title="Weekly Timetable" icon={Calendar} position="right">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => (
            <button key={day} className={`px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition ${i === 0 ? 'bg-sky-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}>{day}</button>
          ))}
        </div>
        <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-slate-200">
          {[
            { time: "09:00 AM - 10:15 AM", course: "AI301", name: "Deep Learning & Neural Networks", room: "Lab 1 (AI Cluster)", instructor: "Dr. Alan Turing" }, { time: "10:30 AM - 11:45 AM", course: "CS201", name: "Data Structures & Algorithms", room: "Room 302", instructor: "Dr. Cynthia A." },
            { time: "12:00 PM - 01:15 PM", course: "AI302", name: "Knowledge Representation & Ontologies", room: "Room 304", instructor: "Dr. Alan Turing" }, { time: "02:00 PM - 03:15 PM", course: "MATH202", name: "Discrete Mathematics & Linear Algebra", room: "Lecture Hall 2", instructor: "Dr. John Simon" },
            { time: "03:30 PM - 04:45 PM", course: "AI303", name: "Applied Statistics & Machine Learning", room: "Computing Lab 3", instructor: "Dr. Leslie Alexander" }
          ].map((cls, i) => (
            <div key={i} className="relative pl-10">
              <div className="absolute left-[13px] top-4 w-3 h-3 bg-sky-500 rounded-full border-2 border-white shadow-sm"></div>
              <div className="p-4 glass-card bg-white/80 rounded-2xl">
                <div className="text-xs font-bold text-sky-600 mb-1 flex items-center gap-1"><Clock size={12}/> {cls.time}</div>
                <div className="font-bold text-slate-800 text-base">{cls.name}</div>
                <div className="text-xs text-slate-500 mb-3">{cls.course}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100"><MapPin size={10}/> {cls.room}</span>
                  <span className="text-[10px] font-bold flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100"><User size={10}/> {cls.instructor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      <Drawer isOpen={drawers.notice} onClose={() => setDrawers(p => ({...p, notice: false}))} title="Notice Board" icon={Bell} position="left">
        <div className="space-y-4">
          <div className="p-5 glass-card bg-white/80 rounded-2xl border-l-4 border-l-red-500">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-800">Mid-Term Exam Schedule Released</h4>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200">High Priority</span>
            </div>
            <p className="text-sm text-slate-600 mb-2">The schedule for the upcoming Mid-Term 1 exams has been published. Please check your personalized timetable.</p>
            <div className="text-xs text-slate-400">Today, 09:30 AM</div>
          </div>
          <div className="p-5 glass-card bg-white/80 rounded-2xl border-l-4 border-l-sky-500">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-800">AI Guest Lecture</h4>
              <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded-full border border-sky-200">Event</span>
            </div>
            <p className="text-sm text-slate-600 mb-2">Join us for a guest lecture on Large Language Models in the main auditorium this Friday.</p>
            <div className="text-xs text-slate-400">Yesterday, 14:15 PM</div>
          </div>
        </div>
      </Drawer>

      {drawers.password && <PasswordModal user={user} onClose={() => setDrawers(p => ({...p, password: false}))} />}
      
      {/* Floating AI Chat Drawer */}
      <ChatAssistant user={user} />
    </div>
  );
}
