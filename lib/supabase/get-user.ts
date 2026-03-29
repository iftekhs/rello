import { redirect } from 'next/navigation';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from './server';

export async function getAuthenticatedUser(): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  return { supabase, user };
}
