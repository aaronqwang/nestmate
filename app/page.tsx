'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleDiscoverClick = () => {
    if (user) {
      router.push('/discover');
    } else {
      router.push('/auth');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-8xl font-bold text-gray-900 mb-4">
          nestmate
        </h1>
        <p className="text-2xl text-gray-600 mb-2">
          no roommate? nestmates got you
        </p>
        <p className="text-lg text-indigo-600 font-semibold mb-8">
          exclusively for UWaterloo students
        </p>
        <button
          onClick={handleDiscoverClick}
          className="px-8 py-4 bg-indigo-600 text-white text-xl font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
        >
          Discover
        </button>
      </main>
    </div>
  );
}
