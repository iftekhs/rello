import { create } from 'zustand'

interface PendingOpsState {
  pendingOps: Map<string, number>
  awaitingEcho: Map<string, { timestamp: number; seq: number }>
  localVersions: Map<string, number>
  echoSequences: Map<string, number[]>
  localUpdatedAts: Map<string, number>

  registerOp: (key: string) => void
  clearOp: (key: string) => void
  confirmEcho: (key: string) => void
  isPending: (key: string) => boolean
  bumpVersion: (entityKey: string) => number
  getVersion: (entityKey: string) => number
  registerEchoSequence: (entityKey: string, seq: number) => void
  isStaleEcho: (entityKey: string, seq: number) => boolean
  consumeEchoSequence: (entityKey: string, seq: number) => void
  setLocalUpdatedAt: (entityKey: string, ts: number) => void
  getLocalUpdatedAt: (entityKey: string) => number | undefined
}

export const usePendingOpsStore = create<PendingOpsState>()((set, get) => ({
  pendingOps: new Map<string, number>(),
  awaitingEcho: new Map<string, { timestamp: number; seq: number }>(),
  localVersions: new Map<string, number>(),
  echoSequences: new Map<string, number[]>(),
  localUpdatedAts: new Map<string, number>(),

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
        const entityKey = key.replace(/^(list|task):(insert|update|delete):/, '$1:')
        const seq = state.localVersions.get(entityKey) ?? 0
        newAwaiting.set(key, { timestamp, seq })
        return { pendingOps: newPending, awaitingEcho: newAwaiting }
      }
      return { pendingOps: newPending }
    }),

  confirmEcho: (key: string) =>
    set((state) => {
      const newAwaiting = new Map(state.awaitingEcho)
      const entry = newAwaiting.get(key)
      newAwaiting.delete(key)

      const entityKey = key.replace(/^(list|task):(insert|update|delete):/, '$1:')
      const seq = entry?.seq ?? 0
      
      const newEchoSequences = new Map(state.echoSequences)
      const sequences = newEchoSequences.get(entityKey) ?? []
      const filtered = sequences.filter((s) => s !== seq)
      if (filtered.length > 0) {
        newEchoSequences.set(entityKey, filtered)
      } else {
        newEchoSequences.delete(entityKey)
        const newVersions = new Map(state.localVersions)
        newVersions.delete(entityKey)
        const newLocalUpdatedAts = new Map(state.localUpdatedAts)
        newLocalUpdatedAts.delete(entityKey)
        return { awaitingEcho: newAwaiting, echoSequences: newEchoSequences, localVersions: newVersions, localUpdatedAts: newLocalUpdatedAts }
      }

      return { awaitingEcho: newAwaiting, echoSequences: newEchoSequences }
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

  registerEchoSequence: (entityKey: string, seq: number) =>
    set((state) => {
      const newMap = new Map(state.echoSequences)
      const sequences = newMap.get(entityKey) ?? []
      sequences.push(seq)
      newMap.set(entityKey, sequences)
      return { echoSequences: newMap }
    }),

  isStaleEcho: (entityKey: string, seq: number) => {
    const state = get()
    const latestLocal = state.localVersions.get(entityKey) ?? 0
    return seq < latestLocal
  },

  consumeEchoSequence: (entityKey: string, seq: number) =>
    set((state) => {
      const newEchoSequences = new Map(state.echoSequences)
      const sequences = newEchoSequences.get(entityKey) ?? []
      const filtered = sequences.filter((s) => s !== seq)
      
      if (filtered.length > 0) {
        newEchoSequences.set(entityKey, filtered)
      } else {
        newEchoSequences.delete(entityKey)
        const newVersions = new Map(state.localVersions)
        newVersions.delete(entityKey)
        const newLocalUpdatedAts = new Map(state.localUpdatedAts)
        newLocalUpdatedAts.delete(entityKey)
        return { echoSequences: newEchoSequences, localVersions: newVersions, localUpdatedAts: newLocalUpdatedAts }
      }

      return { echoSequences: newEchoSequences }
    }),

  setLocalUpdatedAt: (entityKey: string, ts: number) =>
    set((state) => {
      const newMap = new Map(state.localUpdatedAts)
      newMap.set(entityKey, ts)
      return { localUpdatedAts: newMap }
    }),

  getLocalUpdatedAt: (entityKey: string) => {
    return get().localUpdatedAts.get(entityKey)
  },
}))

if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const state = usePendingOpsStore.getState()
    const newAwaiting = new Map(state.awaitingEcho)

    for (const [key, entry] of newAwaiting) {
      if (now - entry.timestamp > 8000) {
        newAwaiting.delete(key)

        const entityKey = key.replace(/^(list|task):(insert|update|delete):/, '$1:')
        const seq = entry.seq
        
        const newEchoSequences = new Map(state.echoSequences)
        const sequences = newEchoSequences.get(entityKey) ?? []
        const filtered = sequences.filter((s) => s !== seq)
        
        if (filtered.length > 0) {
          newEchoSequences.set(entityKey, filtered)
        } else {
          newEchoSequences.delete(entityKey)
          const newVersions = new Map(state.localVersions)
          newVersions.delete(entityKey)
          const newLocalUpdatedAts = new Map(state.localUpdatedAts)
          newLocalUpdatedAts.delete(entityKey)
          
          usePendingOpsStore.setState({
            awaitingEcho: newAwaiting,
            echoSequences: newEchoSequences,
            localVersions: newVersions,
            localUpdatedAts: newLocalUpdatedAts
          })
          continue
        }

        usePendingOpsStore.setState({
          awaitingEcho: newAwaiting,
          echoSequences: newEchoSequences
        })
      }
    }
  }, 10000)
}
