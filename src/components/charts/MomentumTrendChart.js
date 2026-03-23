"use client"

import { useTeesha } from "@/context/TeeshaContext"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

function toDateLabel(dayKey) {
  const [year, month, day] = String(dayKey).split("-").map(Number)
  const safeDate = new Date(year, (month || 1) - 1, day || 1)
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(safeDate)
}

export default function MomentumTrendChart() {
  const { system } = useTeesha()

  if (!system) return null

  const byDay = new Map()

  ;(system.momentumHistory ?? []).forEach((entry) => {
    if (!entry?.dateKey) return

    byDay.set(entry.dateKey, {
      ...(byDay.get(entry.dateKey) ?? { dateKey: entry.dateKey }),
      momentum: Number(entry.score)
    })
  })

  const data = [...byDay.values()]
    .sort((left, right) => new Date(left.dateKey) - new Date(right.dateKey))
    .map((entry) => ({
      ...entry,
      date: toDateLabel(entry.dateKey)
    }))

  if (data.length === 0) {
    return <div>No Momentum trend data yet</div>
  }

  return (
    <section className="terminal-section mt-6 w-full">
      <h2 className="terminal-glow-text mb-1 text-lg font-semibold">
        Momentum Trend
      </h2>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid stroke="var(--terminal-grid)" strokeDasharray="3 3" />

            <XAxis dataKey="date" stroke="var(--terminal-text-soft)" />

            <YAxis
              yAxisId="momentum"
              domain={[0, 100]}
              stroke="var(--terminal-text-soft)"
            />

            <Tooltip />

            <Line
              yAxisId="momentum"
              type="monotone"
              dataKey="momentum"
              name="Momentum"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
