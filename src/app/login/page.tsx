'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      setError('Invalid username or password');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black font-sans text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#ff385c] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#ff385c]/20 mb-6">
          <Ticket size={32} />
        </div>
        <h1 className="text-2xl font-black italic tracking-tight mb-2">BwayLot</h1>
        <p className="text-zinc-500 text-sm mb-8">Sign in to manage your enrollments</p>
        
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Username</label>
            <input 
              name="username" 
              className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none w-full" 
              required 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
            <input 
              name="password" 
              type="password"
              className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none w-full" 
              required 
            />
          </div>
          
          {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}
          
          <button 
            type="submit" 
            className="w-full mt-4 py-3 px-4 rounded-xl font-bold bg-[#ff385c] hover:bg-[#e03150] text-white transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
