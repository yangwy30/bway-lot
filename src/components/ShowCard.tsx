'use client';

import React from 'react';
import { Show } from '@/lib/show-data';
import { Calendar, MapPin, ExternalLink, Ticket, Bell, BellOff, Loader2 } from 'lucide-react';

interface ShowCardProps {
  show: Show;
  isEnrolled: boolean;
  onToggle: (e: React.MouseEvent) => void;
  isLoading?: boolean;
}

export const ShowCard: React.FC<ShowCardProps> = ({ show, isEnrolled, onToggle, isLoading }) => {
  const handleEnterNow = async () => {
    // If not enrolled, enroll them automatically (default behavior)
    if (!isEnrolled) {
        onToggle({ stopPropagation: () => {} } as any);
    }
    window.open(show.link, '_blank');
  };
  return (
    <div className="airbnb-card bg-white dark:bg-zinc-900 overflow-hidden flex flex-col h-full border border-zinc-100 dark:border-zinc-800 group">
      <div className="relative aspect-[2/3] w-full bg-[#f5f5f7] dark:bg-zinc-800 overflow-hidden">
        {show.image ? (
          <img 
            src={show.image} 
            alt={show.title} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Fallback Placeholder (Always visible behind the image) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 -z-10 group-hover:from-zinc-100 group-hover:to-zinc-300 dark:group-hover:from-zinc-800 dark:group-hover:to-zinc-700 transition-all duration-500">
          <div className="w-16 h-16 bg-white/50 dark:bg-white/5 rounded-2xl flex items-center justify-center shadow-inner mb-3">
             <Ticket size={32} strokeWidth={1.5} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">{show.title.substring(0, 20)}</span>
        </div>

        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest glass text-foreground shadow-sm">
          {show.site}
        </div>

        <button 
          onClick={onToggle}
          disabled={isLoading}
          className={`absolute top-4 right-4 p-2 rounded-full glass transition-all duration-300 shadow-sm ${isEnrolled ? 'text-[#ff385c] bg-white' : 'text-zinc-400'}`}
          title={isEnrolled ? "Auto-enrollment active" : "Enable auto-enrollment"}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : (isEnrolled ? <Bell size={16} fill="currentColor" /> : <BellOff size={16} />)}
        </button>
      </div>
      
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="text-lg font-bold leading-tight line-clamp-2">{show.title}</h3>
        
        <div className="flex flex-col gap-1.5 mt-auto">
          {show.city && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
              <MapPin size={14} />
              <span>{show.city}</span>
            </div>
          )}
          
          {show.price && (
            <div className="text-[#ff385c] font-semibold text-base">
              {show.price}
            </div>
          )}

          {show.performances && show.performances.length > 0 && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <Calendar size={14} />
              <span className="truncate">{show.performances[0].date}</span>
            </div>
          )}
        </div>
        
        <button 
          className="mt-4 apple-button apple-button-primary text-sm flex items-center justify-center gap-2 w-full group/btn"
          onClick={handleEnterNow}
        >
          <span>{isEnrolled ? 'Already Enrolled' : 'Enter Now'}</span>
          <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
