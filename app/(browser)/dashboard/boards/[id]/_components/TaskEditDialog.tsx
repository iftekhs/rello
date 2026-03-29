'use client'

import { useState, useTransition } from 'react'
import { useBoardStore, Task } from '@/store/useBoardStore'
import { usePendingOpsStore } from '@/store/usePendingOpsStore'
import { updateTask as updateTaskAction } from '../actions'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading04Icon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface TaskEditDialogProps {
  task: Task
  isOpen: boolean
  onClose: () => void
}

export function TaskEditDialog({ task, isOpen, onClose }: TaskEditDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [isPending, startTransition] = useTransition()
  const updateTaskInStore = useBoardStore((s) => s.updateTask)
  const { registerOp, clearOp, confirmEcho, bumpVersion, setLocalUpdatedAt, registerEchoSequence } = usePendingOpsStore()

  const handleSave = () => {
    if (!title.trim()) return

    const previousTask = { ...task }
    const updatedTask: Task = {
      ...task,
      title: title.trim(),
      description: description.trim() || null,
    }

    updateTaskInStore(updatedTask)
    onClose()

    const seq = bumpVersion(`task:${task.id}`)
    setLocalUpdatedAt(`task:${task.id}`, Date.now())
    registerOp(`task:update:${task.id}`)

    startTransition(async () => {
      try {
        await updateTaskAction(task.id, title.trim(), description.trim() || null)
        registerEchoSequence(`task:${task.id}`, seq)
        clearOp(`task:update:${task.id}`)
      } catch (error) {
        confirmEcho(`task:update:${task.id}`)
        updateTaskInStore(previousTask)
        toast.error(
          error instanceof Error ? error.message : 'Failed to update task'
        )
      }
    })
  }

  const handleCancel = () => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
              required
            />
          </div>
          <div className="grid gap-2">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !title.trim()}>
            {isPending ? (
              <HugeiconsIcon icon={Loading04Icon} className="h-4 w-4 animate-spin" />
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
