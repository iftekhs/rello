'use server'

import { createClient } from '@/lib/supabase/server'
import { List } from './store/useBoardStore'

export async function createList(boardId: string, title: string, position: number): Promise<List> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lists')
    .insert({
      board_id: boardId,
      title,
      position,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create list: ${error.message}`)
  }

  return data as List
}

export async function updateListTitle(listId: string, title: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('lists')
    .update({ title })
    .eq('id', listId)

  if (error) {
    throw new Error(`Failed to update list: ${error.message}`)
  }
}

export async function deleteList(listId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId)

  if (error) {
    throw new Error(`Failed to delete list: ${error.message}`)
  }
}
