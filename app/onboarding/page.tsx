'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Form states
  const [fullName, setFullName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [major, setMajor] = useState('');
  const [term, setTerm] = useState('');
  const [gender, setGender] = useState('');
  const [availabilityTerm, setAvailabilityTerm] = useState('');
  const [hasPlace, setHasPlace] = useState('');
  const [preferredGender, setPreferredGender] = useState('No preference');
  const [preferredTerm, setPreferredTerm] = useState('No preference');
  const [bio, setBio] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState<Array<{prompt: string, answer: string}>>([
    { prompt: '', answer: '' },
    { prompt: '', answer: '' },
    { prompt: '', answer: '' }
  ]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Check if user already has completed profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('profile_completed')
        .eq('id', user.id)
        .single();

      if (data?.profile_completed) {
        router.push('/discover');
      }
    };

    checkProfile();
  }, [user, router, supabase]);

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

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        if (!fullName.trim()) {
          setError('Please enter your full name');
          return false;
        }
        if (!profilePhoto) {
          setError('Please upload a profile photo');
          return false;
        }
        return true;
      
      case 2:
        if (!major) {
          setError('Please select your major/program');
          return false;
        }
        if (!term) {
          setError('Please select your current term');
          return false;
        }
        if (!gender) {
          setError('Please select your gender');
          return false;
        }
        return true;
      
      case 3:
        if (!availabilityTerm) {
          setError('Please select your availability term');
          return false;
        }
        if (!hasPlace) {
          setError('Please select your housing status');
          return false;
        }
        return true;
      
      case 4:
        // Bio is optional, always valid
        return true;
      
      case 5:
        const filledPrompts = selectedPrompts.filter(p => p.prompt && p.answer.trim());
        if (filledPrompts.length === 0) {
          setError('Please answer at least one prompt to help others get to know you');
          return false;
        }
        return true;
      
      case 6:
        // Photos are optional, always valid
        return true;
      
      case 7:
        // Preferences are optional, always valid
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    if (!user) {
      setError('User not found. Please log in again.');
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    setSaving(true);
    try {
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
        prompts: selectedPrompts.filter(p => p.prompt && p.answer),
        preferred_gender: preferredGender,
        preferred_term: preferredTerm,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .upsert(updateData, { onConflict: 'id' })
        .select();

      if (error) throw error;

      router.push('/discover');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError('Error saving profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step === currentStep
                ? 'bg-indigo-600 text-white'
                : step < currentStep
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {step < totalSteps && (
            <div
              className={`w-16 h-1 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's start with the basics</h2>
              <p className="text-gray-600">Tell us your name and upload a profile photo</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {profilePhoto ? (
                    <Image src={profilePhoto} alt="Profile" fill className="object-cover" />
                  ) : (
                    <span className="text-gray-400 text-4xl">👤</span>
                  )}
                </div>
                <label className="cursor-pointer px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Academic Information</h2>
              <p className="text-gray-600">Help others know more about your academic background</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Major / Program <span className="text-red-500">*</span>
              </label>
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select your gender</option>
                {GENDERS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Housing Details</h2>
              <p className="text-gray-600">Tell us about your housing situation and needs</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability Term <span className="text-red-500">*</span>
              </label>
              <select
                value={availabilityTerm}
                onChange={(e) => setAvailabilityTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select availability</option>
                {AVAILABILITY_TERMS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">When are you looking for housing?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Housing Status <span className="text-red-500">*</span>
              </label>
              <select
                value={hasPlace}
                onChange={(e) => setHasPlace(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select status</option>
                {HAS_PLACE_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">Do you already have a place or are you looking?</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add a Bio (Optional)</h2>
              <p className="text-gray-600">Write a short bio to introduce yourself to potential roommates</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Me
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself, your interests, lifestyle, what you're looking for in a roommate..."
                rows={6}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">{bio.length}/500 characters</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> A good bio helps others understand your personality and lifestyle. Share your interests, habits, and what makes you a great roommate!
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
              <p className="text-gray-600">Answer at least one prompt to help find your perfect match</p>
            </div>

            <div className="space-y-6">
              {selectedPrompts.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt {index + 1} {index === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={item.prompt}
                    onChange={(e) => handlePromptChange(index, 'prompt', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add More Photos (Optional)</h2>
              <p className="text-gray-600">Showcase more of yourself with additional photos</p>
            </div>

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
                    <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center text-sm">
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
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Your Preferences</h2>
              <p className="text-gray-600">Help us show you the most relevant roommate matches</p>
            </div>

            <div className="space-y-6">
              {/* Gender Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Roommate Gender
                </label>
                <select
                  value={preferredGender}
                  onChange={(e) => setPreferredGender(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="No preference">No preference</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-sm text-gray-500 mt-2">Filter profiles by gender preference</p>
              </div>

              {/* Term Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Academic Year
                </label>
                <select
                  value={preferredTerm}
                  onChange={(e) => setPreferredTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="No preference">No preference</option>
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="Fourth Year">Fourth Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-sm text-gray-500 mt-2">Filter profiles by academic year</p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="font-semibold text-indigo-900 mb-2">🎉 You're all set!</h3>
              <p className="text-indigo-700 text-sm mb-2">
                Click "Complete Profile" to start discovering your perfect roommate match!
              </p>
              <p className="text-indigo-600 text-xs">
                You can change these preferences anytime from your profile settings.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Nestmate!</h1>
          <p className="text-lg text-gray-600">Let's set up your profile in just a few steps</p>
        </div>

        {renderStepIndicator()}

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {renderStep()}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Complete Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
