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
import { useBoardStore } from '../store/useBoardStore'
import { usePendingOpsStore } from '../store/usePendingOpsStore'
import { reorderLists as reorderListsAction } from '../actions'
import { reorderTasksInList as reorderTasksInListAction } from '../actions'
import { moveTaskToList } from '../actions'
import { toast } from 'sonner'
import { SortableListCard } from './SortableListCard'
import { ListDragOverlay } from './ListDragOverlay'
import { TaskDragOverlay } from './TaskDragOverlay'
import { DragProvider, useDrag } from './DragContext'

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

        // Mark as recent BEFORE updating local state
        newLists.forEach((l) => usePendingOpsStore.getState().addRecent(`list:${l.id}`))
        
        reorderLists(newLists)

        startTransition(async () => {
          try {
            await reorderListsAction(newLists.map((l) => ({ id: l.id, position: l.position })))
          } catch (error) {
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
          const previousTasks = [...list.tasks]
          const newTasks = arrayMove(list.tasks, oldIndex, newIndex).map((t, i) => ({
            ...t,
            position: i,
          }))

          newTasks.forEach((t) => usePendingOpsStore.getState().addRecent(`task:${t.id}`))
          reorderTasksInList(activeListId, newTasks)

          startTransition(async () => {
            try {
              await reorderTasksInListAction(
                newTasks.map((t) => ({ id: t.id, position: t.position })),
                activeListId
              )
            } catch (error) {
              reorderTasksInList(activeListId, previousTasks)
              toast.error(error instanceof Error ? error.message : 'Failed to save changes')
            }
          })
        }
      } else {
        const toList = lists.find((l) => l.id === overListId)
        if (!toList) return

        const toIndex = overData?.type === 'task'
          ? toList.tasks.findIndex((t) => t.id === overId)
          : toList.tasks.length

        usePendingOpsStore.getState().addRecent(`task:${activeTaskId}`)
        moveTask(activeTaskId, activeListId, overListId, toIndex)

        startTransition(async () => {
          try {
            await moveTaskToList(activeTaskId, overListId, toIndex, [], activeListId)
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save changes')
          }
        })
      }
    }
  }, [lists, setActiveItem, setHoveredListId, setDropIndex, reorderLists, reorderTasksInList, moveTask, startTransition])

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
