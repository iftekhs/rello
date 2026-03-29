import { List, Task } from '@/types'

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
