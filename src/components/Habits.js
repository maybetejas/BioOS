"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"

export default function Habits() {

  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")

  if (!system) return null

  function addHabit() {

    const newHabit = {
      id: Date.now(),
      name: text,
      streak: 0,
      completedToday: false
    }

    setSystem({
      ...system,
      habits: [...system.habits, newHabit]
    })

    setText("")
  }

  function toggleHabit(id) {

    const updated = system.habits.map(habit => {

      if (habit.id === id) {

        const completed = !habit.completedToday

        return {
          ...habit,
          completedToday: completed,
          streak: completed ? habit.streak + 1 : habit.streak
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
          onChange={(e) => setText(e.target.value)}
          className="border px-2"
        />

        <button onClick={addHabit} className="border px-3">
          Add
        </button>

      </div>

    </div>
  )
}