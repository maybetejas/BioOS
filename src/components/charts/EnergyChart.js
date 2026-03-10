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

export default function EnergyChart() {

  const { system } = useTeesha()

  if (!system) return null

  const data = system.biometrics.map(b => ({
    date: new Date(b.date).toLocaleDateString(),
    energy: Number(b.energy)
  }))

  if (data.length === 0) {
    return <div>No Energy data yet</div>
  }

  return (
    <div className="w-full">

      <h2 className="text-lg font-semibold mb-3">
        Energy Levels
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
              domain={[0,10]}
              stroke="#777"
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="energy"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 4 }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}