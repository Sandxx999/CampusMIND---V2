import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ChevronRight, MapPin, User, Github, Linkedin, ExternalLink, Download, FileText, CheckCircle, Clock, Calendar, Trophy, Briefcase, GraduationCap, Award, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { fetchStudentDashboard } from '../lib/api';


const FALLBACK_STUDENT_DATA = {
  profile: {
    full_name: "Gadde Sandeep",
    roll_number: "2024_015",
    program: "B.Tech Artificial Intelligence",
    batch_year: "2024-2028",
    bio: "AI engineering student interested in machine learning, generative AI, intelligent systems, and software engineering.",
    location: "Hyderabad",
    links: { github: "#", linkedin: "#", portfolio: "#" }
  },
  academic_metrics: {
    cgpa: "3.85 / 4.0",
    class_rank: "Top 5% (Rank 3 of 68)",
    credits_completed: "52 / 160",
    attendance: { overall: 88.5, present: 160, absent: 20, status: "Exam Eligible", course_breakdown: [
      { course: "AI301", pct: 92 }, { course: "CS201", pct: 91 }, { course: "AI303", pct: 87 }, { course: "CS304", pct: 78 }
    ] },
    subject_radar: [
      { subject: "Deep Learning", score: 95, class_avg: 78 },
      { subject: "Data Structures", score: 87, class_avg: 72 },
      { subject: "Discrete Math", score: 80, class_avg: 68 },
      { subject: "Knowledge Graphs", score: 97, class_avg: 74 },
      { subject: "Applied Stats", score: 88, class_avg: 70 }
    ]
  },
  skills: [
    { name: "Python", category: "Programming", proficiency_pct: 90, verified: true },
    { name: "Machine Learning", category: "AI/ML", proficiency_pct: 84, verified: true },
    { name: "React", category: "Web", proficiency_pct: 70, verified: false },
    { name: "Docker", category: "Tools", proficiency_pct: 65, verified: false }
  ],
  projects: [
    { title: "CampusMIND 2.0", category: "AI / Full Stack", description: "Institutional Intelligence Platform", technologies: ["FastAPI", "React"], status: "Active" }
  ],
  certifications: [
    { name: "AWS Cloud Practitioner", issuer: "AWS", credential_url: "#" }
  ],
  experiences: [
    { role: "AI Engineering Intern", organization: "ABC Technologies", start_date: "Jun 2026", end_date: "Aug 2026", responsibilities: "Built ML models.", technologies: ["Python"] }
  ],
  achievements: [
    { title: "National AI Hackathon Winner", organization: "HackIndia", date: "2026" }
  ],
  career_profile: {
    target_role: "AI Engineer", target_industry: "Technology / AI", career_readiness_pct: 78
  },
  upcoming_tasks: [
    { title: "Machine Learning Assignment 3", course: "AI301", due_date: "Tomorrow", priority: "urgent" }
  ]
};

export default function StudentDashboard({ setDrawerState }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSkillTab, setActiveSkillTab] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('campusmind_token');
        const response = await fetch('/api/portal/student/me/dashboard', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch student profile data, using fallback data:", err);
        setData(FALLBACK_STUDENT_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Loading Academic Profile...</div>;

  const { profile, academic_metrics, skills, projects, certifications, experiences, achievements, activities, career_profile, upcoming_tasks } = data;

  const attendanceData = [
    { name: 'Present', value: academic_metrics?.attendance?.present || 0, color: '#0ea5e9' },
    { name: 'Absent', value: academic_metrics?.attendance?.absent || 0, color: '#e2e8f0' }
  ];

  const filteredSkills = activeSkillTab === 'All' ? skills : (skills || []).filter(s => s.category === activeSkillTab);

  return (
    <div className="flex flex-col gap-6 pb-12 animate-float-slow" style={{ animationDuration: '8s' }}>
      
      {/* A. Student Profile Hero Card */}
      <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center md:items-start border border-white/50 shadow-sm">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-300/30 to-sky-300/30 rounded-full blur-3xl"></div>
        
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/20">
          {profile?.full_name.split(' ').map(n => n[0]).join('')}
        </div>
        
        <div className="flex-1 text-center md:text-left z-10">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{profile?.full_name}</h2>
          <div className="text-sm font-semibold text-slate-500 mb-3">{profile?.program} · Roll: {profile?.roll_number}</div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1"><MapPin size={12}/> {profile?.location || 'Campus'}</span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1"><GraduationCap size={12}/> {profile?.batch_year}</span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1"><BookOpen size={12}/> IcfaiTech / University</span>
          </div>
          
          <p className="text-slate-600 text-sm italic max-w-2xl">"{profile?.bio}"</p>
        </div>
        
        <div className="flex flex-col gap-3 w-full md:w-auto z-10">
          <div className="flex gap-2 justify-center md:justify-end">
            {profile?.links?.github && <a href={profile.links.github} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"><Github size={18}/></a>}
            {profile?.links?.linkedin && <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"><Linkedin size={18}/></a>}
            {profile?.links?.portfolio && <a href={profile.links.portfolio} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"><ExternalLink size={18}/></a>}
          </div>
          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2">View Full Profile <User size={16}/></button>
          <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2">Download Resume <Download size={16}/></button>
        </div>
      </div>

      {/* B. Row 1: Academic Performance & Attendance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl flex flex-col relative overflow-hidden shadow-sm">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-200/50 rounded-full blur-2xl"></div>
          <h3 className="text-lg font-semibold text-slate-800 w-full mb-2">Attendance Analytics 📌</h3>
          
          <div className="flex items-center gap-4 flex-1">
            <div className="h-40 w-40 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value" stroke="none" cornerRadius={10}>
                    {attendanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-slate-900">{academic_metrics?.attendance?.overall}%</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 flex-1">
              {(academic_metrics?.attendance?.course_breakdown || []).map((cb, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/50 p-2 rounded-lg text-xs font-semibold">
                  <span className="text-slate-600">{cb.course}</span>
                  <span className={cb.pct < 80 ? 'text-amber-600' : 'text-emerald-600'}>{cb.pct}% {cb.pct < 80 && '⚠️'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-4 w-full">
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">✅ {academic_metrics?.attendance?.present || 0} Present</span>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">⚠️ {academic_metrics?.attendance?.absent || 0} Absent</span>
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">🎯 {academic_metrics?.attendance?.status}</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl col-span-1 lg:col-span-2 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Academic Mastery & Performance 📈</h3>
            <button onClick={() => setDrawerState(prev => ({...prev, exam: true}))} className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-3 py-1.5 rounded-full transition">
              Open Detailed Marks 📑 <ChevronRight size={16}/>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-white/60 border border-slate-100 p-3 rounded-2xl flex-1 text-center shadow-sm">
              <div className="text-xl mb-1">🏆</div>
              <div className="font-bold text-slate-800">{academic_metrics?.cgpa}</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">CGPA</div>
            </div>
            <div className="bg-white/60 border border-slate-100 p-3 rounded-2xl flex-1 text-center shadow-sm">
              <div className="text-xl mb-1">🎖️</div>
              <div className="font-bold text-slate-800 text-sm md:text-base leading-tight mt-1">{academic_metrics?.class_rank}</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">Class Standing</div>
            </div>
            <div className="bg-white/60 border border-slate-100 p-3 rounded-2xl flex-1 text-center shadow-sm">
              <div className="text-xl mb-1">📚</div>
              <div className="font-bold text-slate-800">{academic_metrics?.credits_completed}</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Completed Credits</div>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={(academic_metrics?.subject_radar || [])}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Student Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="Class Average" dataKey="class_avg" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* C. Row 2: "My Courses" Portfolio Grid */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 px-2">Active Courses</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {[
            { id: "AI301", title: "Deep Learning", fac: "Dr. Alan Turing", att: 92, score: 95 },
            { id: "CS201", title: "Data Structures", fac: "Dr. Cynthia A.", att: 91, score: 87 },
            { id: "AI303", title: "Applied Stats & ML", fac: "Dr. Leslie Alexander", att: 87, score: 88 },
            { id: "CS304", title: "Database Systems", fac: "Dr. Smith", att: 78, score: 72 }
          ].map(c => (
            <div key={c.id} className="min-w-[260px] glass-card p-5 rounded-3xl flex-shrink-0 flex flex-col border border-white/60">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md">{c.id}</span>
                <span className={`text-xs font-bold ${c.att < 80 ? 'text-amber-500' : 'text-emerald-500'}`}>{c.att}% Att</span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">{c.title}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-4"><User size={10}/> {c.fac}</p>
              
              <div className="mt-auto">
                <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                  <span>Midterm Score</span>
                  <span>{c.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${c.score}%` }}></div>
                </div>
                <button className="w-full py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded-lg transition flex items-center justify-center gap-1">Open Course Details <ArrowRight size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* D. Row 3: Skills & Competencies (Left) + Upcoming Academic Tasks (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-sky-500"/> Skills & Competencies</h3>
          <div className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar pb-1">
            {['All', 'Programming', 'AI/ML', 'Web', 'Tools'].map(tab => (
              <button 
                key={tab} onClick={() => setActiveSkillTab(tab)} 
                className={`px-3 py-1 text-xs font-semibold rounded-full transition whitespace-nowrap ${activeSkillTab === tab ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSkills.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-2">{s.name} {s.verified && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">✓ Verified</span>}</span>
                  <span>{s.proficiency_pct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" style={{ width: `${s.proficiency_pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-amber-500"/> Upcoming Academic Tasks</h3>
          <div className="space-y-3">
            {(upcoming_tasks || []).map((t, i) => (
              <div key={i} className="p-3 bg-white/60 border border-slate-100 rounded-2xl flex items-center gap-4 transition hover:bg-white shadow-sm">
                <div className={`w-2 h-10 rounded-full ${t.priority === 'urgent' ? 'bg-red-400' : t.priority === 'due_soon' ? 'bg-amber-400' : 'bg-sky-400'}`}></div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{t.title}</h4>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">{t.course}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold px-2 py-1 rounded-lg ${t.priority === 'urgent' ? 'bg-red-50 text-red-600' : t.priority === 'due_soon' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>{t.due_date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* E. Row 4: Project Portfolio Showcase */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2"><Briefcase size={18} className="text-indigo-500"/> Project Portfolio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projects || []).map((p, i) => (
            <div key={i} className="bg-white/60 border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wide">{p.category}</span>
                <span className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} title={p.status}></span>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">{p.title}</h4>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-1">{p.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {p.technologies.slice(0, 4).map((tech, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded">{tech}</span>
                ))}
                {p.technologies.length > 4 && <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-semibold rounded">+{p.technologies.length - 4}</span>}
              </div>
              
              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                {p.github_url && <a href={p.github_url} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex justify-center items-center gap-1 transition"><Github size={12}/> GitHub ↗</a>}
                {p.live_demo_url && <a href={p.live_demo_url} className="flex-1 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg flex justify-center items-center gap-1 transition"><ExternalLink size={12}/> Demo ↗</a>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* F. Row 5: Internships & Experience (Left) + Certifications (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Trophy size={18} className="text-emerald-500"/> Internships & Experience</h3>
          <div className="space-y-4">
            {(experiences || []).map((exp, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{exp.role}</h4>
                  <div className="text-xs font-semibold text-slate-600 mb-1">{exp.organization} · {exp.start_date} – {exp.end_date}</div>
                  <p className="text-xs text-slate-500 mb-2">{exp.responsibilities}</p>
                  <div className="flex flex-wrap gap-1">
                    {exp.technologies.map((t, idx) => <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Award size={18} className="text-orange-500"/> Certifications</h3>
          <div className="space-y-3">
            {(certifications || []).map((cert, i) => (
              <div key={i} className="p-3 bg-white/60 border border-slate-100 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 flex-shrink-0">
                  <CheckCircle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{cert.name}</h4>
                  <div className="text-xs text-slate-500">{cert.issuer}</div>
                </div>
                {cert.credential_url && (
                  <a href={cert.credential_url} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition" title="View Credential"><ExternalLink size={14}/></a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* G. Row 6: Achievements (Left) + Career Development (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Achievements</h3>
          <div className="space-y-4">
            {(achievements || []).map((ach, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5"></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{ach.title}</h4>
                  <div className="text-xs text-slate-500">{ach.organization} · {ach.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-indigo-500"/> Career Development</h3>
          {career_profile ? (
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Target Role</div>
                  <h4 className="font-bold text-slate-800">{career_profile.target_role}</h4>
                  <div className="text-xs text-slate-500">{career_profile.target_industry}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">{career_profile.career_readiness_pct}%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Prepared</div>
                </div>
              </div>
              
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-5">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${career_profile.career_readiness_pct}%` }}></div>
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-800 mb-1">Skill Gap Recommendation</h5>
                  <p className="text-[11px] text-amber-700">Consider learning MLOps & Container Orchestration (Docker/Kubernetes) to strengthen your profile for AI Engineering roles.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">No career profile setup yet.</div>
          )}
        </div>
      </div>

      {/* H. Row 7: Academic Timeline & Profile Completeness */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2"><Calendar size={18} className="text-sky-500"/> Academic Timeline</h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-center mb-8 relative px-4">
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 -z-10 hidden md:block"></div>
          
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs mb-2 ring-4 ring-white shadow-sm">✓</div>
            <h4 className="font-bold text-slate-800 text-sm">2024</h4>
            <p className="text-xs text-slate-500">Enrolled B.Tech AI</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs mb-2 ring-4 ring-white shadow-sm">✓</div>
            <h4 className="font-bold text-slate-800 text-sm">2025</h4>
            <p className="text-xs text-slate-500">Core CS & AI Foundations</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs mb-2 ring-4 ring-white shadow-md animate-pulse">✦</div>
            <h4 className="font-bold text-indigo-700 text-sm">2026</h4>
            <p className="text-xs text-indigo-500 font-medium">AI Internship & CampusMIND</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-white/60 border border-slate-100 rounded-2xl">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-slate-800 text-sm">Profile Completeness</h4>
              <span className="text-xs font-bold text-emerald-600">85% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition whitespace-nowrap">
            Add Publication +
          </button>
        </div>
      </div>

    </div>
  );
}
