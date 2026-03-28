'use server'

import supabaseServerClient from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOut() {
  await supabaseServerClient.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
