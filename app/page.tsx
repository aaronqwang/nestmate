'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const texts = ['nestmate', 'find the perfect roommate', 'live better together'];

  useEffect(() => {
    const currentText = texts[textIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseTime = 2000; // Pause at end of text

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(currentText.slice(0, displayText.length - 1));
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, textIndex]);

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
        <h1 className="text-8xl font-bold text-gray-900 mb-4 h-28 flex items-center">
          {displayText}
          <span className="animate-pulse ml-1">|</span>
        </h1>
     
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
