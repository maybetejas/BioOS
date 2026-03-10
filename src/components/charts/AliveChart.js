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

export default function AliveChart() {

  const { system } = useTeesha()

  if (!system) return null

  const data = system.emotions.map(e => ({
    date: new Date(e.date).toLocaleDateString(),
    alive: Number(e.alive)
  }))

  if (data.length === 0) {
    return <div>No Alive data yet</div>
  }

  return (
    <div className="w-full">

      <h2 className="text-lg font-semibold mb-3">
        Alive Index
      </h2>

      <div className="w-full h-[260px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >

            <CartesianGrid stroke="#333" strokeDasharray="3 3" />

            <XAxis dataKey="date" />

            <YAxis domain={[0,10]} />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="alive"
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ r: 4 }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}