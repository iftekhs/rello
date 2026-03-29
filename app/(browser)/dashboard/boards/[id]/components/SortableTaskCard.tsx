'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './TaskCard'
import { Card } from '@/components/ui/card'

interface SortableTaskCardProps {
  taskId: string
  listId: string
  isBeingDragged?: boolean
}

export function SortableTaskCard({ taskId, listId, isBeingDragged = false }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useSortable({
    id: taskId,
    data: {
      type: 'task',
      listId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
  }

  if (isBeingDragged) {
    return (
      <div ref={setNodeRef} style={style}>
        <Card className="bg-muted/50 border-dashed border-2 border-muted-foreground/20 h-16" />
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard taskId={taskId} listId={listId} />
    </div>
  )
}
