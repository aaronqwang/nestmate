'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

const TERMS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Graduate',
  'Other'
];

const GENDERS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
  'Other'
];

const AVAILABILITY_TERMS = [
  'Fall',
  'Winter',
  'Spring',
  'Fall & Winter',
  'Winter & Spring',
  'Full Year'
];

const HAS_PLACE_OPTIONS = [
  'Have a place',
  'Need a place',
  'Flexible'
];

const MAJORS = [
  'Accounting and Financial Management',
  'Anthropology',
  'Applied Mathematics',
  'Architectural Engineering',
  'Architecture',
  'Arts and Business',
  'Biochemistry',
  'Biology',
  'Biomedical Engineering',
  'Biomedical Sciences',
  'Biotechnology/CPA',
  'Business Administration',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Classical Studies',
  'Combinatorics and Optimization',
  'Computational Mathematics',
  'Computer Engineering',
  'Computer Science',
  'Computing and Financial Management',
  'Data Science',
  'Economics',
  'Electrical Engineering',
  'English',
  'Environment and Business',
  'Environment, Resources and Sustainability',
  'Environmental Engineering',
  'Fine Arts',
  'French',
  'Geography and Aviation',
  'Geography and Environmental Management',
  'Geological Engineering',
  'Geomatics',
  'German',
  'Global Business and Digital Arts',
  'Health Sciences',
  'History',
  'Honours Arts',
  'Kinesiology',
  'Knowledge Integration',
  'Legal Studies',
  'Management Engineering',
  'Materials and Nanosciences',
  'Mathematical Economics',
  'Mathematical Finance',
  'Mathematical Optimization',
  'Mathematical Physics',
  'Mathematics',
  'Mathematics/Business Administration',
  'Mathematics/CPA',
  'Mathematics/Financial Analysis and Risk Management',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Medicinal Chemistry',
  'Music',
  'Nanotechnology Engineering',
  'Philosophy',
  'Physics',
  'Physics and Astronomy',
  'Planning',
  'Political Science',
  'Psychology',
  'Public Health',
  'Pure Mathematics',
  'Recreation and Leisure Studies',
  'Recreation and Sport Business',
  'Social Development Studies',
  'Sociology',
  'Software Engineering',
  'Spanish',
  'Statistics',
  'Sustainability and Financial Management',
  'Systems Design Engineering',
  'Therapeutic Recreation',
  'Other'
];

const PROMPTS = [
  'My ideal living situation is...',
  'I\'m looking for a roommate who...',
  'My living habits include...',
  'On a typical weekday, you\'ll find me...',
  'My perfect weekend involves...',
  'I keep my space...',
  'When it comes to guests and parties...',
  'My sleep schedule is...',
  'Deal breakers for me are...',
  'What makes me a great roommate is...'
];

export default function ProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [major, setMajor] = useState('');
  const [term, setTerm] = useState('');
  const [gender, setGender] = useState('');
  const [availabilityTerm, setAvailabilityTerm] = useState('');
  const [hasPlace, setHasPlace] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState<Array<{prompt: string, answer: string}>>([
    { prompt: '', answer: '' },
    { prompt: '', answer: '' },
    { prompt: '', answer: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          // If user doesn't exist yet, that's ok - they're setting up for the first time
          if (error.code === 'PGRST116') {
            console.log('New user - no profile data yet');
          } else {
            console.error('Error loading profile:', error);
          }
        }

        if (data) {
          setFullName(data.full_name || '');
          setProfilePhoto(data.profile_photo || null);
          setPhotos(data.photos && data.photos.length > 0 ? data.photos : [null, null, null, null]);
          setMajor(data.major || '');
          setTerm(data.term || '');
          setGender(data.gender || '');
          setAvailabilityTerm(data.availability_term || '');
          setHasPlace(data.has_place || '');
          
          // Always ensure we have exactly 3 prompt slots
          const loadedPrompts = data.prompts && Array.isArray(data.prompts) ? data.prompts : [];
          const paddedPrompts = [
            loadedPrompts[0] || { prompt: '', answer: '' },
            loadedPrompts[1] || { prompt: '', answer: '' },
            loadedPrompts[2] || { prompt: '', answer: '' }
          ];
          setSelectedPrompts(paddedPrompts);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, supabase]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...photos];
        newPhotos[index] = reader.result as string;
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromptChange = (index: number, field: 'prompt' | 'answer', value: string) => {
    const newPrompts = [...selectedPrompts];
    newPrompts[index] = { ...newPrompts[index], [field]: value };
    setSelectedPrompts(newPrompts);
  };

  const handleSave = async () => {
    if (!user) {
      alert('User not found. Please log in again.');
      return;
    }
    
    // Check if required fields are filled
    const hasRequiredFields = fullName && profilePhoto && major && term && gender && 
                             availabilityTerm && hasPlace &&
                             selectedPrompts.some(p => p.prompt && p.answer);
    
    if (!hasRequiredFields) {
      alert('Please fill in all required fields: Name, Profile Photo, Major, Term, Gender, Availability, Housing Status, and at least one prompt.');
      return;
    }
    
    setSaving(true);
    try {
      console.log('Saving profile for user:', user.id);
      
      const updateData = {
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0] || fullName.toLowerCase().replace(/\s+/g, '_'),
        full_name: fullName,
        profile_photo: profilePhoto,
        photos: photos.filter(p => p !== null),
        major,
        term,
        gender,
        availability_term: availabilityTerm,
        has_place: hasPlace,
        prompts: selectedPrompts.filter(p => p.prompt && p.answer),
        profile_completed: true,
        updated_at: new Date().toISOString()
      };
      
      console.log('Update data:', updateData);
      
      // Use upsert instead of update to handle both insert and update
      const { data, error } = await supabase
        .from('users')
        .upsert(updateData, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Save successful:', data);
      alert('Profile saved successfully! You can now access the discover page.');
      if (isWelcome) {
        window.location.href = '/discover';
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isWelcome && (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-indigo-900 mb-2">Welcome to NestMate! 🏠</h2>
          <p className="text-indigo-700 mb-3">
            Let's set up your profile so you can start finding your perfect roommate. Complete all required fields below to unlock the discover page.
          </p>
          <div className="text-sm text-indigo-600">
            <strong>Required:</strong> Name, Profile Photo, Major, Term, Gender, Availability, Housing Status, and at least one prompt
          </div>
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>
      
      {/* Full Name */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Profile Photo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile Photo</h2>
        <div className="flex items-center space-x-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {profilePhoto ? (
              <Image src={profilePhoto} alt="Profile" fill className="object-cover" />
            ) : (
              <span className="text-gray-400 text-4xl">👤</span>
            )}
          </div>
          <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Major, Term, and Gender */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Major / Program
          </label>
          <select
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select your major/program</option>
            {MAJORS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Term
          </label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select term</option>
            {TERMS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select your gender</option>
            {GENDERS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Availability and Housing Status */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability Term
          </label>
          <select
            value={availabilityTerm}
            onChange={(e) => setAvailabilityTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select availability</option>
            {AVAILABILITY_TERMS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">When are you looking for housing?</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Housing Status
          </label>
          <select
            value={hasPlace}
            onChange={(e) => setHasPlace(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select status</option>
            {HAS_PLACE_OPTIONS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Do you already have a place?</p>
        </div>
      </div>

      {/* Feature Photos */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Photos</h2>
        <p className="text-sm text-gray-600 mb-4">Add up to 4 photos to showcase yourself</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {photo ? (
                <Image src={photo} alt={`Photo ${index + 1}`} fill className="object-cover" />
              ) : (
                <label className="cursor-pointer w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(index, e)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prompts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">About You</h2>
        <p className="text-sm text-gray-600 mb-4">Answer prompts to help find your perfect match</p>
        <div className="space-y-6">
          {selectedPrompts.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <select
                value={item.prompt}
                onChange={(e) => handlePromptChange(index, 'prompt', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 mb-3"
              >
                <option value="">Select a prompt</option>
                {PROMPTS.map(prompt => (
                  <option key={prompt} value={prompt}>{prompt}</option>
                ))}
              </select>
              <textarea
                value={item.answer}
                onChange={(e) => handlePromptChange(index, 'answer', e.target.value)}
                placeholder="Your answer..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Account Settings */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
        
        {/* Change Password */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium mb-4">Change Password</h3>
          <button
            onClick={() => window.location.href = '/settings'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Manage Account Settings
          </button>
        </div>
      </div>
    </div>
  );
}
