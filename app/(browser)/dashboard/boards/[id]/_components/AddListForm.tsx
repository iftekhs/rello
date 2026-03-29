'use client'

import { useState, useTransition } from 'react'
import { useBoardStore } from '@/store/useBoardStore'
import { usePendingOpsStore } from '@/store/usePendingOpsStore'
import { createList } from '../actions'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AddListForm() {
  const lists = useBoardStore((s) => s.lists)
  const addList = useBoardStore((s) => s.addList)
  const deleteList = useBoardStore((s) => s.deleteList)
  const board = useBoardStore((s) => s.board)
  const { registerOp, clearOp, bumpVersion, setLocalUpdatedAt, registerEchoSequence, confirmEcho } = usePendingOpsStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!title.trim() || !board) return

    const position = lists.length
    const tempId = crypto.randomUUID()
    const optimisticList = {
      id: tempId,
      title: title.trim(),
      board_id: board.id,
      position,
      created_at: new Date().toISOString(),
      tasks: [],
    }

    addList(optimisticList)
    setTitle('')
    setIsExpanded(false)

    const listEntityKey = `list:${tempId}`
    const seq = bumpVersion(listEntityKey)
    setLocalUpdatedAt(listEntityKey, Date.now())
    registerOp(`list:insert:${tempId}`)

    startTransition(async () => {
      try {
        const newList = await createList(board.id, title.trim(), position)
        deleteList(tempId)
        addList(newList)
        registerEchoSequence(`list:${newList.id}`, seq)
        clearOp(`list:insert:${tempId}`)
      } catch (error) {
        deleteList(tempId)
        confirmEcho(`list:insert:${tempId}`)
        toast.error(
          error instanceof Error ? error.message : 'Failed to create list'
        )
      }
    })
  }

  const handleCancel = () => {
    setTitle('')
    setIsExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(true)}
        className="flex h-auto w-72 shrink-0 justify-start gap-2 px-3 py-2"
      >
        <HugeiconsIcon icon={Add01Icon} />
        <span>Add a list</span>
      </Button>
    )
  }

  return (
    <div className="w-72 shrink-0 rounded-lg border bg-card p-3 shadow-sm">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter list title..."
        autoFocus
        className="mb-3"
      />
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !title.trim()}
          size="sm"
        >
          {isPending ? 'Adding...' : 'Add list'}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          <HugeiconsIcon icon={Cancel01Icon} />
        </Button>
      </div>
    </div>
  )
}
