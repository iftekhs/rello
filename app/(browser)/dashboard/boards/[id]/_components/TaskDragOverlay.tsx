'use client'

import { useBoardStore } from '@/store/useBoardStore'
import { Card } from '@/components/ui/card'

interface TaskDragOverlayProps {
  taskId: string
  listId: string
}

export function TaskDragOverlay({ taskId, listId }: TaskDragOverlayProps) {
  const task = useBoardStore((s) =>
    s.lists.find((l) => l.id === listId)?.tasks.find((t) => t.id === taskId)
  )

  if (!task) return null

  return (
    <Card className="p-2 bg-card">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{task.title}</p>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
