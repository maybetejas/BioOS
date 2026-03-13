"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDayKey } from "@/lib/systemLogic"

export default function DailyTodos() {

  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")
  const [error, setError] = useState("")

  if (!system) return null

  function addTodo() {
    const cleanText = text.trim()

    if (!cleanText) {
      setError("Enter a task before adding it.")
      return
    }

    const newTodo = {
      id: Date.now(),
      text: cleanText,
      completed: false,
      createdAt: new Date().toISOString(),
      periodKey: getDayKey()
    }

    setSystem({
      ...system,
      dailyTodos: [...system.dailyTodos, newTodo]
    })

    setText("")
    setError("")
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

  function restorePending(id) {
    const pending = system.pendingDailyTodos.find((todo) => todo.id === id)

    if (!pending) return

    setSystem({
      ...system,
      dailyTodos: [
        ...system.dailyTodos,
        {
          id: pending.id,
          text: pending.text,
          completed: false,
          createdAt: pending.movedAt,
          periodKey: getDayKey()
        }
      ],
      pendingDailyTodos: system.pendingDailyTodos.filter((todo) => todo.id !== id)
    })
  }

  function deletePending(id) {
    setSystem({
      ...system,
      pendingDailyTodos: system.pendingDailyTodos.filter((todo) => todo.id !== id)
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
          onChange={(e) => {
            setText(e.target.value)
            if (error) {
              setError("")
            }
          }}
          className="border px-2"
        />

        <button onClick={addTodo} className="border px-3" disabled={!text.trim()}>
          Add
        </button>

      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {system.pendingDailyTodos.length > 0 && (
        <div className="mt-4 space-y-2">

          <h3 className="font-semibold">
            Pending Daily Tasks
          </h3>

          {system.pendingDailyTodos.map((todo) => (
            <div key={todo.id} className="flex items-center gap-2">
              <span className="flex-1">
                {todo.text}
              </span>

              <button onClick={() => restorePending(todo.id)} className="border px-2">
                Add Back
              </button>

              <button onClick={() => deletePending(todo.id)} className="border px-2">
                Delete
              </button>
            </div>
          ))}

        </div>
      )}

    </div>
  )
}
