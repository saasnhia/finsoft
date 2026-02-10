'use client'

import { useEffect, useState } from 'react'

interface NotificationBadgeProps {
  userId: string | undefined
}

/**
 * Badge showing the count of overdue invoices.
 * Fetches stats independently for sidebar display.
 */
export function NotificationBadge({ userId }: NotificationBadgeProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/overdue')
        const data = await res.json()
        if (data.success && data.stats) {
          setCount(data.stats.total_en_retard)
        }
      } catch {
        // Silently fail — badge just won't show
      }
    }

    fetchCount()
    // Refresh every 5 minutes
    const interval = setInterval(fetchCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [userId])

  if (count === 0) return null

  return (
    <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}
