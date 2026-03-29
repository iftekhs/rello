import { create } from 'zustand'

interface PendingOpsState {
  pendingOps: Set<string>
  registerOp: (key: string) => void
  clearOp: (key: string) => void
  isPending: (key: string) => boolean
}

export const usePendingOpsStore = create<PendingOpsState>()((set, get) => ({
  pendingOps: new Set<string>(),

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
}))
