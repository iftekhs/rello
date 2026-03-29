import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'

export type Board = {
  id: string
  title: string
  user_id: string
  created_at: string
}

export type List = {
  id: string
  title: string
  board_id: string
  position: number
  created_at: string
}

type BoardState = {
  board: Board | null
  lists: List[]
}

type BoardActions = {
  setInitialData: (board: Board, lists: List[]) => void
  addList: (list: List) => void
  updateList: (list: List) => void
  deleteList: (listId: string) => void
  reorderLists: (lists: List[]) => void
}

export const useBoardStore = create<BoardState & BoardActions>()(
  devtools(
    immer((set) => ({
      board: null,
      lists: [],

      setInitialData: (board, lists) =>
        set((state) => {
          state.board = board
          state.lists = lists
        }),

      addList: (list) =>
        set((state) => {
          state.lists.push(list)
        }),

      updateList: (list) =>
        set((state) => {
          const index = state.lists.findIndex((l) => l.id === list.id)
          if (index !== -1) {
            state.lists[index] = list
          }
        }),

      deleteList: (listId) =>
        set((state) => {
          state.lists = state.lists.filter((l) => l.id !== listId)
        }),

      reorderLists: (lists) =>
        set((state) => {
          state.lists = lists
        }),
    })),
    { name: 'BoardStore' }
  )
)
