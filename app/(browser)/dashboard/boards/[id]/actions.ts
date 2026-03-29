'use server'

import { createClient } from '@/lib/supabase/server'
import { List, Task } from '@/store/useBoardStore'

async function verifyBoardAccess(boardId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: board, error } = await supabase
    .from('boards')
    .select('id, user_id, visibility')
    .eq('id', boardId)
    .single()

  if (error || !board) {
    throw new Error('Board not found')
  }

  const isOwner = board.user_id === user.id
  const isPublicReadOnly = board.visibility === 'public_readonly'
  const isPublicReadWrite = board.visibility === 'public_readwrite'

  if (!isOwner && !isPublicReadOnly && !isPublicReadWrite) {
    throw new Error('Unauthorized')
  }

  return { userId: user.id, isOwner, isPublicReadOnly, isPublicReadWrite }
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
    .select('id, boards!inner(user_id, visibility)')
    .eq('id', listId)
    .single()

  if (error || !list) {
    throw new Error('List not found')
  }

  const board = list.boards as unknown as { user_id: string; visibility: string }
  const isOwner = board.user_id === user.id
  const isPublicReadOnly = board.visibility === 'public_readonly'
  const isPublicReadWrite = board.visibility === 'public_readwrite'

  if (!isOwner && !isPublicReadOnly && !isPublicReadWrite) {
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
    .select('id, boards!inner(user_id, visibility)')
    .eq('id', taskId)
    .single()

  if (error || !task) {
    throw new Error('Task not found')
  }

  const board = task.boards as unknown as { user_id: string; visibility: string }
  const isOwner = board.user_id === user.id
  const isPublicReadOnly = board.visibility === 'public_readonly'
  const isPublicReadWrite = board.visibility === 'public_readwrite'

  if (!isOwner && !isPublicReadOnly && !isPublicReadWrite) {
    throw new Error('Unauthorized')
  }

  return user.id
}

export async function createList(boardId: string, title: string, position: number): Promise<List> {
  await verifyBoardAccess(boardId)

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
  await verifyBoardAccess(boardId)

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

export async function reorderLists(listUpdates: { id: string; position: number }[]): Promise<void> {
  if (listUpdates.length === 0) return

  const supabase = await createClient()

  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('board_id')
    .eq('id', listUpdates[0].id)
    .single()

  if (listError || !list) {
    throw new Error('Board not found')
  }

  await verifyBoardAccess(list.board_id)

  await Promise.all(
    listUpdates.map((item) =>
      supabase
        .from('lists')
        .update({ position: item.position })
        .eq('id', item.id)
    )
  )
}

export async function reorderTasksInList(
  taskUpdates: { id: string; position: number }[],
  listId: string
): Promise<void> {
  if (taskUpdates.length === 0) return

  await verifyListOwnership(listId)

  const supabase = await createClient()

  await Promise.all(
    taskUpdates.map((item) =>
      supabase
        .from('tasks')
        .update({ position: item.position })
        .eq('id', item.id)
    )
  )
}

export async function moveTaskToList(
  taskId: string,
  newListId: string,
  newPosition: number,
  siblingUpdates: { id: string; position: number }[],
  fromListId: string
): Promise<void> {
  await verifyTaskOwnership(taskId)

  const supabase = await createClient()

  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('id, list_id, position')
    .eq('id', taskId)
    .single()

  if (taskError || !taskData) {
    throw new Error('Task not found')
  }

  const currentListId = taskData.list_id

  const { data: tasksInSourceList } = await supabase
    .from('tasks')
    .select('id, position')
    .eq('list_id', currentListId)
    .order('position', { ascending: true })

  const { data: tasksInTargetList } = await supabase
    .from('tasks')
    .select('id, position')
    .eq('list_id', newListId)
    .order('position', { ascending: true })

  if (!tasksInSourceList || !tasksInTargetList) {
    throw new Error('Failed to fetch tasks')
  }

  const filteredSource = tasksInSourceList.filter((t) => t.id !== taskId)

  let insertPosition = newPosition
  if (insertPosition < 0) {
    insertPosition = tasksInTargetList.length
  } else if (insertPosition > tasksInTargetList.length) {
    insertPosition = tasksInTargetList.length
  }

  const allTargetTasks = [...tasksInTargetList]
  allTargetTasks.splice(insertPosition, 0, { id: taskId, position: insertPosition })

  const sourceUpdates = filteredSource.map((t, i) => ({
    id: t.id,
    position: i,
  }))

  const targetUpdates = allTargetTasks.map((t, i) => ({
    id: t.id,
    position: i,
  }))

  const { error: moveError } = await supabase
    .from('tasks')
    .update({ list_id: newListId, position: insertPosition })
    .eq('id', taskId)

  if (moveError) {
    throw new Error(`Failed to move task: ${moveError.message}`)
  }

  if (sourceUpdates.length > 0) {
    for (const update of sourceUpdates) {
      const { error } = await supabase
        .from('tasks')
        .update({ position: update.position })
        .eq('id', update.id)
      if (error) {
        throw new Error(`Failed to update source positions: ${error.message}`)
      }
    }
  }

  if (targetUpdates.length > 0) {
    for (const update of targetUpdates) {
      const { error } = await supabase
        .from('tasks')
        .update({ position: update.position })
        .eq('id', update.id)
      if (error) {
        throw new Error(`Failed to update target positions: ${error.message}`)
      }
    }
  }
}
