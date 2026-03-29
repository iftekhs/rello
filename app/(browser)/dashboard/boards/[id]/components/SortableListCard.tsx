'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ListCard } from './ListCard'
import { useDrag } from './DragContext'

interface SortableListCardProps {
  listId: string
}

export function SortableListCard({ listId }: SortableListCardProps) {
  const { hoveredListId, activeItem } = useDrag()

  const isHovered = hoveredListId === listId && activeItem?.type === 'task'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: listId,
    data: {
      type: 'list',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ListCard listId={listId} isActive={isHovered} />
    </div>
  )
}
