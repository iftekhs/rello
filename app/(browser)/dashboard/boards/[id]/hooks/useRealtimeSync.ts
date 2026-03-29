'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBoardStore, List, Task } from '../store/useBoardStore'
import { usePendingOpsStore } from '../store/usePendingOpsStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

type RealtimeStatus = 'connected' | 'connecting' | 'disconnected'

export function useRealtimeSync(boardId: string) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting')

  useEffect(() => {
    if (!boardId) return

    console.log('[Realtime] Setting up channel for board:', boardId)

    const supabase = createClient()

    const channel: RealtimeChannel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lists',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('[Realtime] LIST INSERT:', payload.new)
          const key = `list:insert:${payload.new.id}`
          if (usePendingOpsStore.getState().isPending(key)) return
          if (usePendingOpsStore.getState().isRecent(`list:${payload.new.id}`)) return
          
          const newList: List = { ...payload.new as List, tasks: [] }
          useBoardStore.getState().addList(newList)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lists',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('[Realtime] LIST UPDATE:', payload.new)
          const key = `list:update:${payload.new.id}`
          if (usePendingOpsStore.getState().isPending(key)) return
          if (usePendingOpsStore.getState().isRecent(`list:${payload.new.id}`)) return
          
          const updatedList: List = payload.new as List
          const lists = useBoardStore.getState().lists
          const existingList = lists.find((l) => l.id === updatedList.id)
          
          if (existingList &&
              existingList.id === updatedList.id &&
              existingList.title === updatedList.title &&
              existingList.position === updatedList.position) {
            return
          }
          
          useBoardStore.getState().updateList(updatedList)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lists',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('[Realtime] LIST DELETE:', payload.old)
          const key = `list:delete:${payload.old.id}`
          if (usePendingOpsStore.getState().isPending(key)) return
          if (usePendingOpsStore.getState().isRecent(`list:${payload.old.id}`)) return
          
          useBoardStore.getState().deleteList(payload.old.id as string)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('[Realtime] TASK INSERT:', payload.new)
          const key = `task:insert:${payload.new.id}`
          if (usePendingOpsStore.getState().isPending(key)) return
          if (usePendingOpsStore.getState().isRecent(`task:${payload.new.id}`)) return
          
          const newTask: Task = payload.new as Task
          const lists = useBoardStore.getState().lists
          const existingTask = lists
            .flatMap((l) => l.tasks)
            .find((t) => t.id === newTask.id)
          if (existingTask) return
          
          useBoardStore.getState().handleRealtimeTaskUpdate(newTask)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('[Realtime] TASK UPDATE:', payload.new)
          const key = `task:update:${payload.new.id}`
          if (usePendingOpsStore.getState().isPending(key)) return
          if (usePendingOpsStore.getState().isRecent(`task:${payload.new.id}`)) return
          
          const updatedTask: Task = payload.new as Task
          const lists = useBoardStore.getState().lists
          const existingTask = lists
            .flatMap((l) => l.tasks)
            .find((t) => t.id === updatedTask.id)
          
          if (existingTask && 
              existingTask.id === updatedTask.id &&
              existingTask.title === updatedTask.title &&
              existingTask.description === updatedTask.description &&
              existingTask.position === updatedTask.position &&
              existingTask.list_id === updatedTask.list_id) {
            return
          }
          
          useBoardStore.getState().handleRealtimeTaskUpdate(updatedTask)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('[Realtime] TASK DELETE:', payload.old)
          const key = `task:delete:${payload.old.id}`
          if (usePendingOpsStore.getState().isPending(key)) return
          if (usePendingOpsStore.getState().isRecent(`task:${payload.old.id}`)) return
          
          const lists = useBoardStore.getState().lists
          const listId = lists.find((l) => l.tasks.some((t) => t.id === payload.old.id))?.id
          if (listId) {
            useBoardStore.getState().deleteTask(payload.old.id as string, listId)
          }
        }
      )
      .subscribe((channelStatus) => {
        console.log('[Realtime] Channel status:', channelStatus)
        if (channelStatus === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
          setStatus('disconnected')
        } else {
          setStatus('connecting')
        }
      })

    return () => {
      console.log('[Realtime] Cleaning up channel')
      supabase.removeChannel(channel)
    }
  }, [boardId])

  return { status }
}
