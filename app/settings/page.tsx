'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { Save, Lock, Mail, User, AlertCircle, Check, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility States
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI States
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', msg: string }>({ type: '', msg: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser) {
            router.push('/login');
        } else {
            setUser(currentUser);
            setDisplayName(currentUser.displayName || '');
            setEmail(currentUser.email || '');
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus({ type: '', msg: '' }), 4000);
  };

  // 1. UPDATE PROFILE (Username)
  const handleUpdateProfile = async () => {
    if (!user || !displayName.trim()) return;
    setIsSaving(true);
    try {
        await updateProfile(user, { displayName: displayName });
        
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 
            username: displayName,
            name: displayName 
        }).catch((e) => console.log("Firestore sync skipped or failed", e));

        showStatus('success', 'Profile updated successfully.');
        router.refresh(); 
    } catch (error: any) {
        showStatus('error', error.message);
    } finally {
        setIsSaving(false);
    }
  };

  // 2. UPDATE EMAIL
  const handleUpdateEmail = async () => {
    if (!user || !email.trim() || email === user.email) return;
    setIsSaving(true);
    try {
        await updateEmail(user, email);
        showStatus('success', 'Email updated. Please verify your new address.');
    } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
            showStatus('error', 'For security, please Sign Out and log in again to change email.');
        } else {
            showStatus('error', error.message);
        }
    } finally {
        setIsSaving(false);
    }
  };

  // 3. UPDATE PASSWORD
  const handleUpdatePassword = async () => {
    if (!user || !newPassword) return;
    if (newPassword !== confirmPassword) {
        showStatus('error', "Passwords do not match.");
        return;
    }
    setIsSaving(true);
    try {
        await updatePassword(user, newPassword);
        setNewPassword('');
        setConfirmPassword('');
        showStatus('success', 'Password changed successfully.');
    } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
            showStatus('error', 'For security, please Sign Out and log in again to change password.');
        } else {
            showStatus('error', error.message);
        }
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-8">
            Account <span className="text-green-500">Settings</span>
        </h1>

        {status.msg && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-bold uppercase tracking-wide text-xs md:text-sm animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/50' : 'bg-red-500/10 text-red-500 border border-red-500/50'}`}>
                {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                {status.msg}
            </div>
        )}

        <div className="space-y-6">
            
            {/* PROFILE CARD */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-6 text-green-500 border-b border-gray-800 pb-2">
                    <User size={20} />
                    <h2 className="text-sm font-black uppercase tracking-widest">Public Profile</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Display Name</label>
                        <input 
                            type="text" 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-green-500 outline-none font-bold transition-colors"
                            placeholder="Your Name"
                        />
                    </div>
                    <button 
                        onClick={handleUpdateProfile} 
                        disabled={isSaving}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save Profile
                    </button>
                </div>
            </div>

            {/* EMAIL CARD */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-6 text-green-500 border-b border-gray-800 pb-2">
                    <Mail size={20} />
                    <h2 className="text-sm font-black uppercase tracking-widest">Email Address</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-green-500 outline-none font-bold transition-colors"
                        />
                    </div>
                    <button 
                        onClick={handleUpdateEmail} 
                        disabled={isSaving}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                         {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Update Email
                    </button>
                </div>
            </div>

            {/* SECURITY CARD */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-6 text-green-500 border-b border-gray-800 pb-2">
                    <Lock size={20} />
                    <h2 className="text-sm font-black uppercase tracking-widest">Security</h2>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* New Password Field */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">New Password</label>
                            <div className="relative">
                                <input 
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-green-500 outline-none font-bold transition-colors pr-10"
                                    placeholder="New Password"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-green-500 outline-none font-bold transition-colors pr-10"
                                    placeholder="Confirm New Password"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleUpdatePassword} 
                        disabled={isSaving}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                         {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Change Password
                    </button>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}