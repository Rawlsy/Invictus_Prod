'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Home, LayoutDashboard, LogOut, Settings, User, LogIn, Shield } from 'lucide-react';

const COMMISSIONER_EMAIL = 'erawlsy@gmail.com';

export default function Navbar() {
  const [username, setUsername] = useState<string>('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check for Commissioner Access
        if (currentUser.email === COMMISSIONER_EMAIL) {
            setIsCommissioner(true);
        } else {
            setIsCommissioner(false);
        }

        if (currentUser.displayName) {
          setUsername(currentUser.displayName);
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUsername(data?.username || data?.name || '');
            }
          } catch (e) {
            console.error("Error fetching user details", e);
          }
        }
      } else {
        setUser(null);
        setIsCommissioner(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Loading state prevents hydration mismatches
  if (loading) {
    return <div className="h-20 bg-gray-900 border-b border-gray-800" />;
  }

  const isSettingsActive = pathname === '/settings';

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 px-4 md:px-6 shadow-2xl w-full overflow-hidden">
      {/* Top Green Accent Line */}
      <div className="h-[2px] w-full bg-green-500/50 absolute top-0 left-0" />

      <div className="max-w-7xl mx-auto flex justify-between items-center h-16 md:h-20">
        
        {/* LEFT: Navigation Links */}
        <nav className="flex items-center space-x-4 md:space-x-8 flex-1">
          <Link 
            href="/" 
            className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${
              pathname === '/' ? 'text-green-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Home 
              size={18} 
              className={`md:w-3.5 md:h-3.5 ${pathname === '/' ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} 
            /> 
            <span className="hidden md:inline">Home</span>
          </Link>
          
          <Link 
            href="/hub" 
            className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${
              pathname === '/hub' ? 'text-green-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            <LayoutDashboard 
              size={18} 
              className={`md:w-3.5 md:h-3.5 ${pathname === '/hub' ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} 
            /> 
            <span className="hidden md:inline">Hub</span>
          </Link>
        </nav>

        {/* CENTER: The Logo */}
        <div className="flex-shrink-0 px-2 transition-transform duration-300 hover:scale-105">
          <Link href="/" className="group">
            <svg 
              viewBox="0 0 320 80" 
              className="h-8 md:h-12 w-auto drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Main Green V */}
              <path 
                d="M15 20 L40 70 L70 10" 
                stroke="#22c55e" 
                strokeWidth="10" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              
              {/* Arrow Head - Rotated -5 degrees counter-clockwise around the tip (70,10) */}
              <path 
                d="M52 17 L70 10 L70 28" 
                stroke="#22c55e" 
                strokeWidth="10" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                transform="rotate(-5 70 10)"
              />

              {/* Inner White Accent */}
              <path 
                d="M28 20 L40 50 L55 20" 
                stroke="white" 
                strokeWidth="3" 
                fill="none" 
                className="opacity-30" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              
              <text x="85" y="48" fill="white" style={{ font: 'italic 900 42px sans-serif', letterSpacing: '-1px' }}>INVICTUS</text>
              <text x="85" y="68" fill="#22c55e" style={{ font: 'bold 12px sans-serif', letterSpacing: '8px' }}>SPORTS</text>
            </svg>
          </Link>
        </div>

        {/* RIGHT: Auth State */}
        <div className="flex items-center justify-end space-x-2 md:space-x-6 flex-1">
          
          {user ? (
            <>
              {/* COMMISSIONER SHIELD (Hidden for others) */}
              {isCommissioner && (
                <Link 
                    href="/commissioner" 
                    title="Commissioner Console"
                    className="flex items-center justify-center p-2 text-orange-500 bg-orange-500/10 rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_10px_rgba(249,115,22,0.2)] animate-in fade-in zoom-in duration-300"
                >
                    <Shield size={16} />
                </Link>
              )}

              {/* LOGGED IN: User Details & Sign Out */}
              
              {/* Desktop User Info */}
              <Link href="/settings" className="text-right hidden md:block border-r border-gray-800 pr-6 group cursor-pointer">
                  <div className="flex items-center justify-end gap-2 mb-1">
                      <p className={`text-[8px] uppercase font-black tracking-[0.1em] leading-none transition-colors ${isSettingsActive ? 'text-green-500' : 'text-gray-600 group-hover:text-green-500'}`}>Authenticated As</p>
                      <Settings size={10} className={`transition-colors ${isSettingsActive ? 'text-green-500' : 'text-gray-600 group-hover:text-green-500'}`} />
                  </div>
                  <p className={`text-xs font-black uppercase tracking-tighter truncate max-w-[150px] underline-offset-4 ${isSettingsActive ? 'text-green-400 underline decoration-green-500' : 'text-white group-hover:underline decoration-green-500'}`}>
                    {username || user.email?.split('@')[0]}
                  </p>
              </Link>

              {/* Mobile User Icon */}
              <Link href="/settings" className={`md:hidden p-2 ${isSettingsActive ? 'text-green-500' : 'text-gray-500 hover:text-white'}`}>
                  <User size={18} />
              </Link>
              
              <button 
                  onClick={() => signOut(auth).then(() => router.push('/login'))}
                  className="group flex items-center justify-center space-x-0 md:space-x-2 p-2 md:px-5 md:py-2.5 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 shadow-lg"
              >
                  <LogOut size={16} className="md:w-3.5 md:h-3.5 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden md:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              {/* LOGGED OUT: Sign In Button */}
              <Link 
                  href="/login"
                  className="group flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#22c55e] text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#16a34a] hover:scale-105 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                  <LogIn size={16} className="w-3.5 h-3.5" />
                  <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}