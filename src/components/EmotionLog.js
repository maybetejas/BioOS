"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"

export default function EmotionLog() {

  const { system, setSystem } = useTeesha()

  const [mood, setMood] = useState("")
  const [stress, setStress] = useState("")
  const [alive, setAlive] = useState("")

  if (!system) return null

  function submit() {

    const entry = {
      date: new Date().toISOString(),
      mood,
      stress,
      alive
    }

    setSystem({
      ...system,
      emotions: [...system.emotions, entry]
    })

    setMood("")
    setStress("")
    setAlive("")
  }

  return (
    <div>

      <h2 className="text-xl font-bold mb-3">
        Emotional State
      </h2>

      <input
        placeholder="Mood 1-10"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        className="border px-2 mr-2"
      />

      <input
        placeholder="Stress 1-10"
        value={stress}
        onChange={(e) => setStress(e.target.value)}
        className="border px-2 mr-2"
      />

      <input
        placeholder="Alive Score"
        value={alive}
        onChange={(e) => setAlive(e.target.value)}
        className="border px-2 mr-2"
      />

      <button onClick={submit} className="border px-3">
        Save
      </button>

    </div>
  )
}