"use client"

import { useTeesha } from "@/context/TeeshaContext"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
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

  ;(system.biometrics ?? []).forEach((entry) => {
    if (!entry?.dateKey) return

    byDay.set(entry.dateKey, {
      ...(byDay.get(entry.dateKey) ?? { dateKey: entry.dateKey }),
      energy: Number(entry.energy)
    })
  })

  ;(system.emotions ?? []).forEach((entry) => {
    if (!entry?.dateKey) return

    byDay.set(entry.dateKey, {
      ...(byDay.get(entry.dateKey) ?? { dateKey: entry.dateKey }),
      mood: Number(entry.mood)
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
    <div className="w-full">
      <h2 className="mb-1 text-lg font-semibold">
        Momentum Trend
      </h2>

      <p className="mb-3 text-sm text-gray-500">
        Day-by-day momentum with energy and mood context.
      </p>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />

            <XAxis dataKey="date" stroke="#777" />

            <YAxis
              yAxisId="momentum"
              domain={[0, 100]}
              stroke="#f59e0b"
            />

            <YAxis
              yAxisId="state"
              orientation="right"
              domain={[0, 10]}
              stroke="#777"
            />

            <Tooltip />
            <Legend />

            <Line
              yAxisId="momentum"
              type="monotone"
              dataKey="momentum"
              name="Momentum"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 3 }}
              connectNulls
            />

            <Line
              yAxisId="state"
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />

            <Line
              yAxisId="state"
              type="monotone"
              dataKey="mood"
              name="Mood"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
