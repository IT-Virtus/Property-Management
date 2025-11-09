import { supabase } from './supabase';
import { UserProfile, UpdateProfileData } from '../types/user';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);

  return { error };
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return getUserProfile(user.id);
}
