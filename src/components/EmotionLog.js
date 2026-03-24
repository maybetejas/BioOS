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

    setSystem((current) => {
      const tasksCompleted = current.dailyTodos.filter((todo) => todo.completed).length
      const totalTasks = current.dailyTodos.length
      const habitsCompleted = current.habits.filter((habit) => habit.completedToday).length

      return {
        ...current,
        emotions: upsertEntryByDay(current.emotions, entry),
        insights: {
          ...current.insights,
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
      }
    })

    setMood("")
    setStress("")
    setFocus("")
    setError("")
  }

  return (
    <section className="terminal-section mt-6">

      <h2 className="mb-1 text-xl font-bold">
        <span className="terminal-glow-text">
        Night Check-In
        </span>
      </h2>

      <p className="terminal-subtext mb-3 text-sm">
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
          className="terminal-input min-w-0 flex-1 basis-[150px] px-2 py-1"
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
          className="terminal-input min-w-0 flex-1 basis-[150px] px-2 py-1"
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
          className="terminal-input min-w-0 flex-1 basis-[150px] px-2 py-1"
        />

        <button onClick={submit} className="terminal-button shrink-0 px-3 py-1 text-sm">
          Save
        </button>
      </div>

      {error && (
        <div className="terminal-error mt-2 text-sm">
          {error}
        </div>
      )}

    </section>
  )
}
