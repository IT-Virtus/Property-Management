import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const checkIsAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('checkIsAdmin: No user found');
    return false;
  }

  console.log('checkIsAdmin: Checking for user_id:', user.id);

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  console.log('checkIsAdmin: Query result:', { data, error });

  if (error) {
    console.error('checkIsAdmin: Error querying admin_users:', error);
    return false;
  }

  if (!data) {
    console.log('checkIsAdmin: User not found in admin_users table');
    return false;
  }

  console.log('checkIsAdmin: User IS admin');
  return true;
};