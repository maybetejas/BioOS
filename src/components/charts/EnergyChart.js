"use client"

import { useState } from "react"
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

const metricConfig = [
  { key: "sleep", label: "Sleep", color: "#38bdf8" },
  { key: "energy", label: "Energy", color: "#22c55e" },
  { key: "mood", label: "Mood", color: "#f59e0b" },
  { key: "focus", label: "Focus", color: "#3b82f6" },
  { key: "stress", label: "Stress", color: "#ef4444" }
]

function parseDayKey(dayKey) {
  const [year, month, day] = String(dayKey).split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function toDateLabel(dayKey) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(parseDayKey(dayKey))
}

export default function EnergyChart() {
  const [activeMetric, setActiveMetric] = useState("all")

  const { system } = useTeesha()

  if (!system) return null

  const byDay = new Map()

  ;(system.biometrics ?? []).forEach((entry) => {
    if (!entry?.dateKey) return

    byDay.set(entry.dateKey, {
      ...(byDay.get(entry.dateKey) ?? { dateKey: entry.dateKey }),
      sleep: Number(entry.sleep),
      energy: Number(entry.energy)
    })
  })

  ;(system.emotions ?? []).forEach((entry) => {
    if (!entry?.dateKey) return

    byDay.set(entry.dateKey, {
      ...(byDay.get(entry.dateKey) ?? { dateKey: entry.dateKey }),
      mood: Number(entry.mood),
      focus: Number(entry.focus),
      stress: Number(entry.stress)
    })
  })

  const data = [...byDay.values()]
    .sort((left, right) => parseDayKey(left.dateKey) - parseDayKey(right.dateKey))
    .map((entry) => ({
      ...entry,
      date: toDateLabel(entry.dateKey)
    }))

  if (data.length === 0) {
    return <div>No daily state data yet</div>
  }

  const visibleMetrics = activeMetric === "all"
    ? metricConfig
    : metricConfig.filter((metric) => metric.key === activeMetric)

  return (
    <section className="terminal-section mt-8 w-full">

      <h2 className="terminal-glow-text mb-3 text-lg font-semibold">
        Daily State Trends
      </h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveMetric("all")}
          className={`px-3 py-1 text-sm transition ${
            activeMetric === "all"
              ? "terminal-button"
              : "terminal-button-muted"
          }`}
        >
          All
        </button>

        {metricConfig.map((metric) => (
          <button
            key={metric.key}
            type="button"
            onClick={() => setActiveMetric(metric.key)}
            className={`px-3 py-1 text-sm transition ${
              activeMetric === metric.key
                ? "terminal-button"
                : "terminal-button-muted"
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

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
              domain={[0,10]}
              stroke="var(--terminal-text-soft)"
            />

            <Tooltip />

            {visibleMetrics.map((metric) => (
              <Line
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={2}
                dot={{ r: 2.5, strokeWidth: 1 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}

          </LineChart>

        </ResponsiveContainer>

      </div>

    </section>
  )
}
