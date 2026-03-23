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
    <section className="border border-red-200/40 bg-gradient-to-br from-red-950/85 via-neutral-950 to-slate-950 px-4 py-4 text-white">

      <h2 className="mb-1 text-xl font-bold">
        Morning Check-In
      </h2>

      <p className="mb-3 text-sm text-red-100/75">
        Log sleep and energy before the day starts.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          placeholder="Sleep Hours"
          value={sleep}
          onChange={(e) => {
            setSleep(e.target.value)
            if (error) {
              setError("")
            }
          }}
          className="border border-white/30 bg-neutral-900 px-2 py-1 text-white"
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
          className="border border-white/30 bg-neutral-900 px-2 py-1 text-white"
        />

        <button onClick={submit} className="border border-white/30 px-3 py-1 text-sm">
          Save
        </button>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-200">
          {error}
        </div>
      )}

    </section>
  )
}
