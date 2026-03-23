'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ShowCard } from '@/components/ShowCard';
import { MOCK_SHOWS } from '@/lib/show-data';
import { Search, Bell, Grid, List as ListIcon, Ticket, Loader2, BellOff } from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingShowId, setLoadingShowId] = useState<string | null>(null);
  const [enrollModalShowId, setEnrollModalShowId] = useState<string | null>(null);
  const [modalSelectedProfiles, setModalSelectedProfiles] = useState<string[]>([]);

  React.useEffect(() => {
    fetch('/api/enroll').then(res => res.json()).then(data => setEnrollments(data));
    fetch('/api/profiles').then(res => res.json()).then(data => setProfiles(data));
  }, []);

  const isEnrolled = (showId: string) => enrollments.some(e => e.showId === showId && e.active);
  const getEnrolledProfiles = (showId: string) => {
    const e = enrollments.find(e => e.showId === showId);
    return e?.profileIds || [];
  }

  const handleOpenEnrollModal = (showId: string) => {
    setEnrollModalShowId(showId);
    // Pre-select currently enrolled profiles, or all profiles if none
    const currentList = getEnrolledProfiles(showId);
    setModalSelectedProfiles(currentList.length > 0 ? currentList : profiles.map(p => p.id));
  };

  const saveEnrollment = async (showId: string, profileIds: string[], forceActive?: boolean) => {
    setLoadingShowId(showId);
    const currentlyEnrolled = isEnrolled(showId);
    const targetActive = forceActive ?? !currentlyEnrolled;
    try {
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId,
          profileIds,
          active: targetActive,
          autoReenroll: targetActive
        })
      });
      if (response.ok) {
        setEnrollments(prev => {
          const index = prev.findIndex(e => e.showId === showId);
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...next[index], active: targetActive, profileIds };
            return next;
          }
          return [...prev, { showId, active: targetActive, profileIds }];
        });
      }
      setEnrollModalShowId(null);
    } catch (err) {
      console.error('Failed to toggle enrollment:', err);
    } finally {
      setLoadingShowId(null);
    }
  };

  const tabs = ['All', 'BroadwayDirect', 'LuckySeat', 'Telecharge'];

  const filteredShows = useMemo(() => {
    return MOCK_SHOWS.filter(show => {
      const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'All' || show.site === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-black font-sans text-foreground">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 lg:p-12 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight italic">Dashboard</h1>
            <p className="text-zinc-500 text-sm">Good morning! You have 12 active lotteries today.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#ff385c] transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search shows..."
                className="pl-12 pr-6 py-3 bg-[#f5f5f7] dark:bg-zinc-900 rounded-full w-80 text-sm border-none focus:ring-2 focus:ring-[#ff385c]/20 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#f5f5f7] dark:bg-zinc-900 text-zinc-600 hover:text-foreground transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#ff385c] rounded-full border-2 border-white dark:border-zinc-900"></span>
            </button>
          </div>
        </header>

        {/* Filters and View Toggles */}
        <section className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2 p-1 bg-[#f5f5f7] dark:bg-zinc-900 rounded-2xl">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground scale-100' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 px-2 py-1.5 bg-[#f5f5f7] dark:bg-zinc-900 rounded-xl">
             <button 
               onClick={() => setViewMode('grid')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground' : 'text-zinc-400 hover:text-foreground'}`}
             >
               <Grid size={18} />
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground' : 'text-zinc-400 hover:text-foreground'}`}
             >
               <ListIcon size={18} />
             </button>
          </div>
        </section>

        {/* Show Content */}
        <section className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "flex flex-col gap-4"}>
          {filteredShows.length > 0 ? (
            filteredShows.map(show => (
              viewMode === 'grid' ? (
                <ShowCard 
                   key={show.id} 
                   show={show} 
                   isEnrolled={isEnrolled(show.id)} 
                   onToggle={() => handleOpenEnrollModal(show.id)}
                   isLoading={loadingShowId === show.id}
                />
              ) : (
                <div key={show.id} className="airbnb-card bg-white dark:bg-zinc-900 p-4 border border-zinc-100 dark:border-zinc-800 flex items-center gap-6 group">
                  <div className="w-24 h-32 bg-[#f5f5f7] dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {show.image ? (
                      <img src={show.image} alt={show.title} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 -z-10 transition-colors">
                      <Ticket size={40} strokeWidth={1} className="text-zinc-300 dark:text-zinc-600" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{show.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest glass text-foreground border border-zinc-200 dark:border-zinc-700">
                        {show.site}
                      </span>
                    </div>
                    <p className="text-[#ff385c] font-semibold">{show.price}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 font-medium">
                      <span className="flex items-center gap-1"><Search size={14} className="opacity-50" /> {show.city}</span>
                      {show.performances && show.performances[0] && (
                        <span>Next: {show.performances[0].date}</span>
                      )}
                    </div>
                    {isEnrolled(show.id) && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-[#ff385c] uppercase tracking-wider">
                        <Bell size={12} fill="currentColor" />
                        Auto-enrollment active
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleOpenEnrollModal(show.id)}
                      disabled={loadingShowId === show.id}
                      className={`p-3 rounded-full border transition-all ${isEnrolled(show.id) ? 'bg-[#ff385c]/10 border-[#ff385c]/20 text-[#ff385c]' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-400'}`}
                    >
                      {loadingShowId === show.id ? <Loader2 size={20} className="animate-spin" /> : (isEnrolled(show.id) ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />)}
                    </button>
                    
                    <button 
                      className={`apple-button ${isEnrolled(show.id) ? 'bg-[#f5f5f7] dark:bg-zinc-800 text-zinc-500' : 'apple-button-primary'} px-8 py-2.5 text-sm min-w-[140px]`}
                      onClick={() => {
                        window.open(show.link, '_blank');
                      }}
                    >
                      {isEnrolled(show.id) ? 'Enrolled' : 'Enter Now'}
                    </button>
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <Search size={64} strokeWidth={1} className="opacity-20" />
              <p className="text-lg font-medium">No shows match your search.</p>
              <button 
                onClick={() => {setSearchQuery(''); setActiveTab('All');}}
                className="text-[#ff385c] font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
        
        {/* Decorative background element for Airbnb feel */}
        <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#ff385c]/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
        <div className="fixed top-[20%] left-[40%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
      </main>

      {/* Enrollment Configuration Modal */}
      {enrollModalShowId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <h2 className="text-xl font-black italic tracking-tight mb-2">Configure Enrollment</h2>
            <p className="text-sm text-zinc-500 mb-6">Select which profiles should be auto-entered into this lottery.</p>
            
            <div className="flex flex-col gap-3 mb-8">
              {profiles.map(p => (
                <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-[#ff385c]"
                    checked={modalSelectedProfiles.includes(p.id)}
                    onChange={(e) => {
                       if (e.target.checked) setModalSelectedProfiles([...modalSelectedProfiles, p.id]);
                       else setModalSelectedProfiles(modalSelectedProfiles.filter(id => id !== p.id));
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight">{p.firstName} {p.lastName}</span>
                    <span className="text-xs text-zinc-500">{p.email}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setEnrollModalShowId(null)} 
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => saveEnrollment(enrollModalShowId, modalSelectedProfiles, modalSelectedProfiles.length > 0)} 
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-[#ff385c] hover:bg-[#e03150] text-white transition-colors text-sm"
                disabled={modalSelectedProfiles.length === 0 && !isEnrolled(enrollModalShowId)}
              >
                {modalSelectedProfiles.length === 0 ? (isEnrolled(enrollModalShowId) ? 'Un-enroll' : 'Select Profile') : 'Save & Enroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
