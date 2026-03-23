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
    <section className="border border-red-200/40 bg-gradient-to-br from-red-950/85 via-neutral-950 to-slate-950 px-4 py-4 text-white">

      <h2 className="mb-1 text-xl font-bold">
        Night Check-In
      </h2>

      <p className="mb-3 text-sm text-red-100/75">
        Log how the day felt before saving your night insight.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Mood 1-10"
          value={mood}
          onChange={(e) => {
            setMood(e.target.value)
            if (error) {
              setError("")
            }
          }}
          className="min-w-0 flex-1 basis-[150px] border border-white/30 bg-neutral-900 px-2 py-1 text-white"
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
          className="min-w-0 flex-1 basis-[150px] border border-white/30 bg-neutral-900 px-2 py-1 text-white"
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
          className="min-w-0 flex-1 basis-[150px] border border-white/30 bg-neutral-900 px-2 py-1 text-white"
        />

        <button onClick={submit} className="shrink-0 border border-white/30 px-3 py-1 text-sm">
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
