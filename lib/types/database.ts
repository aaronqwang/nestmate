export interface User {
  id: string;
  email: string;
  full_name?: string;
  profile_photo?: string;
  photos?: string[];
  major?: string;
  term?: string;
  bio?: string;
  prompts?: Array<{ prompt: string; answer: string }>;
  preferences?: {
    budget_range?: { min: number; max: number };
    move_in_date?: string;
    lease_duration?: string;
    cleanliness_level?: string;
    noise_tolerance?: string;
    guest_policy?: string;
  };
  location_lat?: number;
  location_lng?: number;
  last_active?: string;
  is_verified?: boolean;
  is_online?: boolean;
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Like {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}
