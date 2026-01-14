'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase'; 

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status Messages
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (isRegistering) {
        // --- REGISTER FLOW ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const defaultUsername = email.split('@')[0];

        await updateProfile(user, { displayName: defaultUsername });
        await setDoc(doc(db, "users", user.uid), {
          username: defaultUsername,
          email: email,
          createdAt: new Date()
        });

      } else {
        // --- LOGIN FLOW ---
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      router.push('/');
      
    } catch (err: any) {
      const message = err.message.replace("Firebase: ", "").replace("auth/", "");
      setError(message.replace(/-/g, " "));
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError("Please enter your email address above to reset your password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      const message = err.message.replace("Firebase: ", "").replace("auth/", "");
      setError(message.replace(/-/g, " "));
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className={`bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 transition-all duration-300 ${isRegistering ? 'border-purple-600' : 'border-blue-600'}`}>
        
        <h1 className={`text-3xl font-extrabold text-center mb-2 transition-colors duration-300 ${isRegistering ? 'text-purple-700' : 'text-blue-700'}`}>
          {isRegistering ? 'Join Invictus' : 'Invictus'}
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          {isRegistering ? 'Create your fantasy legacy.' : 'Welcome back, Commissioner.'}
        </p>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-200 text-center capitalize animate-pulse">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded text-sm mb-4 border border-green-200 text-center">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all focus:ring-opacity-50"
              style={{ '--tw-ring-color': isRegistering ? '#9333ea' : '#2563eb' } as React.CSSProperties}
              placeholder="name@example.com" 
              required 
            />
          </div>
          
          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-gray-600 uppercase">Password</label>
              
              {/* Forgot Password Link (Only shows in Login Mode) */}
              {!isRegistering && (
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all focus:ring-opacity-50"
              style={{ '--tw-ring-color': isRegistering ? '#9333ea' : '#2563eb' } as React.CSSProperties}
              placeholder="••••••••" 
              required 
            />
          </div>

          {/* Confirm Password */}
          {isRegistering && (
            <div className="animate-fade-in-down">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all focus:ring-opacity-50"
                style={{ '--tw-ring-color': '#9333ea' } as React.CSSProperties}
                placeholder="••••••••" 
                required 
              />
            </div>
          )}

          <button 
            type="submit" 
            className={`w-full text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 ${isRegistering ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600 mb-2">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
          </p>
          <button 
            onClick={toggleMode}
            className={`font-semibold text-sm transition-colors ${isRegistering ? 'text-purple-600 hover:text-purple-800' : 'text-blue-600 hover:text-blue-800'}`}
          >
             {isRegistering ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}