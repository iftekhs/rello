'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBoardStore } from '@/store/useBoardStore'
import { usePendingOpsStore } from '@/store/usePendingOpsStore'
import { List, Task } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

type RealtimeStatus = 'connected' | 'connecting' | 'disconnected'

export function useRealtimeSync(boardId: string) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting')

  useEffect(() => {
    if (!boardId) return
    let isActive = true

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
          if (!isActive) return
          console.log('[Realtime] LIST INSERT:', payload.new)
          const key = `list:insert:${payload.new.id}`
          const { isPending, confirmEcho } = usePendingOpsStore.getState()
          
          if (isPending(key)) {
            confirmEcho(key)
            return
          }
          
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
          if (!isActive) return
          console.log('[Realtime] LIST UPDATE:', payload.new)
          const key = `list:update:${payload.new.id}`
          const entityKey = `list:${payload.new.id}`
          const { isPending, confirmEcho, getVersion, getLocalUpdatedAt, consumeEchoSequence } = usePendingOpsStore.getState()
          
          if (isPending(key)) {
            confirmEcho(key)
            return
          }
          
          const localVersion = getVersion(entityKey)
          const incomingTs = new Date(payload.new.updated_at).getTime()
          const localUpdatedAt = getLocalUpdatedAt(entityKey)
          
          if (localVersion > 0 && localUpdatedAt) {
            if (incomingTs <= localUpdatedAt) {
              consumeEchoSequence(entityKey, incomingTs)
              return
            }
            const updatedList: List = {
              ...payload.new as List,
              position: useBoardStore.getState().lists.find(l => l.id === payload.new.id)?.position ?? payload.new.position
            }
            useBoardStore.getState().updateList(updatedList)
            return
          }
          
          const updatedList: List = payload.new as List
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
          if (!isActive) return
          console.log('[Realtime] LIST DELETE:', payload.old)
          const key = `list:delete:${payload.old.id}`
          const { isPending, confirmEcho } = usePendingOpsStore.getState()
          
          if (isPending(key)) {
            confirmEcho(key)
            return
          }
          
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
          if (!isActive) return
          console.log('[Realtime] TASK INSERT:', payload.new)
          const key = `task:insert:${payload.new.id}`
          const { isPending, confirmEcho } = usePendingOpsStore.getState()
          
          if (isPending(key)) {
            confirmEcho(key)
            return
          }
          
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
          if (!isActive) return
          console.log('[Realtime] TASK UPDATE:', payload.new)
          const key = `task:update:${payload.new.id}`
          const entityKey = `task:${payload.new.id}`
          const { isPending, confirmEcho, getVersion, getLocalUpdatedAt, consumeEchoSequence } = usePendingOpsStore.getState()
          
          if (isPending(key)) {
            confirmEcho(key)
            return
          }
          
          const localVersion = getVersion(entityKey)
          const incomingTs = new Date(payload.new.updated_at).getTime()
          const localUpdatedAt = getLocalUpdatedAt(entityKey)
          
          if (localVersion > 0 && localUpdatedAt) {
            if (incomingTs <= localUpdatedAt) {
              consumeEchoSequence(entityKey, incomingTs)
              return
            }
            const existingTask = useBoardStore.getState().lists
              .flatMap(l => l.tasks)
              .find(t => t.id === payload.new.id)
            if (existingTask) {
              const contentOnlyTask: Task = {
                ...existingTask,
                title: payload.new.title,
                description: payload.new.description,
                updated_at: payload.new.updated_at
              }
              useBoardStore.getState().handleRealtimeTaskUpdate(contentOnlyTask)
              return
            }
          }
          
          const updatedTask: Task = payload.new as Task
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
          if (!isActive) return
          console.log('[Realtime] TASK DELETE:', payload.old)
          const key = `task:delete:${payload.old.id}`
          const { isPending, confirmEcho } = usePendingOpsStore.getState()
          
          if (isPending(key)) {
            confirmEcho(key)
            return
          }
          
          const lists = useBoardStore.getState().lists
          const listId = lists.find((l) => l.tasks.some((t) => t.id === payload.old.id))?.id
          if (listId) {
            useBoardStore.getState().deleteTask(payload.old.id as string, listId)
          }
        }
      )
      .subscribe((channelStatus) => {
        if (!isActive) return
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
      isActive = false
      console.log('[Realtime] Cleaning up channel')
      supabase.removeChannel(channel)
    }
  }, [boardId])

  return { status }
}
