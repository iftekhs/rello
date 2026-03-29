'use client'

import { useEffect } from 'react'
import { useBoardStore, Board, List } from '../store/useBoardStore'
import { DragDropBoard } from './DragDropBoard'
import { AddListForm } from './AddListForm'

interface BoardViewProps {
  initialBoard: Board
  initialLists: List[]
}

export function BoardView({ initialBoard, initialLists }: BoardViewProps) {
  const board = useBoardStore((s) => s.board)
  const setInitialData = useBoardStore((s) => s.setInitialData)

  useEffect(() => {
    setInitialData(initialBoard, initialLists)
  }, [initialBoard, initialLists, setInitialData])

  if (!board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center px-4 py-3">
        <h1 className="text-xl font-bold">{board.title}</h1>
      </header>
      <div className="flex items-start flex-row gap-3 overflow-x-auto px-4 pb-4 pt-2">
        <DragDropBoard />
        <AddListForm />
      </div>
    </div>
  )
}
