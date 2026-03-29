import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/get-user';
import { BoardView } from './_components/BoardView';
import { Board, List, Task } from '@/store/useBoardStore';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { supabase, user } = await getAuthenticatedUser();

  const { id } = await params;

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single();

  if (boardError || !board) {
    redirect('/dashboard/boards');
  }

  const isOwner = board.user_id === user.id;
  const isPublicReadOnly = board.visibility === 'public_readonly';
  const isPublicReadWrite = board.visibility === 'public_readwrite';

  if (!isOwner && !isPublicReadOnly && !isPublicReadWrite) {
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
    tasks: (list.tasks ?? []).sort(
      (a: Task, b: Task) => a.position - b.position,
    ),
  })) as List[];

  return (
    <BoardView initialBoard={board as Board} initialLists={processedLists} />
  );
}
