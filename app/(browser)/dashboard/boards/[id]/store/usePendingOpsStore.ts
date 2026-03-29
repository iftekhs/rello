import { create } from 'zustand'

interface PendingOpsState {
  pendingOps: Map<string, number>
  awaitingEcho: Map<string, number>
  localVersions: Map<string, number>

  registerOp: (key: string) => void
  clearOp: (key: string) => void
  confirmEcho: (key: string) => void
  isPending: (key: string) => boolean
  bumpVersion: (entityKey: string) => number
  getVersion: (entityKey: string) => number
}

export const usePendingOpsStore = create<PendingOpsState>()((set, get) => ({
  pendingOps: new Map<string, number>(),
  awaitingEcho: new Map<string, number>(),
  localVersions: new Map<string, number>(),

  registerOp: (key: string) =>
    set((state) => {
      const newMap = new Map(state.pendingOps)
      newMap.set(key, Date.now())
      return { pendingOps: newMap }
    }),

  clearOp: (key: string) =>
    set((state) => {
      const newPending = new Map(state.pendingOps)
      const timestamp = newPending.get(key)
      newPending.delete(key)

      if (timestamp !== undefined) {
        const newAwaiting = new Map(state.awaitingEcho)
        newAwaiting.set(key, timestamp)
        return { pendingOps: newPending, awaitingEcho: newAwaiting }
      }
      return { pendingOps: newPending }
    }),

  confirmEcho: (key: string) =>
    set((state) => {
      const newAwaiting = new Map(state.awaitingEcho)
      newAwaiting.delete(key)

      const entityKey = key.replace(/^(list|task):(insert|update|delete):/, '$1:')
      const newVersions = new Map(state.localVersions)
      newVersions.delete(entityKey)

      return { awaitingEcho: newAwaiting, localVersions: newVersions }
    }),

  isPending: (key: string) => {
    const state = get()
    return state.pendingOps.has(key) || state.awaitingEcho.has(key)
  },

  bumpVersion: (entityKey: string) => {
    let newVersion = 1
    set((state) => {
      const newMap = new Map(state.localVersions)
      const current = newMap.get(entityKey) ?? 0
      newVersion = current + 1
      newMap.set(entityKey, newVersion)
      return { localVersions: newMap }
    })
    return newVersion
  },

  getVersion: (entityKey: string) => {
    return get().localVersions.get(entityKey) ?? 0
  },
}))

if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const state = usePendingOpsStore.getState()
    const newAwaiting = new Map(state.awaitingEcho)

    for (const [key, timestamp] of newAwaiting) {
      if (now - timestamp > 8000) {
        newAwaiting.delete(key)

        const entityKey = key.replace(/^(list|task):(insert|update|delete):/, '$1:')
        const newVersions = new Map(state.localVersions)
        newVersions.delete(entityKey)

        usePendingOpsStore.setState({
          awaitingEcho: newAwaiting,
          localVersions: newVersions
        })
      }
    }
  }, 10000)
}
