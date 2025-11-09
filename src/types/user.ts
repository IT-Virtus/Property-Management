export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  user_type: 'buyer' | 'seller' | 'both';
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  user_type?: 'buyer' | 'seller' | 'both';
  preferences?: Record<string, any>;
}
