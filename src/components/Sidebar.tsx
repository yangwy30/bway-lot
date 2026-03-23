'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  Globe, 
  Search,
  Ticket,
  Bell,
  ClipboardList,
  LogOut
} from 'lucide-react';


export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Globe, label: 'Browse Sites', href: '/browse' },
    { icon: ClipboardList, label: 'Entry Records', href: '/entries' },
    { icon: User, label: 'Profiles', href: '/profiles' },
    { icon: Settings, label: 'Automation', href: '/automation' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#f5f5f7] dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-6 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-[#ff385c] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#ff385c]/20">
            <Ticket size={24} fill="currentColor" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">BwayLot</span>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive 
                  ? 'bg-white dark:bg-zinc-900 shadow-sm text-foreground' 
                  : 'text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
               <User size={24} className="text-zinc-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Yang</span>
              <span className="text-[10px] text-zinc-500">Premium Plan</span>
            </div>
          </div>
          <button 
            onClick={async () => {
              const res = await fetch('/api/test-notification', { method: 'POST' });
              if (res.ok) alert('Test notification sent!');
              else alert('Failed to send test notification.');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#f5f5f7] dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Bell size={14} />
            Notify Me
          </button>
        </div>
        <button 
          onClick={async () => {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) window.location.href = '/login';
          }}
          className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-red-500 transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
