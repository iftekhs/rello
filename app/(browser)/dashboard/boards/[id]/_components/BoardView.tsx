'use client'

import { useEffect, useState, useMemo } from 'react'
import { useBoardStore } from '@/store/useBoardStore'
import { Board, List, BoardVisibility } from '@/types'
import { useRealtimeSync } from '../_hooks/useRealtimeSync'
import { DragDropBoard } from './DragDropBoard'
import { AddListForm } from './AddListForm'
import { RealtimeIndicator } from './RealtimeIndicator'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Share01Icon, LockIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'

interface BoardViewProps {
  initialBoard: Board
  initialLists: List[]
  isOwner: boolean
}

export function BoardView({ initialBoard, initialLists, isOwner }: BoardViewProps) {
  const board = useBoardStore((s) => s.board)
  const setInitialData = useBoardStore((s) => s.setInitialData)
  const boardId = useBoardStore((s) => s.board?.id ?? '')
  const { status } = useRealtimeSync(boardId)
  const [copied, setCopied] = useState(false)

  const isReadOnly = useMemo(
    () => !isOwner && board?.visibility === 'public_readonly',
    [board?.visibility, isOwner]
  )

  useEffect(() => {
    setInitialData(initialBoard, initialLists)
  }, [initialBoard, initialLists, setInitialData])

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold">{board.title}</h1>
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              <HugeiconsIcon icon={LockIcon} className="h-3 w-3" />
              Read-only
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <HugeiconsIcon icon={Share01Icon} className="mr-2" />
            {copied ? 'Copied!' : 'Share'}
          </Button>
          <RealtimeIndicator status={status} />
        </div>
      </header>
      <div className="flex items-start flex-row gap-3 overflow-x-auto px-4 pb-4 pt-2">
        <DragDropBoard readOnly={isReadOnly} />
        {!isReadOnly && <AddListForm />}
      </div>
    </div>
  ) 
}
