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

export default function SleepChart() {

  const { system } = useTeesha()

  if (!system) return null

  const data = system.biometrics.map(b => ({
    date: new Date(b.date).toLocaleDateString(),
    sleep: Number(b.sleep)
  }))

  if (data.length === 0) {
    return <div>No Sleep data yet</div>
  }

  return (
    <div className="w-full">

      <h2 className="text-lg font-semibold mb-3">
        Sleep Trend
      </h2>

      <div className="w-full h-[260px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >

            <CartesianGrid stroke="#333" strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              stroke="#777"
            />

            <YAxis
              domain={[0,12]}
              stroke="#777"
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="sleep"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4 }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}