'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Zap, ShieldCheck, CheckCircle2, Bot } from 'lucide-react';

interface LogMessage {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'error' | 'warning';
}

export default function Automation() {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/live-log');
        if (res.ok) setLogs(await res.json());
      } catch (err) {}
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-black font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight italic">Automation</h1>
            <p className="text-zinc-500 text-sm">Monitor and maintain your lottery engine.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
             <div className="flex items-center gap-3">
               <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">Engine: Online</div>
               <div className="text-[10px] text-zinc-400 font-mono">NEXT RUN: Tomorrow 9:00 AM</div>
             </div>
             
             <button 
               onClick={async (e) => {
                 const btn = e.currentTarget;
                 btn.disabled = true;
                 btn.innerHTML = 'Running...';
                 setLogs([{ 
                   id: 'test', 
                   timestamp: new Date().toISOString(), 
                   message: 'Triggering engine...', 
                   level: 'info' 
                 }]);
                 try {
                   const res = await fetch('/api/run-automation', { method: 'POST' });
                   if (res.ok) btn.innerHTML = 'Triggered!';
                   else btn.innerHTML = 'Error';
                 } catch {
                   btn.innerHTML = 'Error';
                 }
                 setTimeout(() => { btn.disabled = false; btn.innerHTML = '▶ Run Engine Now'; }, 3000);
               }}
               className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
             >
               ▶ Run Engine Now
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="airbnb-card p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <CheckCircle2 size={24} />
                 </div>
                 <h3 className="font-bold">Telecharge</h3>
               </div>
               <p className="text-xs text-zinc-500 leading-relaxed mb-4">Status: Active & Verified. No challenges detected.</p>
               <div className="text-[10px] font-bold text-zinc-400 uppercase">Last Entry: Today, 1:45 PM</div>
            </div>

            <div className="airbnb-card p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <ShieldCheck size={24} />
                 </div>
                 <h3 className="font-bold">Broadway Direct</h3>
               </div>
               <p className="text-xs text-zinc-500 leading-relaxed mb-4">Status: Active. CapSolver auto-bypass enabled.</p>
               <div className="text-[10px] font-bold text-green-500 uppercase bg-green-500/10 px-2 py-1 rounded inline-block">Auto-Solving Turnstile</div>
            </div>

            <div className="airbnb-card p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 opacity-60">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Bot size={24} />
                 </div>
                 <h3 className="font-bold">LuckySeat</h3>
               </div>
               <p className="text-xs text-zinc-500 leading-relaxed mb-4">Status: Standby. Checking for open lotteries.</p>
               <div className="text-[10px] font-bold text-zinc-400 uppercase">Next Poll: 4 hours</div>
            </div>
        </div>

        <section className="airbnb-card bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-8">
            <h3 className="font-bold mb-6 flex items-center gap-2">
               <Zap size={18} fill="currentColor" className="text-blue-500" />
               Live Activity Log
            </h3>
            <div ref={scrollRef} className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 font-mono text-xs overflow-y-auto h-[300px] scroll-smooth">
               {logs.length === 0 ? (
                 <div className="text-zinc-500 italic">No recent activity. Click 'Run Engine Now' to start a batch.</div>
               ) : (
                 logs.map((log) => (
                   <div key={log.id} className={`mb-2 ${
                     log.level === 'error' ? 'text-red-500' :
                     log.level === 'success' ? 'text-green-500' :
                     log.level === 'warning' ? 'text-yellow-500' :
                     'text-zinc-400'
                   }`}>
                     <span className="opacity-50 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                   </div>
                 ))
               )}
            </div>
        </section>
      </main>
    </div>
  );
}
