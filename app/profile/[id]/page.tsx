'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

interface UserProfile {
  id: string;
  full_name: string;
  profile_photo: string;
  photos: string[];
  major: string;
  term: string;
  gender: string;
  availability_term: string;
  has_place: string;
  bio: string;
  prompts: Array<{ prompt: string; answer: string }>;
}

export default function ProfileViewPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !profileId) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', profileId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, profileId, supabase]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h2>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const allPhotos = [profile.profile_photo, ...(profile.photos || [])].filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Profile Photo Carousel */}
        <div className="relative h-[500px] bg-gray-200">
          {(() => {
            const currentPhoto = allPhotos[currentPhotoIndex] || profile.profile_photo;
            
            return (
              <>
                {currentPhoto ? (
                  <Image
                    src={currentPhoto}
                    alt={profile.full_name || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-8xl">👤</span>
                  </div>
                )}
                
                {/* Photo navigation - only show if multiple photos */}
                {allPhotos.length > 1 && (
                  <>
                    {/* Previous photo button */}
                    {currentPhotoIndex > 0 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(prev => prev - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Next photo button */}
                    {currentPhotoIndex < allPhotos.length - 1 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(prev => prev + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Photo indicator dots */}
                    <div className="absolute top-4 left-0 right-0 flex justify-center gap-2">
                      {allPhotos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentPhotoIndex 
                              ? 'w-6 bg-white' 
                              : 'w-2 bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            );
          })()}
          
          {/* Name and Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h2 className="text-4xl font-bold text-white mb-1">
              {profile.full_name || 'Anonymous'}
            </h2>
            {profile.major && (
              <p className="text-white text-xl">{profile.major}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {profile.term && (
                <span className="text-white/90 text-sm">{profile.term}</span>
              )}
              {profile.term && profile.has_place && (
                <span className="text-white/60">•</span>
              )}
              {profile.has_place && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                  {profile.has_place === 'Have a place' ? '🏡 Have a place' : 
                   profile.has_place === 'Need a place' ? '🔍 Need a place' : 
                   '🤝 Flexible'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8">
          {/* Availability and Housing Status */}
          {(profile.availability_term || profile.has_place || profile.gender) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {profile.availability_term && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  📅 {profile.availability_term}
                </span>
              )}
              {profile.has_place && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {profile.has_place === 'Have a place' ? '🏡' : profile.has_place === 'Need a place' ? '🔍' : '🤝'} {profile.has_place}
                </span>
              )}
              {profile.gender && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {profile.gender}
                </span>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Prompts */}
          {profile.prompts && profile.prompts.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Get to Know Me</h3>
              {profile.prompts.map((item, index) => (
                item.prompt && item.answer && (
                  <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <p className="text-sm font-semibold text-indigo-600 mb-2">
                      {item.prompt}
                    </p>
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Additional Photos Grid */}
          {profile.photos && profile.photos.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">More Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.photos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setCurrentPhotoIndex(index + 1)}
                  >
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
      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Close
        </button>
        <button
          onClick={() => router.push(`/messages?match=${profileId}`)}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
