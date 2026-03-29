'use client'

type RealtimeStatus = 'connected' | 'connecting' | 'disconnected'

interface RealtimeIndicatorProps {
  status: RealtimeStatus
}

export function RealtimeIndicator({ status }: RealtimeIndicatorProps) {
  const dotColor = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  }[status]

  const label = {
    connected: 'Live',
    connecting: 'Connecting...',
    disconnected: 'Reconnecting...',
  }[status]

  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
