import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'

export type Board = {
  id: string
  title: string
  user_id: string
  created_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  list_id: string
  board_id: string
  position: number
  created_at: string
  updated_at: string
}

export type List = {
  id: string
  title: string
  board_id: string
  position: number
  created_at: string
  tasks: Task[]
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
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  deleteTask: (taskId: string, listId: string) => void
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

      addTask: (task) =>
        set((state) => {
          const list = state.lists.find((l) => l.id === task.list_id)
          if (list) {
            list.tasks.push(task)
          }
        }),

      updateTask: (task) =>
        set((state) => {
          const list = state.lists.find((l) => l.id === task.list_id)
          if (list) {
            const index = list.tasks.findIndex((t) => t.id === task.id)
            if (index !== -1) {
              list.tasks[index] = task
            }
          }
        }),

      deleteTask: (taskId, listId) =>
        set((state) => {
          const list = state.lists.find((l) => l.id === listId)
          if (list) {
            list.tasks = list.tasks.filter((t) => t.id !== taskId)
          }
        }),
    })),
    { name: 'BoardStore' }
  )
)
