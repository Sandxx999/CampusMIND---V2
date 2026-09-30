import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function ChatAssistant({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    const msgText = text;
    setMessages(prev => [...prev, { role: 'user', content: msgText }]);
    setInput('');
    setIsTyping(true);
    setIsOpen(true);
    
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // 6 second timeout
    const timeoutId = setTimeout(() => abortController.abort('timeout'), 6000);

    try {
      const response = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('campusmind_token') || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ message: msgText, conversation_history: messages }),
        signal: abortController.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply, trace: data.reasoning_trace, source: data.source }]);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err === 'timeout') {
          setMessages(prev => [...prev, { 
              role: 'ai', 
              content: "Request timed out. The server took longer than 6 seconds.", 
              isError: true,
              retryText: msgText
          }]);
      } else {
          setMessages(prev => [...prev, { role: 'ai', content: "An error occurred. Please try again.", isError: true, retryText: msgText }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const drawerStyle = {
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(28px) saturate(190%)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '-15px 0 35px rgba(15, 23, 42, 0.08)'
  };

  const studentChips = [
    '📌 What is my current attendance and exam eligibility?',
    '📝 my test scores',
    '🗓️ What classes do I have today?'
  ];

  const facultyChips = [
    '📋 Show my pending grading tasks',
    '⚠️ Which students are below 75% attendance?',
    '🗓️ What is my schedule today?',
    '📊 Which class has the lowest average score?'
  ];

  const chips = user?.role === 'faculty' ? facultyChips : studentChips;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white p-4 rounded-full shadow-2xl shadow-sky-500/30 flex items-center gap-2 font-bold transition hover:-translate-y-1 z-40"
      >
        <Sparkles size={20} /> <span className="hidden sm:inline">Ask CampusMIND AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40" 
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={drawerStyle}
              className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/50 bg-white/30">
                <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 tracking-tight">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  CampusMIND Copilot — AI & Knowledge Graph
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center mt-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles size={24} className="text-indigo-500" />
                    </div>
                    <p className="font-semibold text-slate-600 mb-6">How can I assist you today?</p>
                    <div className="flex flex-col gap-2 px-2">
                      {chips.map((q, i) => {
                        const iconMatch = q.match(/^([^\s]+)\s+(.*)/);
                        const emoji = iconMatch ? iconMatch[1] : '';
                        const text = iconMatch ? iconMatch[2] : q;
                        return (
                          <button key={i} onClick={() => handleSend(text)} className="text-left text-xs p-3 bg-white/70 hover:bg-white rounded-xl transition text-slate-700 font-medium border border-slate-100 shadow-sm flex items-center gap-2">
                            <span className="text-base">{emoji}</span> {text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-sky-500 text-white rounded-tr-sm' : msg.isError ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'}`}>
                      <div className="text-sm leading-relaxed prose prose-sm prose-slate max-w-none font-medium">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.isError && msg.retryText && (
                        <button onClick={() => handleSend(msg.retryText)} className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 underline">
                          Retry Request
                        </button>
                      )}
                      {msg.trace && msg.trace !== "No graph traversal needed." && !msg.isError && (
                        <details className="mt-3 text-xs bg-slate-50 rounded-lg border border-slate-200 overflow-hidden group">
                          <summary className="cursor-pointer p-2 font-semibold text-slate-500 flex items-center gap-1 hover:bg-slate-100 transition">
                            <Search size={12} /> View Graph Reasoning Trace
                          </summary>
                          <div className="p-3 bg-white/50 border-t border-slate-200 font-mono text-[10px] text-slate-600 break-all">
                            {msg.trace}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 border border-slate-100 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              
              <div className="p-4 bg-white/50 border-t border-white/50">
                <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="relative flex items-center">
                  <input 
                    className="w-full bg-white border border-slate-200 text-slate-800 p-3.5 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-sm"
                    placeholder="Message CampusMIND..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  <button type="submit" disabled={isTyping || !input.trim()} className="absolute right-2 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
