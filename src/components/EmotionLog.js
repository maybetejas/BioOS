"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { buildNightInsight } from "@/lib/insights"
import { getDayKey, upsertEntryByDay } from "@/lib/systemLogic"

export default function EmotionLog() {

  const { system, setSystem } = useTeesha()

  const [mood, setMood] = useState("")
  const [stress, setStress] = useState("")
  const [focus, setFocus] = useState("")
  const [error, setError] = useState("")

  if (!system) return null

  function submit() {
    const parsedMood = Number(mood)
    const parsedStress = Number(stress)
    const parsedFocus = Number(focus)

    if (!Number.isFinite(parsedMood) || parsedMood < 1 || parsedMood > 10) {
      setError("Mood must be a number from 1 to 10.")
      return
    }

    if (!Number.isFinite(parsedStress) || parsedStress < 1 || parsedStress > 10) {
      setError("Stress must be a number from 1 to 10.")
      return
    }

    if (!Number.isFinite(parsedFocus) || parsedFocus < 1 || parsedFocus > 10) {
      setError("Focus must be a number from 1 to 10.")
      return
    }

    const now = new Date()
    const dateKey = getDayKey(now)
    const entry = {
      date: now.toISOString(),
      dateKey,
      mood: parsedMood,
      stress: parsedStress,
      focus: parsedFocus
    }

    const tasksCompleted = system.dailyTodos.filter((todo) => todo.completed).length
    const totalTasks = system.dailyTodos.length
    const habitsCompleted = system.habits.filter((habit) => habit.completedToday).length

    setSystem({
      ...system,
      emotions: upsertEntryByDay(system.emotions, entry),
      insights: {
        ...system.insights,
        night: buildNightInsight({
          mood: parsedMood,
          stress: parsedStress,
          focus: parsedFocus,
          tasksCompleted,
          totalTasks,
          habitsCompleted,
          date: dateKey
        })
      }
    })

    setMood("")
    setStress("")
    setFocus("")
    setError("")
  }

  return (
    <div>

      <h2 className="text-xl font-bold mb-1">
        Night Check-In
      </h2>

      <p className="mb-3 text-sm text-gray-600">
        Log how the day felt before saving your night insight.
      </p>

      <input
        placeholder="Mood 1-10"
        value={mood}
        onChange={(e) => {
          setMood(e.target.value)
          if (error) {
            setError("")
          }
        }}
        className="border px-2 mr-2"
      />

      <input
        placeholder="Stress 1-10"
        value={stress}
        onChange={(e) => {
          setStress(e.target.value)
          if (error) {
            setError("")
          }
        }}
        className="border px-2 mr-2"
      />

      <input
        placeholder="Focus 1-10"
        value={focus}
        onChange={(e) => {
          setFocus(e.target.value)
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
