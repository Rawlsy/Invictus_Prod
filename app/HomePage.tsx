'use client';

import React, { useState } from 'react';
import { signOut, updateProfile, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Receive 'user' as a prop
export default function HomePage({ user }: { user: User }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'MY_LEAGUES' | 'ACCOUNT'>('MY_LEAGUES');

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-700 mr-8">Invictus</span>
              <div className="hidden sm:flex space-x-8">
                <NavTab label="My Leagues" isActive={activeTab === 'MY_LEAGUES'} onClick={() => setActiveTab('MY_LEAGUES')} />
                <NavTab label="Account" isActive={activeTab === 'ACCOUNT'} onClick={() => setActiveTab('ACCOUNT')} />
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-800">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'MY_LEAGUES' && <MyLeaguesTab user={user} />}
        {activeTab === 'ACCOUNT' && <AccountTab user={user} />}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS (Tabs, Wizard, etc.) ---

const NavTab = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
      isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

const AccountTab = ({ user }: { user: User }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user.displayName || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkAvailabilityAndSave = async () => {
    setError('');
    setIsLoading(true);
    const cleanUsername = newUsername.trim();

    if (!cleanUsername) {
      setError("Username cannot be empty.");
      setIsLoading(false);
      return;
    }
    if (cleanUsername === user.displayName) {
      setIsEditing(false);
      setIsLoading(false);
      return;
    }

    try {
        const q = query(collection(db, "users"), where("username", "==", cleanUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setError("This username is already taken.");
            setIsLoading(false);
            return;
        }

        await updateProfile(user, { displayName: cleanUsername });
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { username: cleanUsername });

        setIsEditing(false);
        alert("Username updated successfully!");
    } catch (err) {
        console.error(err);
        setError("Failed to update username.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">Account Details</h2>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            {!isEditing && <button onClick={() => setIsEditing(true)} className="text-xs text-blue-600 hover:underline font-semibold">Edit</button>}
          </div>
          {isEditing ? (
            <div className="flex gap-2">
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="block w-full px-3 py-2 border rounded-md" />
                <button onClick={checkAvailabilityAndSave} disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">{isLoading ? '...' : 'Save'}</button>
                <button onClick={() => setIsEditing(false)} disabled={isLoading} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200 text-sm">Cancel</button>
            </div>
          ) : (
            <div className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-600 font-medium">{user.displayName}</div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-600 opacity-80">{user.email}</div>
        </div>
      </div>
    </div>
  );
};

const MyLeaguesTab = ({ user }: { user: User }) => {
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return <CreateLeagueWizard user={user} onCancel={() => setIsCreating(false)} onComplete={() => setIsCreating(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Leagues</h2>
        <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-bold shadow">+ New League</button>
      </div>
      <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <p className="mt-2 text-lg text-gray-500">You haven't joined any leagues yet.</p>
        <p className="text-sm text-gray-400">Create a new one to get started!</p>
      </div>
    </div>
  );
};

const CreateLeagueWizard = ({ user, onCancel, onComplete }: { user: User, onCancel: () => void, onComplete: () => void }) => {
  const [step, setStep] = useState<'SELECT' | 'REVIEW'>('SELECT');
  const [isSaving, setIsSaving] = useState(false);

  const standardSettings = {
    positions: { qb: 1, rb: 2, wr: 2, te: 1, flex: 2, dst: 1, k: 1 },
    elimination: 'Off',
    maxLeagueSize: 'None',
    scoringFormat: 'PPR',
    restartablePlayers: 'Off',
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
        await addDoc(collection(db, "leagues"), {
            ...standardSettings,
            commissionerId: user.uid,
            commissionerName: user.displayName,
            createdAt: new Date(),
            status: "DRAFT"
        });
        alert("League Created Successfully!");
        onComplete();
    } catch (e) {
        console.error(e);
        alert("Error creating league.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 mr-4">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Create New League</h1>
      </div>
      {step === 'SELECT' ? (
        <div className="bg-white shadow rounded-lg p-8 grid gap-6 md:grid-cols-2">
            <button onClick={() => setStep('REVIEW')} className="flex flex-col items-center justify-center p-8 border-2 border-blue-100 bg-blue-50 rounded-xl hover:border-blue-500 transition-all">
              <span className="text-xl font-bold text-blue-700">Standard</span>
              <span className="text-sm text-gray-600 mt-2">Recommended defaults.</span>
            </button>
            <button disabled className="flex flex-col items-center justify-center p-8 border-2 border-gray-100 bg-gray-50 rounded-xl opacity-60">
              <span className="text-xl font-bold text-gray-400">Custom</span>
              <span className="text-sm text-gray-400 mt-2">Coming Soon</span>
            </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
           <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between">
            <h2 className="text-xl font-bold text-gray-800">Review Settings</h2>
            <button onClick={() => setStep('SELECT')} className="text-sm text-blue-600 underline">Change Config</button>
          </div>
          <div className="p-6">
             <div className="grid grid-cols-2 gap-4 mb-6">
                 {Object.entries(standardSettings.positions).map(([pos, count]) => (
                     <div key={pos} className="flex justify-between bg-gray-50 p-2 rounded border border-gray-100">
                         <span className="uppercase text-xs font-bold text-gray-500">{pos}</span>
                         <span className="font-bold">{count}</span>
                     </div>
                 ))}
             </div>
             <button onClick={handleCreate} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg disabled:opacity-50">
                {isSaving ? "Creating..." : "Create League"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};