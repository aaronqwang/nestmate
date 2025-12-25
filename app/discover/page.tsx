'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  full_name: string;
  profile_photo: string;
  photos: string[];
  major: string;
  term: string;
  gender: string;
  availability_term: string;
  listing_type: string;
  has_place: string;
  bio: string;
  prompts: Array<{ prompt: string; answer: string }>;
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: 'No preference',
    term: 'No preference',
    listingType: 'No preference'
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;

      try {
        // Get users the current user has already liked
        const { data: likedUsers } = await supabase
          .from('likes')
          .select('to_user_id')
          .eq('from_user_id', user.id);

        const likedUserIds = likedUsers?.map(like => like.to_user_id) || [];

        // Build the query to fetch all users except current user and already liked users
        let query = supabase
          .from('users')
          .select('*')
          .neq('id', user.id);

        // Only filter out liked users if there are any
        if (likedUserIds.length > 0) {
          query = query.not('id', 'in', `(${likedUserIds.join(',')})`);
        }

        // Apply gender filter
        if (filters.gender !== 'No preference') {
          query = query.eq('gender', filters.gender);
        }

        // Apply term filter
        if (filters.term !== 'No preference') {
          query = query.eq('term', filters.term);
        }

        // Apply listing type filter
        if (filters.listingType !== 'No preference') {
          query = query.eq('listing_type', filters.listingType);
        }

        // Fetch all available users
        const { data: usersData, error } = await query
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProfiles(usersData || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user, supabase, filters]);

  const handleLike = async () => {
    if (!user || currentIndex >= profiles.length || isAnimating) return;

    setIsAnimating(true);
    setAnimationDirection('right');

    const profile = profiles[currentIndex];

    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          from_user_id: user.id,
          to_user_id: profile.id
        });

      if (error) throw error;

      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 300);
    } catch (error) {
      console.error('Error liking profile:', error);
      setIsAnimating(false);
      setAnimationDirection(null);
    }
  };

  const handleDislike = () => {
    if (currentIndex >= profiles.length || isAnimating) return;

    setIsAnimating(true);
    setAnimationDirection('left');

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 300);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading profiles...</div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {profiles.length === 0 && (filters.gender !== 'No preference' || filters.term !== 'No preference' || filters.listingType !== 'No preference')
              ? 'No profiles match your filters'
              : "That's everyone for now!"}
          </h2>
          <p className="text-gray-600 mb-6">
            {profiles.length === 0 && (filters.gender !== 'No preference' || filters.term !== 'No preference' || filters.listingType !== 'No preference')
              ? 'Try adjusting your filters to see more profiles'
              : 'Check back later for new profiles'}
          </p>
          {profiles.length === 0 && (filters.gender !== 'No preference' || filters.term !== 'No preference' || filters.listingType !== 'No preference') ? (
            <button
              onClick={() => setFilters({ gender: 'No preference', term: 'No preference', listingType: 'No preference' })}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={() => router.push('/matches')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              View Your Matches
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Filter Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Discover</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter Preferences</h2>
          
          <div className="space-y-4">
            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => {
                  setFilters({ ...filters, gender: e.target.value });
                  setCurrentIndex(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="No preference">No preference</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Term Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term (Academic Year)
              </label>
              <select
                value={filters.term}
                onChange={(e) => {
                  setFilters({ ...filters, term: e.target.value });
                  setCurrentIndex(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="No preference">No preference</option>
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Fourth Year">Fourth Year</option>
                <option value="Graduate">Graduate</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Listing Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Type
              </label>
              <select
                value={filters.listingType}
                onChange={(e) => {
                  setFilters({ ...filters, listingType: e.target.value });
                  setCurrentIndex(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="No preference">No preference</option>
                <option value="Looking for Roommate">Roommate Opportunities</option>
                <option value="Offering Sublet/Lease">Sublet/Lease Offers</option>
              </select>
            </div>

            {/* Active Filters Summary */}
            {(filters.gender !== 'No preference' || filters.term !== 'No preference' || filters.listingType !== 'No preference') && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Active filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.gender !== 'No preference' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                      Gender: {filters.gender}
                      <button
                        onClick={() => setFilters({ ...filters, gender: 'No preference' })}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.term !== 'No preference' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                      Term: {filters.term}
                      <button
                        onClick={() => setFilters({ ...filters, term: 'No preference' })}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.listingType !== 'No preference' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                      {filters.listingType === 'Looking for Roommate' ? 'Roommate Opportunities' : 'Sublet/Lease Offers'}
                      <button
                        onClick={() => setFilters({ ...filters, listingType: 'No preference' })}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => setFilters({ gender: 'No preference', term: 'No preference', listingType: 'No preference' })}
                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="relative">
        {/* Profile Card */}
        <div
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isAnimating
              ? animationDirection === 'right'
                ? 'translate-x-[150%] rotate-12 opacity-0'
                : '-translate-x-[150%] -rotate-12 opacity-0'
              : 'translate-x-0 rotate-0 opacity-100'
          }`}
        >
          {/* Profile Photo */}
          <div className="relative h-96 bg-gray-200">
            {currentProfile.profile_photo ? (
              <Image
                src={currentProfile.profile_photo}
                alt={currentProfile.full_name || 'User'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-8xl">👤</span>
              </div>
            )}
            
            {/* Name and Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <h2 className="text-3xl font-bold text-white mb-1">
                {currentProfile.full_name || 'Anonymous'}
              </h2>
              {currentProfile.major && (
                <p className="text-white text-lg">{currentProfile.major}</p>
              )}
              {currentProfile.term && (
                <p className="text-white/90">{currentProfile.term}</p>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {/* Availability and Listing Type */}
            {(currentProfile.availability_term || currentProfile.listing_type || currentProfile.has_place) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {currentProfile.listing_type && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {currentProfile.listing_type === 'Looking for Roommate' ? '🏠' : '🔑'} {currentProfile.listing_type}
                  </span>
                )}
                {currentProfile.availability_term && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    📅 {currentProfile.availability_term}
                  </span>
                )}
                {currentProfile.has_place && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {currentProfile.has_place === 'Have a place' ? '🏡' : currentProfile.has_place === 'Need a place' ? '🔍' : '🤝'} {currentProfile.has_place}
                  </span>
                )}
              </div>
            )}

            {/* Bio */}
            {currentProfile.bio && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700">{currentProfile.bio}</p>
              </div>
            )}

            {/* Prompts */}
            {currentProfile.prompts && currentProfile.prompts.length > 0 && (
              <div className="space-y-4">
                {currentProfile.prompts.map((item, index) => (
                  item.prompt && item.answer && (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4">
                      <p className="text-sm font-semibold text-indigo-600 mb-1">
                        {item.prompt}
                      </p>
                      <p className="text-gray-700">{item.answer}</p>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Additional Photos */}
            {currentProfile.photos && currentProfile.photos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">More Photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {currentProfile.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center items-center gap-8 mt-8">
          <button
            onClick={handleDislike}
            disabled={isAnimating}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-500"
          >
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={handleLike}
            disabled={isAnimating}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-500"
          >
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>

        {/* Profile Counter */}
        <div className="text-center mt-4 text-gray-500 text-sm">
          {currentIndex + 1} / {profiles.length}
        </div>
      </div>
    </div>
  );
}
