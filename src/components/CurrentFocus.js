"use client"

import { useEffect, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getCurrentFocus } from "@/lib/dashboard"

function formatTime(value) {
  const [hours, minutes] = String(value).split(":").map(Number)
  const date = new Date()
  date.setHours(hours || 0, minutes || 0, 0, 0)

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date)
}

export default function CurrentFocus() {
  const { system } = useTeesha()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(intervalId)
  }, [])

  if (!system) return null

  const activeBlock = getCurrentFocus(system.schedule, now)
  const totalMinutes = activeBlock
    ? Math.max(1, (Number(activeBlock.end.slice(0, 2)) * 60 + Number(activeBlock.end.slice(3))) - (Number(activeBlock.start.slice(0, 2)) * 60 + Number(activeBlock.start.slice(3))))
    : 1
  const elapsedMinutes = activeBlock
    ? Math.max(0, ((now.getHours() * 60) + now.getMinutes()) - ((Number(activeBlock.start.slice(0, 2)) * 60) + Number(activeBlock.start.slice(3))))
    : 0
  const width = `${Math.min(100, Math.round((elapsedMinutes / totalMinutes) * 100))}%`

  return (
    <section className="terminal-card px-4 py-5 sm:px-5">
      <div className="section-heading">
        <div>
          <div className="terminal-label">Current Focus</div>
          <h2 className="data-title mt-2 text-[1.95rem] leading-none text-white sm:text-[2.35rem]">
            {activeBlock ? activeBlock.label.replace(/\s+/g, "_").toUpperCase() : "OFF_GRID"}
          </h2>
        </div>
        <div className="terminal-chip-muted px-3 py-1 text-[0.65rem]">
          {activeBlock ? "Urgent" : "Standby"}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="thin-track flex-1">
          <div className="thin-fill" style={{ width }} />
        </div>
        <div className="font-mono text-sm text-white">
          {activeBlock ? `${formatTime(activeBlock.start)} - ${formatTime(activeBlock.end)}` : "No block"}
        </div>
      </div>

      <div className="terminal-subtext mt-3 text-sm">
        {activeBlock ? "This is what you should be doing right now." : "No schedule block is active right now."}
      </div>
    </section>
  )
}
