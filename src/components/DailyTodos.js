"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDayKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

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

    setSystem((current) => ({
      ...current,
      dailyTodos: [...current.dailyTodos, newTodo]
    }))

    setText("")
    setError("")
  }

  function toggleTodo(id) {

    setSystem((current) => ({
      ...current,
      dailyTodos: current.dailyTodos.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    }))
  }

  function restorePending(id) {
    const pending = system.pendingDailyTodos.find((todo) => todo.id === id)

    if (!pending) return

    setSystem((current) => ({
      ...current,
      dailyTodos: [
        ...current.dailyTodos,
        {
          id: pending.id,
          text: pending.text,
          completed: false,
          createdAt: pending.movedAt,
          periodKey: getDayKey()
        }
      ],
      pendingDailyTodos: current.pendingDailyTodos.filter((todo) => todo.id !== id)
    }))
  }

  function deletePending(id) {
    setSystem((current) => ({
      ...current,
      pendingDailyTodos: current.pendingDailyTodos.filter((todo) => todo.id !== id)
    }))
  }

  return (
    <section className="terminal-section mt-6">

      <h2 className="terminal-glow-text mb-3 text-xl font-bold">Daily Tasks</h2>

      {system.dailyTodos.map(todo => (

        <div key={todo.id} className="mb-2">
          <StatusCheckbox checked={todo.completed} onChange={() => toggleTodo(todo.id)}>
            {todo.text}
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

        <button onClick={addTodo} className="terminal-button px-3 py-1 text-sm disabled:opacity-40" disabled={!text.trim()}>
          Add
        </button>

      </div>

      {error && (
        <div className="terminal-error mt-2 text-sm">
          {error}
        </div>
      )}

      {system.pendingDailyTodos.length > 0 && (
        <div className="mt-4 space-y-2">

          <h3 className="font-semibold terminal-glow-text">
            Pending Daily Tasks
          </h3>

          {system.pendingDailyTodos.map((todo) => (
            <div key={todo.id} className="flex items-center gap-2">
              <span className="flex-1">
                {todo.text}
              </span>

              <button onClick={() => restorePending(todo.id)} className="terminal-button-muted px-2 py-1 text-sm">
                Add Back
              </button>

              <button onClick={() => deletePending(todo.id)} className="terminal-button px-2 py-1 text-sm">
                Delete
              </button>
            </div>
          ))}

        </div>
      )}

    </section>
  )
}
