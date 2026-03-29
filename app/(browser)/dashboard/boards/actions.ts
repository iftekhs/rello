'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createBoard(title: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({ title: title.trim(), user_id: user.id })
    .select()
    .single();

  if (boardError || !board) {
    throw new Error('Failed to create board');
  }

  const defaultLists = [
    { title: 'To Do', position: 0 },
    { title: 'In Progress', position: 1 },
    { title: 'Done', position: 2 },
  ];

  const { error: listsError } = await supabase.from('lists').insert(
    defaultLists.map((list) => ({
      board_id: board.id,
      title: list.title,
      position: list.position,
    }))
  );

  if (listsError) {
    throw new Error('Failed to create default lists');
  }

  revalidatePath('/dashboard/boards');
}

export async function updateBoard(boardId: string, title: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('boards')
    .update({ title: title.trim() })
    .eq('id', boardId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error('Failed to update board');
  }

  revalidatePath('/dashboard/boards');
}

export async function deleteBoard(boardId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error('Failed to delete board');
  }

  revalidatePath('/dashboard/boards');
}
