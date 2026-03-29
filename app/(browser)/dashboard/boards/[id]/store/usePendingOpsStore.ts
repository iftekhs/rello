import { create } from 'zustand'

interface PendingOpsState {
  pendingOps: Set<string>
  recentIds: Set<string>
  registerOp: (key: string) => void
  clearOp: (key: string) => void
  isPending: (key: string) => boolean
  addRecent: (id: string) => void
  isRecent: (id: string) => boolean
}

export const usePendingOpsStore = create<PendingOpsState>()((set, get) => ({
  pendingOps: new Set<string>(),
  recentIds: new Set<string>(),

  registerOp: (key: string) =>
    set((state) => {
      const newSet = new Set(state.pendingOps)
      newSet.add(key)
      return { pendingOps: newSet }
    }),

  clearOp: (key: string) =>
    set((state) => {
      const newSet = new Set(state.pendingOps)
      newSet.delete(key)
      return { pendingOps: newSet }
    }),

  isPending: (key: string) => get().pendingOps.has(key),

  addRecent: (id: string) => {
    set((state) => {
      const newSet = new Set(state.recentIds)
      newSet.add(id)
      return { recentIds: newSet }
    })
    setTimeout(() => {
      set((state) => {
        const newSet = new Set(state.recentIds)
        newSet.delete(id)
        return { recentIds: newSet }
      })
    }, 2000)
  },

  isRecent: (id: string) => get().recentIds.has(id),
}))
