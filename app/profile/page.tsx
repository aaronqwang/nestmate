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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [major, setMajor] = useState('');
  const [term, setTerm] = useState('');
  const [gender, setGender] = useState('');
  const [availabilityTerm, setAvailabilityTerm] = useState('');
  const [hasPlace, setHasPlace] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [preferredGender, setPreferredGender] = useState('No preference');
  const [preferredTerm, setPreferredTerm] = useState('No preference');
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
          // Ensure we always have exactly 4 photo slots
          const loadedPhotos = data.photos && Array.isArray(data.photos) ? data.photos : [];
          const paddedPhotos = [
            loadedPhotos[0] || null,
            loadedPhotos[1] || null,
            loadedPhotos[2] || null,
            loadedPhotos[3] || null
          ];
          setPhotos(paddedPhotos);
          setMajor(data.major || '');
          setTerm(data.term || '');
          setGender(data.gender || '');
          setAvailabilityTerm(data.availability_term || '');
          setHasPlace(data.has_place || '');
          setBio(data.bio || '');
          setPreferredGender(data.preferred_gender || 'No preference');
          setPreferredTerm(data.preferred_term || 'No preference');
          
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
    
    // Validate all required fields
    if (!fullName.trim()) {
      alert('Please enter your full name.');
      return;
    }

    if (!profilePhoto) {
      alert('Please upload a profile photo.');
      return;
    }

    if (!major) {
      alert('Please select your major/program.');
      return;
    }

    if (!term) {
      alert('Please select your current term.');
      return;
    }

    if (!gender) {
      alert('Please select your gender.');
      return;
    }

    if (!availabilityTerm) {
      alert('Please select your availability term.');
      return;
    }

    if (!hasPlace) {
      alert('Please select your housing status.');
      return;
    }

    const filledPrompts = selectedPrompts.filter(p => p.prompt && p.answer.trim());
    if (filledPrompts.length === 0) {
      alert('Please answer at least one prompt to help others get to know you.');
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
        bio: bio.trim() || null,
        prompts: filledPrompts,
        preferred_gender: preferredGender,
        preferred_term: preferredTerm,
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
      alert('Profile updated successfully!');
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>
      
      {/* Full Name */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name <span className="text-red-500">*</span>
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
        <h2 className="text-xl font-semibold mb-4">Profile Photo <span className="text-red-500">*</span></h2>
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

      {/* Bio */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">About Me</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write a short bio about yourself, your interests, lifestyle, and what you're looking for in a roommate..."
          rows={5}
          maxLength={500}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
      </div>

      {/* Major, Term, and Gender */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Major / Program <span className="text-red-500">*</span>
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
            Current Term <span className="text-red-500">*</span>
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
            Gender <span className="text-red-500">*</span>
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
            Availability Term <span className="text-red-500">*</span>
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
            Housing Status <span className="text-red-500">*</span>
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

      {/* Preferences */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Discovery Preferences</h2>
        <p className="text-sm text-gray-600 mb-4">Set your preferences for who you'd like to see in the discover section</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Roommate Gender
            </label>
            <select
              value={preferredGender}
              onChange={(e) => setPreferredGender(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="No preference">No preference</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
              <option value="Other">Other</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Filter profiles by gender preference</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Academic Year
            </label>
            <select
              value={preferredTerm}
              onChange={(e) => setPreferredTerm(e.target.value)}
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
            <p className="text-xs text-gray-500 mt-1">Filter profiles by academic year</p>
          </div>
        </div>
      </div>

      {/* Feature Photos */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Photos</h2>
        <p className="text-sm text-gray-600 mb-4">Add up to 4 photos to showcase yourself</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {photos.map((photo, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {photo ? (
                  <Image src={photo} alt={`Photo ${index + 1}`} fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-gray-400 text-3xl">📷</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center text-sm">
                  {photo ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(index, e)}
                    className="hidden"
                  />
                </label>
                {photo && (
                  <button
                    onClick={() => {
                      const newPhotos = [...photos];
                      newPhotos[index] = null;
                      setPhotos(newPhotos);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">About You <span className="text-red-500">*</span></h2>
        <p className="text-sm text-gray-600 mb-4">Answer at least one prompt to help find your perfect match</p>
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
