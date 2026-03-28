import supabaseServerClient from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  await supabaseServerClient.auth.signOut();

  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  });
}
