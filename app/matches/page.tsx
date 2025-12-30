'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

interface MatchedUser {
  id: string;
  match_id: string;
  full_name: string;
  profile_photo: string;
  major: string;
  term: string;
  bio: string;
  matched_at: string;
}

interface SentLike {
  id: string;
  full_name: string;
  profile_photo: string;
  major: string;
  term: string;
  bio: string;
  liked_at: string;
}

interface ReceivedLike {
  like_id: string;
  user_id: string;
  full_name: string;
  profile_photo: string;
  major: string;
  term: string;
  bio: string;
  received_at: string;
}

type TabType = 'matched' | 'sent' | 'received';

export default function MatchesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabType>('matched');
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [sentLikes, setSentLikes] = useState<SentLike[]>([]);
  const [receivedLikes, setReceivedLikes] = useState<ReceivedLike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch matched users
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (matchesError) throw matchesError;

        const matchedUsers: MatchedUser[] = [];
        
        for (const match of matchesData || []) {
          const matchedUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, full_name, profile_photo, major, term, bio')
            .eq('id', matchedUserId)
            .single();

          if (!userError && userData) {
            matchedUsers.push({
              ...userData,
              match_id: match.id,
              matched_at: match.created_at
            });
          }
        }

        setMatches(matchedUsers);

        // Fetch sent likes (not yet matched)
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('to_user_id, created_at')
          .eq('from_user_id', user.id);

        if (likesError) throw likesError;

        // Filter out likes that have been matched
        const matchedUserIds = matchedUsers.map(m => m.id);
        const unMatchedLikes = (likesData || []).filter(
          like => !matchedUserIds.includes(like.to_user_id)
        );

        const sentUsers: SentLike[] = [];
        
        for (const like of unMatchedLikes) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, full_name, profile_photo, major, term, bio')
            .eq('id', like.to_user_id)
            .single();

          if (!userError && userData) {
            sentUsers.push({
              ...userData,
              liked_at: like.created_at
            });
          }
        }

        setSentLikes(sentUsers);

        // Fetch received likes (people who liked me but I haven't liked back)
        const { data: receivedLikesData, error: receivedError } = await supabase
          .from('likes')
          .select('id, from_user_id, created_at')
          .eq('to_user_id', user.id);

        if (receivedError) throw receivedError;

        // Filter out likes where I've already liked back (those are matches)
        const myLikedUserIds = (likesData || []).map(like => like.to_user_id);
        const unMatchedReceivedLikes = (receivedLikesData || []).filter(
          like => !myLikedUserIds.includes(like.from_user_id)
        );

        const receivedUsers: ReceivedLike[] = [];
        
        for (const like of unMatchedReceivedLikes) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, full_name, profile_photo, major, term, bio')
            .eq('id', like.from_user_id)
            .single();

          if (!userError && userData) {
            receivedUsers.push({
              like_id: like.id,
              user_id: userData.id,
              full_name: userData.full_name,
              profile_photo: userData.profile_photo,
              major: userData.major,
              term: userData.term,
              bio: userData.bio,
              received_at: like.created_at
            });
          }
        }

        setReceivedLikes(receivedUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, supabase]);

  const handleAcceptLike = async (userId: string) => {
    if (!user) return;

    try {
      // Create a like back, which will trigger the match
      const { error } = await supabase
        .from('likes')
        .insert({
          from_user_id: user.id,
          to_user_id: userId,
        });

      if (error) throw error;

      // Refresh the page to update all tabs
      window.location.reload();
    } catch (error) {
      console.error('Error accepting like:', error);
    }
  };

  const handleRejectLike = async (likeId: string) => {
    // Just remove from UI (optionally could delete from DB)
    setReceivedLikes(prev => prev.filter(like => like.like_id !== likeId));
  };

  const handleUnmatch = async (matchId: string, matchedUserId: string) => {
    if (!user) return;

    const confirmed = confirm('Are you sure you want to unmatch? This cannot be undone.');
    if (!confirmed) return;

    try {
      // Delete the match
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (matchError) throw matchError;

      // Optionally delete both likes to allow re-matching
      await supabase
        .from('likes')
        .delete()
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${matchedUserId}),and(from_user_id.eq.${matchedUserId},to_user_id.eq.${user.id})`);

      // Update UI
      setMatches(matches.filter(m => m.match_id !== matchId));
    } catch (error) {
      console.error('Error unmatching:', error);
      alert('Failed to unmatch. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Matches</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('matched')}
            className={`${
              activeTab === 'matched'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Matched ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`${
              activeTab === 'received'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
          >
            Interested ({receivedLikes.length})
            {receivedLikes.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {receivedLikes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`${
              activeTab === 'sent'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Requested ({sentLikes.length})
          </button>
        </nav>
      </div>

      {/* Matched Tab Content */}
      {activeTab === 'matched' && (
        <>
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No matches yet!</p>
              <p className="text-sm text-gray-500">Start swiping to find your perfect roommate</p>
              <Link
                href="/discover"
                className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Discover Roommates
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/profile/${match.id}`}>
                    <div className="relative h-64 bg-gray-200 cursor-pointer">
                      {match.profile_photo ? (
                        <Image
                          src={match.profile_photo}
                          alt={match.full_name || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-6xl">👤</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {match.full_name || 'Anonymous'}
                    </h3>
                    
                    {match.major && (
                      <p className="text-sm text-gray-600 mb-1">
                        {match.major}
                      </p>
                    )}
                    
                    {match.term && (
                      <p className="text-sm text-gray-500 mb-3">
                        {match.term}
                      </p>
                    )}
                    
                    {match.bio && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {match.bio}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-400 mb-4">
                      Matched {new Date(match.matched_at).toLocaleDateString()}
                    </div>
                    
                    <div className="space-y-2">
                      <Link
                        href={`/messages?user=${match.id}`}
                        className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Send Message
                      </Link>
                      <button
                        onClick={() => handleUnmatch(match.match_id, match.id)}
                        className="block w-full text-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                      >
                        Unmatch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Received Tab Content */}
      {activeTab === 'received' && (
        <>
          {receivedLikes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No one has shown interest yet!</p>
              <p className="text-sm text-gray-500">Keep improving your profile to attract more roommates</p>
              <Link
                href="/profile"
                className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Edit Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {receivedLikes.map((like) => (
                <div
                  key={like.like_id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/profile/${like.user_id}`}>
                    <div className="relative h-64 bg-gray-200 cursor-pointer">
                      {like.profile_photo ? (
                        <Image
                          src={like.profile_photo}
                          alt={like.full_name || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-6xl">👤</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Interested
                      </div>
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {like.full_name || 'Anonymous'}
                    </h3>
                    
                    {like.major && (
                      <p className="text-sm text-gray-600 mb-1">
                        {like.major}
                      </p>
                    )}
                    
                    {like.term && (
                      <p className="text-sm text-gray-500 mb-3">
                        {like.term}
                      </p>
                    )}
                    
                    {like.bio && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {like.bio}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-400 mb-4">
                      Interested since {new Date(like.received_at).toLocaleDateString()}
                    </div>
                    
                    {/* Accept/Reject Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectLike(like.like_id)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Pass
                      </button>
                      <button
                        onClick={() => handleAcceptLike(like.user_id)}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Match
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sent Tab Content */}
      {activeTab === 'sent' && (
        <>
          {sentLikes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You haven't shown interest in anyone yet!</p>
              <p className="text-sm text-gray-500">Start connecting with profiles to see them here</p>
              <Link
                href="/discover"
                className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Discover Roommates
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sentLikes.map((like) => (
                <div
                  key={like.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow opacity-75"
                >
                  <Link href={`/profile/${like.id}`}>
                    <div className="relative h-64 bg-gray-200 cursor-pointer">
                      {like.profile_photo ? (
                        <Image
                          src={like.profile_photo}
                          alt={like.full_name || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-6xl">👤</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Pending
                      </div>
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {like.full_name || 'Anonymous'}
                    </h3>
                    
                    {like.major && (
                      <p className="text-sm text-gray-600 mb-1">
                        {like.major}
                      </p>
                    )}
                    
                    {like.term && (
                      <p className="text-sm text-gray-500 mb-3">
                        {like.term}
                      </p>
                    )}
                    
                    {like.bio && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {like.bio}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      Liked {new Date(like.liked_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
