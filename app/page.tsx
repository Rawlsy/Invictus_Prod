'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  signOut, 
  updateProfile, 
  updateEmail, 
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase'; 

// --- 1. CREATE LEAGUE MODAL (Now supports Privacy Settings) ---
interface CreateLeagueModalProps {
  onClose: () => void;
  user: User;
}

const CreateLeagueModal = ({ onClose, user }: CreateLeagueModalProps) => {
  const router = useRouter();
  const [leagueType, setLeagueType] = useState<'standard' | 'custom' | null>(null);
  const [leagueName, setLeagueName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleContinue = async () => {
    if (!leagueType || !leagueName.trim()) return;
    if (isPrivate && !password.trim()) return; // Enforce password if private

    setIsCreating(true);

    try {
      const docRef = await addDoc(collection(db, "leagues"), {
        name: leagueName,
        type: leagueType,
        ownerId: user.uid,
        privacy: isPrivate ? 'private' : 'public',
        password: isPrivate ? password : null, // Only save password if private
        createdAt: serverTimestamp(),
        members: [user.uid], 
        settings: leagueType === 'standard' ? { ppr: true, teams: 10 } : {},
      });

      router.push(`/league/${docRef.id}`);
    } catch (error) {
      console.error("Error creating league: ", error);
      alert("Failed to create league.");
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Create a New League</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <div className="p-8">
          
          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">League Name</label>
            <input 
              type="text" 
              placeholder="e.g. The Sunday Showdown"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Privacy Settings */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center space-x-3 cursor-pointer mb-2">
              <input 
                type="checkbox" 
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-bold text-gray-700">Make this league Private?</span>
            </label>
            <p className="text-sm text-gray-500 ml-8 mb-3">
              Private leagues require a password to join and won't appear in the public list.
            </p>
            
            {isPrivate && (
              <div className="ml-8 animate-fadeIn">
                <input 
                  type="text" 
                  placeholder="Set a League Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                />
              </div>
            )}
          </div>

          <h4 className="text-gray-600 mb-4 font-medium">Select Format:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => setLeagueType('standard')}
              className={`cursor-pointer border-2 rounded-xl p-6 transition-all hover:shadow-md ${leagueType === 'standard' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600 text-xl">⚡</div>
              <h5 className="font-bold text-gray-900 mb-1">Standard</h5>
              <p className="text-xs text-gray-500">Default settings. Quick setup.</p>
            </div>
            <div 
              onClick={() => setLeagueType('custom')}
              className={`cursor-pointer border-2 rounded-xl p-6 transition-all hover:shadow-md ${leagueType === 'custom' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-gray-200 hover:border-purple-300'}`}
            >
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mb-3 text-purple-600 text-xl">⚙️</div>
              <h5 className="font-bold text-gray-900 mb-1">Custom</h5>
              <p className="text-xs text-gray-500">Full control over rules.</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">Cancel</button>
          <button 
            onClick={handleContinue}
            disabled={!leagueType || !leagueName.trim() || isCreating || (isPrivate && !password)}
            className={`px-6 py-2 rounded-lg font-bold text-white transition shadow-sm ${
              (leagueType && leagueName.trim() && !isCreating && (!isPrivate || password))
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create League'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. JOIN LEAGUE TAB (New Component) ---
const JoinLeague = ({ user }: { user: User }) => {
  const router = useRouter();
  const [publicLeagues, setPublicLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicLeagues = async () => {
      try {
        // Find leagues where privacy is 'public'
        const q = query(collection(db, "leagues"), where("privacy", "==", "public"));
        const querySnapshot = await getDocs(q);
        
        // Map data and Filter out leagues I am already in
        const leaguesData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((l: any) => !l.members.includes(user.uid)); // Client-side filter for "already joined"

        setPublicLeagues(leaguesData);
      } catch (error) {
        console.error("Error fetching public leagues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicLeagues();
  }, [user.uid]);

  const handleJoin = async (leagueId: string) => {
    setJoiningId(leagueId);
    try {
      const leagueRef = doc(db, "leagues", leagueId);
      // Atomic update: Add user ID to members array
      await updateDoc(leagueRef, {
        members: arrayUnion(user.uid)
      });
      // Redirect to the league
      router.push(`/league/${leagueId}`);
    } catch (error) {
      console.error("Error joining league:", error);
      alert("Failed to join. Please try again.");
      setJoiningId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Join a League</h2>
      
      {loading ? (
        <div className="text-center py-12">Finding open leagues...</div>
      ) : publicLeagues.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium mb-1">No public leagues found.</p>
          <p className="text-sm text-gray-400">Everyone seems to be playing in private!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publicLeagues.map((league) => (
            <div key={league.id} className="border border-gray-200 rounded-lg p-5 flex justify-between items-center hover:shadow-md transition">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{league.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                    league.type === 'standard' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {league.type}
                  </span>
                  <span className="text-xs text-gray-500">{league.members?.length} Members</span>
                </div>
              </div>
              <button 
                onClick={() => handleJoin(league.id)}
                disabled={joiningId === league.id}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
              >
                {joiningId === league.id ? 'Joining...' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 3. MY LEAGUES TAB ---
const MyLeagues = ({ user }: { user: User }) => {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const q = query(
          collection(db, "leagues"), 
          where("members", "array-contains", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const leaguesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeagues(leaguesData);
      } catch (error) {
        console.error("Error fetching leagues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [user.uid]);

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Leagues</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center shadow-sm"
          >
            <span className="mr-1 text-lg leading-none">+</span> Create League
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">Loading leagues...</div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-gray-500 font-medium mb-1">You aren't in any leagues yet.</p>
            <p className="text-sm text-gray-400">Join a league or create your own to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map((league) => (
              <div 
                key={league.id}
                onClick={() => router.push(`/league/${league.id}`)}
                className="cursor-pointer border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition bg-white group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition truncate pr-2">
                    {league.name}
                  </h3>
                  {league.privacy === 'private' && (
                     <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded border border-gray-200" title="Private League">🔒</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                   <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                    league.type === 'standard' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {league.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {league.members?.length || 1} Members
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && <CreateLeagueModal user={user} onClose={() => setShowCreateModal(false)} />}
    </>
  );
};

// --- 4. ACCOUNT SETTINGS TAB ---
const AccountSettings = ({ user }: { user: User }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.displayName || '');
  const [newEmail, setNewEmail] = useState(user.email || '');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', msg: string }>({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    setIsEditing(false);
    setNewName(user.displayName || '');
    setNewEmail(user.email || '');
    setStatus({ type: '', msg: '' });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const promises = [];
      if (newName !== user.displayName) promises.push(updateProfile(user, { displayName: newName }));
      if (newEmail !== user.email) promises.push(updateEmail(user, newEmail));

      if (promises.length > 0) {
        await Promise.all(promises);
        setStatus({ type: 'success', msg: 'Profile updated successfully!' });
        setIsEditing(false);
        window.location.reload(); 
      } else {
        setIsEditing(false);
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setStatus({ type: 'error', msg: 'Security: Please sign out and back in to change sensitive info.' });
      } else {
        setStatus({ type: 'error', msg: 'Failed to update. ' + error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      await sendPasswordResetEmail(auth, user.email);
      setStatus({ type: 'success', msg: `Password reset link sent to ${user.email}.` });
    } catch (error: any) {
      setStatus({ type: 'error', msg: 'Failed to send reset email. ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded border border-blue-200 text-sm font-medium transition">Edit Profile</button>
        )}
      </div>
      {status.msg && (
        <div className={`mb-6 p-4 rounded-md border ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{status.msg}</div>
      )}
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            {isEditing ? (
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-2 bg-white border border-blue-300 rounded outline-none text-gray-800" />
            ) : (
              <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-gray-600">{user.displayName || 'No Name Set'}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            {isEditing ? (
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full p-2 bg-white border border-blue-300 rounded outline-none text-gray-800" />
            ) : (
              <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-gray-600">{user.email}</div>
            )}
          </div>
        </div>
        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button onClick={handleCancel} disabled={loading} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium">Cancel</button>
            <button onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}
      </div>
      {!isEditing && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Password</p>
              <p className="text-xs text-gray-500 mt-1">Secure your account by updating your password regularly.</p>
            </div>
            <button onClick={handlePasswordReset} disabled={loading} className="px-4 py-2 bg-white border border-gray-300 shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition">Send Reset Email</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 5. MAIN PAGE WRAPPER ---
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leagues' | 'join' | 'account'>('leagues');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
       <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <span className="text-xl font-bold text-blue-900 tracking-tight">INVICTUS</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 hidden md:block">Hello, {user.displayName || user.email?.split('@')[0]}</span>
                <button onClick={handleSignOut} className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 px-4 py-2 rounded-full transition">Sign Out</button>
              </div>
            </div>
          </div>
       </header>

       <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* TAB NAVIGATION */}
          <div className="flex border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('leagues')} className={`pb-4 px-6 text-sm font-medium transition-all relative ${activeTab === 'leagues' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              My Leagues {activeTab === 'leagues' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
            </button>
            <button onClick={() => setActiveTab('join')} className={`pb-4 px-6 text-sm font-medium transition-all relative ${activeTab === 'join' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Join a League {activeTab === 'join' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
            </button>
            <button onClick={() => setActiveTab('account')} className={`pb-4 px-6 text-sm font-medium transition-all relative ${activeTab === 'account' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Account {activeTab === 'account' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
            </button>
          </div>

          <div className="animate-fadeIn">
            {activeTab === 'leagues' && <MyLeagues user={user} />}
            {activeTab === 'join' && <JoinLeague user={user} />}
            {activeTab === 'account' && <AccountSettings user={user} />}
          </div>
       </main>
    </div>
  );
}