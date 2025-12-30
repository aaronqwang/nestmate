'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-full mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left - Logo and Name */}
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-bold text-indigo-600">
              nestmate
            </Link>
          </div>

          {/* Center - Navigation Links */}
          {user && (
            <div className="flex items-center space-x-12">
              <Link
                href="/discover"
                className="text-gray-700 hover:text-indigo-600 font-medium text-lg"
              >
                Discover
              </Link>
              <Link
                href="/matches"
                className="text-gray-700 hover:text-indigo-600 font-medium text-lg"
              >
                Matches
              </Link>
              <Link
                href="/messages"
                className="text-gray-700 hover:text-indigo-600 font-medium text-lg"
              >
                Messages
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-indigo-600 font-medium text-lg"
              >
                Profile
              </Link>
            </div>
          )}

          {/* Right - Sign Out */}
          <div className="flex items-center">
            {loading ? (
              <div className="animate-pulse">
                <Image 
                  src="/logo.png" 
                  alt="Loading" 
                  width={50} 
                  height={50}
                  className="object-contain opacity-50"
                />
              </div>
            ) : user ? (
              <button
                onClick={handleSignOut}
                className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth"
                className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
