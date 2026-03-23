'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CheckCircle2, XCircle, Clock, Filter, Ticket, ArrowUpDown } from 'lucide-react';

interface EntryRecord {
  showId: string;
  profileId: string;
  success: boolean;
  message: string;
  timestamp: string;
  showTitle: string;
  profileName: string;
  site: string;
  screenshotPath?: string;
}

export default function Entries() {
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    fetch('/api/entries')
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = entries.filter(e => {
    if (filter === 'success') return e.success;
    if (filter === 'failed') return !e.success;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.timestamp).getTime();
    const db = new Date(b.timestamp).getTime();
    return sortNewest ? db - da : da - db;
  });

  const successCount = entries.filter(e => e.success).length;
  const failedCount = entries.filter(e => !e.success).length;

  return (
    <div className="flex min-h-screen bg-white dark:bg-black font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12 overflow-y-auto">
        <header className="flex items-end justify-between mb-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight italic">Entry Records</h1>
            <p className="text-zinc-500 text-sm">Track every lottery submission and its outcome.</p>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="airbnb-card bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Ticket size={22} />
            </div>
            <div>
              <div className="text-2xl font-black">{entries.length}</div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Entries</div>
            </div>
          </div>
          <div className="airbnb-card bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-green-600">{successCount}</div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Successful</div>
            </div>
          </div>
          <div className="airbnb-card bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
              <XCircle size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-red-500">{failedCount}</div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Failed</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 border border-zinc-100 dark:border-zinc-800">
            {(['all', 'success', 'failed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortNewest(!sortNewest)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-foreground transition-colors border border-zinc-100 dark:border-zinc-800"
          >
            <ArrowUpDown size={12} />
            {sortNewest ? 'Newest First' : 'Oldest First'}
          </button>
        </div>

        {/* Entry Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32 text-zinc-400">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="airbnb-card bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-16 flex flex-col items-center justify-center text-center">
            <Clock size={48} className="text-zinc-300 mb-4" />
            <h3 className="text-lg font-bold mb-2">No Entries Yet</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Your lottery entries will appear here once the automation engine starts running. Enroll in a show from the Dashboard to get started.
            </p>
          </div>
        ) : (
          <div className="airbnb-card bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-50 dark:border-zinc-800 text-left">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Show</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Profile</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Site</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Message</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, i) => (
                  <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800 last:border-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      {entry.success ? (
                        <span className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                          <CheckCircle2 size={14} /> Success
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                          <XCircle size={14} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold">{entry.showTitle}</td>
                    <td className="px-6 py-4 text-zinc-500">{entry.profileName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        entry.site === 'BroadwayDirect'
                          ? 'bg-purple-500/10 text-purple-600'
                          : entry.site === 'Telecharge'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-green-500/10 text-green-600'
                      }`}>
                        {entry.site}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs max-w-[200px] truncate">{entry.message}</td>
                    <td className="px-6 py-4 text-zinc-400 text-xs font-mono whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
