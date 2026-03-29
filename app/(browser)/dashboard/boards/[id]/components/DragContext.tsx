'use client'

import { createContext, useContext, useState, useRef, ReactNode } from 'react'

interface DragContextValue {
  activeItem: { type: 'list'; id: string } | { type: 'task'; id: string; listId: string } | null
  setActiveItem: (item: { type: 'list'; id: string } | { type: 'task'; id: string; listId: string } | null) => void
  hoveredListId: string | null
  setHoveredListId: (id: string | null) => void
  dropIndex: number | null
  setDropIndex: (index: number | null) => void
}

const DragContext = createContext<DragContextValue | null>(null)

export function DragProvider({ children }: { children: ReactNode }) {
  const [activeItem, setActiveItemState] = useState<DragContextValue['activeItem']>(null)
  const [hoveredListId, setHoveredListId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const activeItemRef = useRef<DragContextValue['activeItem']>(null)

  const setActiveItem = (item: DragContextValue['activeItem']) => {
    activeItemRef.current = item
    setActiveItemState(item)
  }

  return (
    <DragContext.Provider value={{ activeItem, setActiveItem, hoveredListId, setHoveredListId, dropIndex, setDropIndex }}>
      {children}
    </DragContext.Provider>
  )
}

export function useDrag() {
  const context = useContext(DragContext)
  if (!context) {
    throw new Error('useDrag must be used within DragProvider')
  }
  return context
}
