'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Globe, ExternalLink } from 'lucide-react';

export default function Browse() {
  const sites = [
    { name: 'BroadwayDirect', url: 'https://lottery.broadwaydirect.com/', description: 'The official source for Disney and Nederlander lotteries.' },
    { name: 'LuckySeat', url: 'https://www.luckyseat.com/', description: 'Premium lotteries for major Broadway and touring shows.' },
    { name: 'Telecharge', url: 'https://rush.telecharge.com/', description: 'Direct access to Shubert Organization show lotteries and rush.' },
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-black font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <header className="mb-12">
          <h1 className="text-3xl font-black tracking-tight italic">Browse Sites</h1>
          <p className="text-zinc-500 text-sm mt-1">Explore the official lottery platforms directly.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sites.map(site => (
            <div key={site.name} className="airbnb-card bg-white dark:bg-zinc-900 p-8 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                 <Globe size={32} className="text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{site.name}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{site.description}</p>
              </div>
              <button 
                onClick={() => window.open(site.url, '_blank')}
                className="mt-auto apple-button apple-button-primary flex items-center justify-center gap-2"
              >
                <span>Visit Site</span>
                <ExternalLink size={16} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
