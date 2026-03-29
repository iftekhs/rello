import { SupabaseClient } from '@supabase/supabase-js';
import { BoardVisibility } from '@/types';

export interface Board {
  id: string;
  user_id: string;
  visibility: BoardVisibility;
}

export async function getAuthorizedBoard(
  supabase: SupabaseClient,
  boardId: string,
  userId: string,
  requireOwner: boolean = false
): Promise<Board> {
  const { data: board, error } = await supabase
    .from('boards')
    .select('id, user_id, visibility')
    .eq('id', boardId)
    .single();

  if (error || !board) {
    throw new Error('Board not found');
  }

  const isOwner = board.user_id === userId;
  const canWrite = isOwner || board.visibility === 'public_readwrite';

  if (requireOwner) {
    if (!isOwner) {
      throw new Error('Unauthorized');
    }
  } else {
    if (!canWrite) {
      throw new Error('Unauthorized');
    }
  }

  return board as Board;
}
