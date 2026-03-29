import { getAuthenticatedUser } from '@/lib/supabase/get-user';
import { BoardClient } from './_components/BoardClient';
import { Board } from '@/types';

export const dynamic = 'force-dynamic';

export default async function BoardsPage() {
  const { supabase, user } = await getAuthenticatedUser();

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: Board[] | null, error: unknown };

  return <BoardClient initialBoards={boards || []} />;
}
