'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ListCard } from './ListCard'
import { useDrag } from './DragContext'

interface SortableListCardProps {
  listId: string
  readOnly?: boolean
}

export function SortableListCard({ listId, readOnly }: SortableListCardProps) {
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
    disabled: readOnly,
    data: {
      type: 'list',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ListCard 
        listId={listId} 
        isActive={isHovered}
        readOnly={readOnly}
        dragHandleProps={readOnly ? undefined : { ...attributes, ...listeners }}
      />
    </div>
  )
}
