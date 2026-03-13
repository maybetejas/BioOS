"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { buildMorningInsight } from "@/lib/insights"
import { getDayKey, upsertEntryByDay } from "@/lib/systemLogic"

export default function Biometrics() {

  const { system, setSystem } = useTeesha()

  const [sleep, setSleep] = useState("")
  const [energy, setEnergy] = useState("")
  const [error, setError] = useState("")

  if (!system) return null

  function submit() {
    const parsedSleep = Number(sleep)
    const parsedEnergy = Number(energy)

    if (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24) {
      setError("Sleep must be a number between 0 and 24.")
      return
    }

    if (!Number.isFinite(parsedEnergy) || parsedEnergy < 1 || parsedEnergy > 10) {
      setError("Energy must be a number from 1 to 10.")
      return
    }

    const now = new Date()
    const dateKey = getDayKey(now)
    const entry = {
      date: now.toISOString(),
      dateKey,
      sleep: parsedSleep,
      energy: parsedEnergy
    }

    setSystem({
      ...system,
      biometrics: upsertEntryByDay(system.biometrics, entry),
      insights: {
        ...system.insights,
        morning: buildMorningInsight({
          sleep: parsedSleep,
          energy: parsedEnergy,
          date: dateKey
        })
      }
    })

    setSleep("")
    setEnergy("")
    setError("")
  }

  return (
    <div>

      <h2 className="text-xl font-bold mb-1">
        Morning Check-In
      </h2>

      <p className="mb-3 text-sm text-gray-600">
        Log sleep and energy before the day starts.
      </p>

      <input
        placeholder="Sleep Hours"
        value={sleep}
        onChange={(e) => {
          setSleep(e.target.value)
          if (error) {
            setError("")
          }
        }}
        className="border px-2 mr-2"
      />

      <input
        placeholder="Energy 1-10"
        value={energy}
        onChange={(e) => {
          setEnergy(e.target.value)
          if (error) {
            setError("")
          }
        }}
        className="border px-2 mr-2"
      />

      <button onClick={submit} className="border px-3">
        Save
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

    </div>
  )
}
