"use client"

import { useTeesha } from "@/context/TeeshaContext"

export default function Insights() {

  const { system } = useTeesha()

  if (!system) return null

  const morningInsight = system.insights?.morning
  const nightInsight = system.insights?.night

  return (
    <div>

      <h2 className="text-xl font-bold mb-3">
        Daily Insights
      </h2>

      <div className="space-y-3">

        <div>
          <div className="font-semibold">
            Morning
          </div>
          <div>
            {morningInsight?.text ?? "Morning insight appears after the morning check-in."}
          </div>
        </div>

        <div>
          <div className="font-semibold">
            Night
          </div>
          <div>
            {nightInsight?.text ?? "Night insight appears after the night check-in."}
          </div>
        </div>

      </div>

    </div>
  )
}
