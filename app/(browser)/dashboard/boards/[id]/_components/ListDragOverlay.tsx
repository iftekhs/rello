'use client'

import { useBoardStore } from '@/store/useBoardStore'
import { Card } from '@/components/ui/card'

interface ListDragOverlayProps {
  listId: string
}

export function ListDragOverlay({ listId }: ListDragOverlayProps) {
  const list = useBoardStore((s) => s.lists.find((l) => l.id === listId))

  if (!list) return null

  return (
    <Card className="w-72 p-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold truncate">{list.title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {list.tasks.length} task{list.tasks.length !== 1 ? 's' : ''}
        </span>
      </div>
    </Card>
  )
}
