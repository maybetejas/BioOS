"use client"

import { useState } from "react"
import { useTeesha } from "../context/TeeshaContext"

export default function DailyTodos() {

  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")

  if (!system) return null

  function addTodo() {

    const newTodo = {
      id: Date.now(),
      text,
      completed: false
    }

    setSystem({
      ...system,
      dailyTodos: [...system.dailyTodos, newTodo]
    })

    setText("")
  }

  function toggleTodo(id) {

    const updated = system.dailyTodos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    )

    setSystem({
      ...system,
      dailyTodos: updated
    })
  }

  return (
    <div>

      <h2 className="text-xl font-bold mb-4">Daily Tasks</h2>

      {system.dailyTodos.map(todo => (

        <div key={todo.id} className="flex gap-2">

          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />

          <span>{todo.text}</span>

        </div>

      ))}

      <div className="flex gap-2 mt-4">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border px-2"
        />

        <button onClick={addTodo} className="border px-3">
          Add
        </button>

      </div>

    </div>
  )
}