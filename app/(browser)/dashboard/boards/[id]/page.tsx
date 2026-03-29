import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BoardView } from './components/BoardView';
import { Board, List, Task } from './store/useBoardStore';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { id } = await params;

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (boardError || !board) {
    redirect('/dashboard/boards');
  }

  const { data: lists, error: listsError } = await supabase
    .from('lists')
    .select('*, tasks(*)')
    .eq('board_id', id)
    .order('position', { ascending: true });

  if (listsError) {
    redirect('/dashboard/boards');
  }

  const processedLists = (lists ?? []).map((list) => ({
    ...list,
    tasks: (list.tasks ?? []).sort((a: Task, b: Task) => a.position - b.position),
  })) as List[];

  return (
    <BoardView
      initialBoard={board as Board}
      initialLists={processedLists}
    />
  );
}
