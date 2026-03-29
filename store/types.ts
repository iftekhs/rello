export type Board = {
  id: string
  title: string
  user_id: string
  created_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  list_id: string
  board_id: string
  position: number
  created_at: string
  updated_at: string
}

export type List = {
  id: string
  title: string
  board_id: string
  position: number
  created_at: string
  tasks: Task[]
}

export type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: Partial<T>
  schema: string
  table: string
}

export type SupabaseRealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: Record<string, unknown>
  schema: string
  table: string
}

export type ListPayload = SupabaseRealtimePayload<List>
export type TaskPayload = SupabaseRealtimePayload<Task>
