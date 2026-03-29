'use client'

import { useTransition, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useBoardStore } from '@/store/useBoardStore'
import { usePendingOpsStore } from '@/store/usePendingOpsStore'
import { reorderLists as reorderListsAction } from '../actions'
import { reorderTasksInList as reorderTasksInListAction } from '../actions'
import { moveTaskToList } from '../actions'
import { toast } from 'sonner'
import { SortableListCard } from './SortableListCard'
import { ListDragOverlay } from './ListDragOverlay'
import { TaskDragOverlay } from './TaskDragOverlay'
import { DragProvider, useDrag } from './DragContext'
import { debounce } from '@/lib/utils'

function DragDropBoardInner() {
  const lists = useBoardStore((s) => s.lists)
  const reorderLists = useBoardStore((s) => s.reorderLists)
  const moveTask = useBoardStore((s) => s.moveTask)
  const reorderTasksInList = useBoardStore((s) => s.reorderTasksInList)
  const { activeItem, setActiveItem, setHoveredListId, setDropIndex } = useDrag()

  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const sortedLists = useMemo(
    () => lists.slice().sort((a, b) => a.position - b.position),
    [lists]
  )

  const { registerOp, clearOp, confirmEcho, bumpVersion, setLocalUpdatedAt, registerEchoSequence } = usePendingOpsStore()

  const debouncedReorderTasks = useMemo(() => {
    const latestSeqs: Map<string, number> = new Map()
    return debounce(async (activeListId: string, newTasks: { id: string; position: number }[], seq: number) => {
      const storedSeq = latestSeqs.get(activeListId) ?? 0
      if (seq < storedSeq) {
        return
      }
      try {
        await reorderTasksInListAction(newTasks, activeListId)
        newTasks.forEach((t) => {
          registerEchoSequence(`task:${t.id}`, seq)
          clearOp(`task:update:${t.id}`)
        })
      } catch (error) {
        newTasks.forEach((t) => confirmEcho(`task:update:${t.id}`))
        toast.error(error instanceof Error ? error.message : 'Failed to save changes')
      }
    }, 300)
  }, [confirmEcho, registerEchoSequence, clearOp])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const activeData = active.data.current

    if (activeData?.type === 'list') {
      setActiveItem({ type: 'list', id: active.id as string })
    } else if (activeData?.type === 'task') {
      setActiveItem({ type: 'task', id: active.id as string, listId: activeData.listId })
    }
  }, [setActiveItem])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    
    if (over) {
      const overData = over.data.current
      if (overData?.type === 'list') {
        setHoveredListId(over.id as string)
        setDropIndex(null)
      } else if (overData?.listId) {
        setHoveredListId(overData.listId)
        const overList = lists.find((l) => l.id === overData.listId)
        if (overList) {
          const overIndex = overList.tasks.findIndex((t) => t.id === over.id)
          setDropIndex(overIndex >= 0 ? overIndex : overList.tasks.length)
        }
      }
    } else {
      setHoveredListId(null)
      setDropIndex(null)
    }
  }, [setHoveredListId, setDropIndex, lists])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)
    setHoveredListId(null)
    setDropIndex(null)

    if (!over) return

    const activeData = active.data.current

    if (activeData?.type === 'list') {
      const oldIndex = lists.findIndex((l) => l.id === active.id)
      const newIndex = lists.findIndex((l) => l.id === over.id)

      if (oldIndex !== newIndex) {
        const previousLists = [...lists]
        const newLists = arrayMove(lists, oldIndex, newIndex).map((l, i) => ({
          ...l,
          position: i,
        }))

        const listSeqs = new Map<string, number>()
        newLists.forEach((l) => {
          const seq = bumpVersion(`list:${l.id}`)
          listSeqs.set(l.id, seq)
          setLocalUpdatedAt(`list:${l.id}`, Date.now())
          registerOp(`list:update:${l.id}`)
        })
        
        reorderLists(newLists)

        startTransition(async () => {
          try {
            await reorderListsAction(newLists.map((l) => ({ id: l.id, position: l.position })))
            newLists.forEach((l) => {
              const seq = listSeqs.get(l.id) ?? 0
              registerEchoSequence(`list:${l.id}`, seq)
              clearOp(`list:update:${l.id}`)
            })
          } catch (error) {
            newLists.forEach((l) => confirmEcho(`list:update:${l.id}`))
            reorderLists(previousLists)
            toast.error(error instanceof Error ? error.message : 'Failed to save changes')
          }
        })
      }
    } else if (activeData?.type === 'task') {
      const activeTaskId = active.id as string
      const activeListId = activeData.listId
      const overId = over.id as string
      const overData = over.data.current
      const overListId = overData?.listId ?? overId

      if (activeListId === overListId) {
        const list = lists.find((l) => l.id === activeListId)
        if (!list) return

        const oldIndex = list.tasks.findIndex((t) => t.id === activeTaskId)
        const newIndex = list.tasks.findIndex((t) => t.id === overId)

        if (oldIndex !== newIndex && newIndex >= 0) {
          const newTasks = arrayMove(list.tasks, oldIndex, newIndex).map((t, i) => ({
            ...t,
            position: i,
          }))

          const seq = bumpVersion(`task:${activeTaskId}`)
          setLocalUpdatedAt(`task:${activeTaskId}`, Date.now())
          newTasks.forEach((t) => {
            registerOp(`task:update:${t.id}`)
          })
          reorderTasksInList(activeListId, newTasks)

          debouncedReorderTasks(activeListId, newTasks.map((t) => ({ id: t.id, position: t.position })), seq)
        }
      } else {
        const toList = lists.find((l) => l.id === overListId)
        if (!toList) return

        const toIndex = overData?.type === 'task'
          ? toList.tasks.findIndex((t) => t.id === overId)
          : toList.tasks.length

        const seq = bumpVersion(`task:${activeTaskId}`)
        setLocalUpdatedAt(`task:${activeTaskId}`, Date.now())
        registerOp(`task:update:${activeTaskId}`)
        moveTask(activeTaskId, activeListId, overListId, toIndex)

        startTransition(async () => {
          try {
            await moveTaskToList(activeTaskId, overListId, toIndex, [], activeListId)
            registerEchoSequence(`task:${activeTaskId}`, seq)
            clearOp(`task:update:${activeTaskId}`)
          } catch (error) {
            confirmEcho(`task:update:${activeTaskId}`)
            toast.error(error instanceof Error ? error.message : 'Failed to save changes')
          }
        })
      }
    }
  }, [lists, setActiveItem, setHoveredListId, setDropIndex, reorderLists, reorderTasksInList, moveTask, startTransition, registerOp, clearOp, confirmEcho, bumpVersion, debouncedReorderTasks])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedLists.map((l) => l.id)}
        strategy={horizontalListSortingStrategy}
      >
        {sortedLists.map((list) => (
          <SortableListCard key={list.id} listId={list.id} />
        ))}
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeItem?.type === 'list' && <ListDragOverlay listId={activeItem.id} />}
        {activeItem?.type === 'task' && (
          <TaskDragOverlay taskId={activeItem.id} listId={activeItem.listId} />
        )}
      </DragOverlay>
    </DndContext>
  )
}

export function DragDropBoard() {
  return (
    <DragProvider>
      <DragDropBoardInner />
    </DragProvider>
  )
}
