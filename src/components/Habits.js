"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDayKey } from "@/lib/systemLogic"

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

    setSystem({
      ...system,
      habits: [...system.habits, newHabit]
    })

    setText("")
  }

  function toggleHabit(id) {
    const todayKey = getDayKey()

    const updated = system.habits.map(habit => {

      if (habit.id === id) {

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
      }

      return habit
    })

    setSystem({
      ...system,
      habits: updated
    })
  }

  return (
    <div>

      <h2 className="text-xl font-bold mb-3">
        Habits
      </h2>

      <p className="mb-3 text-sm text-gray-600">
        Checking a habit marks it completed for today. After 7 straight days it shows up as acquired, and it drops off that list if the streak breaks.
      </p>

      {system.habits.map(habit => (

        <div key={habit.id} className="flex gap-2">

          <input
            type="checkbox"
            checked={habit.completedToday}
            onChange={() => toggleHabit(habit.id)}
          />

          <span>
            {habit.name} (Streak: {habit.streak})
          </span>

        </div>

      ))}

      <div className="flex gap-2 mt-3">

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error) {
              setError("")
            }
          }}
          className="border px-2"
        />

        <button onClick={addHabit} className="border px-3" disabled={!text.trim()}>
          Add
        </button>

      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

    </div>
  )
}
