import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BoardClient } from './components/BoardClient';

export const dynamic = 'force-dynamic';

export default async function BoardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <BoardClient initialBoards={boards || []} />;
}
