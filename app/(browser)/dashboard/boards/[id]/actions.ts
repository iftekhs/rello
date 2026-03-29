'use server'

import { createClient } from '@/lib/supabase/server'
import { List, Task } from './store/useBoardStore'

async function verifyBoardOwnership(boardId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: board, error } = await supabase
    .from('boards')
    .select('id')
    .eq('id', boardId)
    .eq('user_id', user.id)
    .single()

  if (error || !board) {
    throw new Error('Unauthorized')
  }

  return user.id
}

async function verifyListOwnership(listId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: list, error } = await supabase
    .from('lists')
    .select('id, boards!inner(user_id)')
    .eq('id', listId)
    .eq('boards.user_id', user.id)
    .single()

  if (error || !list) {
    throw new Error('Unauthorized')
  }

  return user.id
}

async function verifyTaskOwnership(taskId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .select('id, boards!inner(user_id)')
    .eq('id', taskId)
    .eq('boards.user_id', user.id)
    .single()

  if (error || !task) {
    throw new Error('Unauthorized')
  }

  return user.id
}

export async function createList(boardId: string, title: string, position: number): Promise<List> {
  await verifyBoardOwnership(boardId)

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
  await verifyListOwnership(listId)

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
  await verifyListOwnership(listId)

  const supabase = await createClient()

  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId)

  if (error) {
    throw new Error(`Failed to delete list: ${error.message}`)
  }
}

export async function createTask(
  listId: string,
  boardId: string,
  title: string,
  description: string | null,
  position: number
): Promise<Task> {
  await verifyBoardOwnership(boardId)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      list_id: listId,
      board_id: boardId,
      title,
      description,
      position,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  return data as Task
}

export async function updateTask(
  taskId: string,
  title: string,
  description: string | null
): Promise<Task> {
  await verifyTaskOwnership(taskId)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .update({
      title,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }

  return data as Task
}

export async function deleteTask(taskId: string): Promise<void> {
  await verifyTaskOwnership(taskId)

  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`)
  }
}
