"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDayKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function Habits() {

  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")
  const [error, setError] = useState("")

  if (!system) return null

  function addHabit() {
    const cleanText = text.trim()

    if (!cleanText) {
      setError("Enter a habit before adding it.")
      return
    }

    const newHabit = {
      id: Date.now(),
      name: cleanText,
      streak: 0,
      completedToday: false,
      lastCompletedOn: null,
      previousCompletedOn: null
    }

    setSystem((current) => ({
      ...current,
      habits: [...current.habits, newHabit]
    }))

    setText("")
  }

  function toggleHabit(id) {
    const todayKey = getDayKey()

    setSystem((current) => ({
      ...current,
      habits: current.habits.map((habit) => {
        if (habit.id !== id) {
          return habit
        }

        const completed = !habit.completedToday
        const lastCompletedOn = habit.lastCompletedOn

        return {
          ...habit,
          completedToday: completed,
          streak: completed
            ? (lastCompletedOn === todayKey ? habit.streak : habit.streak + 1)
            : Math.max(habit.streak - 1, 0),
          lastCompletedOn: completed ? todayKey : habit.previousCompletedOn,
          previousCompletedOn: completed ? lastCompletedOn : null
        }
      })
    }))
  }

  return (
    <section className="terminal-section mt-6">

      <h2 className="mb-2 text-xl font-bold">
        <span className="terminal-glow-text">
        Habits
        </span>
      </h2>

      <p className="terminal-subtext mb-3 text-sm">
        Checking a habit marks it completed for today. After 7 straight days it shows up as acquired, and it drops off that list if the streak breaks.
      </p>

      {system.habits.map(habit => (

        <div key={habit.id} className="mb-2">
          <StatusCheckbox checked={habit.completedToday} onChange={() => toggleHabit(habit.id)}>
            {habit.name} (Streak: {habit.streak})
          </StatusCheckbox>
        </div>

      ))}

      <div className="mt-3 flex gap-2">

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error) {
              setError("")
            }
          }}
          className="terminal-input flex-1 px-2 py-1"
        />

        <button onClick={addHabit} className="terminal-button px-3 py-1 text-sm disabled:opacity-40" disabled={!text.trim()}>
          Add
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
