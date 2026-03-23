'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { User, Mail, Phone, MapPin, Plus, Trash2, Edit2, ShieldCheck } from 'lucide-react';

import { Profile } from '@/lib/automation/types';

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        setProfiles(data);
        setIsLoading(false);
      });
  }, []);
  const [editingProfile, setEditingProfile] = useState<Partial<Profile> | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const handleSaveProfile = async (profileData: any) => {
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      
      if (res.ok) {
        const saved = await res.json();
        if (profileData.id && profileData.id !== 'new') {
          setProfiles(profiles.map(p => p.id === saved.id ? saved : p));
        } else {
          setProfiles([...profiles, saved]);
        }
        setEditingProfile(null);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const handleDeleteProfile = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log(`[UI] Attempting to delete profile: ${id}`);
    
    try {
      const res = await fetch(`/api/profiles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        console.log(`[UI] Successfully deleted profile: ${id}`);
        setProfiles(prev => prev.filter(p => p.id !== id));
        setProfileToDelete(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error(`[UI] Failed to delete profile: ${res.status}`, errData);
        alert(`Failed to delete: ${errData.message || res.statusText}`);
      }
    } catch (err) {
      console.error('[UI] Error in handleDeleteProfile:', err);
    }
  };

  const openAddModal = () => {
    setEditingProfile({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      zipCode: '',
      dob: { day: '', month: '', year: '' }
    });
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-black font-sans text-foreground">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 lg:p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight italic">Profiles</h1>
            <p className="text-zinc-500 text-sm">Manage entries for your family and friends.</p>
          </div>
          
          <button 
            onClick={openAddModal}
            className="apple-button apple-button-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} />
            <span>Add New Profile</span>
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <div 
              key={profile.id} 
              onClick={() => setEditingProfile(profile)}
              className="airbnb-card bg-white dark:bg-zinc-900 p-6 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4 cursor-pointer hover:border-[#ff385c]/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#ff385c]/10 flex items-center justify-center text-[#ff385c]">
                  <User size={28} />
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingProfile(profile); }} 
                    className="p-2 text-zinc-400 hover:text-foreground transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setProfileToDelete(profile.id); }}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h3>
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold uppercase tracking-tight mt-1">
                  <ShieldCheck size={12} />
                  <span>Verified for Auto-Entry</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2 border-t border-zinc-50 dark:border-zinc-800 pt-4">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <Mail size={16} className="text-zinc-300" />
                  <span className="truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <Phone size={16} className="text-zinc-300" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <MapPin size={16} className="text-zinc-300" />
                  <span>{profile.city || 'NY'}, {profile.state || 'NY'} {profile.zipCode}</span>
                </div>
                {profile.dob && (
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono mt-1">
                    <span>BIRTHDAY: {profile.dob.year}/{profile.dob.month}/{profile.dob.day}</span>
                  </div>
                )}
                {profile.telechargePassword && (
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold uppercase tracking-tight mt-2">
                    <ShieldCheck size={10} />
                    <span>Telecharge Configured</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Add Placeholder Card */}
          <button 
            onClick={openAddModal}
            className="rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-3 p-12 text-zinc-400 hover:border-[#ff385c]/30 hover:bg-[#ff385c]/5 hover:text-[#ff385c] transition-all group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="font-bold text-sm">Add another person</span>
          </button>
        </section>
      </main>

      {/* Profile Edit/Add Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <h2 className="text-2xl font-black italic tracking-tight mb-6">{editingProfile.id ? 'Edit Profile' : 'Add New Profile'}</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updated = {
                ...editingProfile,
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                zipCode: formData.get('zipCode') as string,
                dob: {
                  month: formData.get('dobMonth') as string,
                  day: formData.get('dobDay') as string,
                  year: formData.get('dobYear') as string,
                },
                telechargeEmail: formData.get('telechargeEmail') as string,
                telechargePassword: formData.get('telechargePassword') as string,
              };
              handleSaveProfile(updated);
            }} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">First Name</label>
                  <input name="firstName" defaultValue={editingProfile.firstName} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Last Name</label>
                  <input name="lastName" defaultValue={editingProfile.lastName} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                <input type="email" name="email" defaultValue={editingProfile.email} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Phone</label>
                  <input name="phone" defaultValue={editingProfile.phone} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Zip Code</label>
                  <input name="zipCode" defaultValue={editingProfile.zipCode} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Date of Birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <input name="dobMonth" placeholder="MM" maxLength={2} defaultValue={editingProfile.dob?.month} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none text-center" />
                  <input name="dobDay" placeholder="DD" maxLength={2} defaultValue={editingProfile.dob?.day} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none text-center" />
                  <input name="dobYear" placeholder="YYYY" maxLength={4} defaultValue={editingProfile.dob?.year} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none text-center" />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#ff385c]">Telecharge Logic (SocialToaster)</h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Telecharge Email (Optional, uses profile email if empty)</label>
                  <input type="email" name="telechargeEmail" placeholder="If different from profile email" defaultValue={editingProfile.telechargeEmail} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Telecharge Password</label>
                  <input type="password" name="telechargePassword" placeholder="SocialToaster password" defaultValue={editingProfile.telechargePassword} className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#ff385c] outline-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setEditingProfile(null)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 rounded-xl font-bold bg-[#ff385c] hover:bg-[#e03150] text-white transition-colors">
                  {editingProfile.id ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-black italic tracking-tight mb-2">Delete Profile?</h2>
            <p className="text-zinc-500 text-sm mb-8">This action cannot be undone. All entry data associated with this profile will be preserved in logs but the profile itself will be removed.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setProfileToDelete(null)} 
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteProfile(profileToDelete)} 
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
