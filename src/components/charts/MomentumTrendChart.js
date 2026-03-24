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

function parseDayKey(dayKey) {
  const [year, month, day] = String(dayKey).split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function sleepQuality(sleepHours) {
  if (!Number.isFinite(sleepHours)) return 0
  if (sleepHours >= 7 && sleepHours <= 9) return 1
  if (sleepHours < 7) return clamp(sleepHours / 7, 0, 1)
  return clamp(1 - ((sleepHours - 9) / 3), 0, 1)
}

function buildMomentumFallback({ bio, emotion }) {
  const energyComponent = clamp((Number(bio?.energy) || 0) / 10, 0, 1)
  const sleepComponent = sleepQuality(Number(bio?.sleep))
  const mood = clamp((Number(emotion?.mood) || 0) / 10, 0, 1)
  const focus = clamp((Number(emotion?.focus) || 0) / 10, 0, 1)
  const stress = clamp((Number(emotion?.stress) || 0) / 10, 0, 1)

  const biologicalScore = ((energyComponent * 0.65) + (sleepComponent * 0.35)) * 15
  const emotionalScore = ((mood * 0.45) + (focus * 0.35) + ((1 - stress) * 0.2)) * 15

  return Math.round(clamp(biologicalScore + emotionalScore, 0, 100))
}

export default function MomentumTrendChart() {
  const { system } = useTeesha()

  if (!system) return null

  const byDay = new Map()
  const bioByDay = new Map()
  const emotionByDay = new Map()

  ;(system.momentumHistory ?? []).forEach((entry) => {
    if (!entry?.dateKey) return

    byDay.set(entry.dateKey, {
      ...(byDay.get(entry.dateKey) ?? { dateKey: entry.dateKey }),
      momentum: Number(entry.score)
    })
  })

  ;(system.biometrics ?? []).forEach((entry) => {
    if (entry?.dateKey) {
      bioByDay.set(entry.dateKey, entry)
    }
  })

  ;(system.emotions ?? []).forEach((entry) => {
    if (entry?.dateKey) {
      emotionByDay.set(entry.dateKey, entry)
    }
  })

  const allDayKeys = new Set([
    ...byDay.keys(),
    ...bioByDay.keys(),
    ...emotionByDay.keys()
  ])

  allDayKeys.forEach((dateKey) => {
    if (byDay.has(dateKey)) {
      return
    }

    byDay.set(dateKey, {
      dateKey,
      momentum: buildMomentumFallback({
        bio: bioByDay.get(dateKey),
        emotion: emotionByDay.get(dateKey)
      })
    })
  })

  const data = [...byDay.values()]
    .sort((left, right) => parseDayKey(left.dateKey) - parseDayKey(right.dateKey))
    .map((entry) => ({
      ...entry,
      date: toDateLabel(entry.dateKey)
    }))

  if (data.length === 0) {
    return <div>No Momentum trend data yet</div>
  }

  return (
    <section className="terminal-section mt-8 w-full">
      <h2 className="terminal-glow-text mb-1 text-lg font-semibold">
        Momentum Trend
      </h2>

      <div className="h-[320px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 12, left: -12, bottom: 6 }}
          >
            <CartesianGrid stroke="var(--terminal-grid)" strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              stroke="var(--terminal-text-soft)"
              minTickGap={24}
              tickMargin={10}
              interval="preserveStartEnd"
            />

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
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 1 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
