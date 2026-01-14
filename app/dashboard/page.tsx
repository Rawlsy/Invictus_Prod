'use client';
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
      <button onClick={handleSignOut} className="mt-4 text-red-600 border border-red-600 p-2 rounded">
        Sign Out
      </button>
    </div>
  );
}