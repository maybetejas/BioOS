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
    <section className="border border-red-200/40 bg-gradient-to-br from-red-950/85 via-neutral-950 to-slate-950 px-4 py-4 text-white">

      <h2 className="mb-3 text-xl font-bold">Daily Tasks</h2>

      {system.dailyTodos.map(todo => (

        <div key={todo.id} className="mb-1.5 flex gap-2">

          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
            className="accent-red-400"
          />

          <span>{todo.text}</span>

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
          className="flex-1 border border-white/30 bg-neutral-900 px-2 py-1 text-white"
        />

        <button onClick={addTodo} className="border border-white/30 px-3 py-1 text-sm" disabled={!text.trim()}>
          Add
        </button>

      </div>

      {error && (
        <div className="mt-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {system.pendingDailyTodos.length > 0 && (
        <div className="mt-4 space-y-2">

          <h3 className="font-semibold text-red-100">
            Pending Daily Tasks
          </h3>

          {system.pendingDailyTodos.map((todo) => (
            <div key={todo.id} className="flex items-center gap-2">
              <span className="flex-1">
                {todo.text}
              </span>

              <button onClick={() => restorePending(todo.id)} className="border border-white/30 px-2 py-1 text-sm">
                Add Back
              </button>

              <button onClick={() => deletePending(todo.id)} className="border border-red-200/40 px-2 py-1 text-sm text-red-100">
                Delete
              </button>
            </div>
          ))}

        </div>
      )}

    </section>
  )
}
