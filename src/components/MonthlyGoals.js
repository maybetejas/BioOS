"use client"

import { useRef, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getMonthGoals } from "@/lib/dashboard"
import { getMonthKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function MonthlyGoals() {
  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")
  const holdTimerRef = useRef(null)

  if (!system) return null

  const monthKey = getMonthKey()
  const monthlyGoals = getMonthGoals(system, monthKey)
  const completedCount = monthlyGoals.filter((goal) => goal.completed).length
  const completion = monthlyGoals.length > 0 ? Math.round((completedCount / monthlyGoals.length) * 100) : 0
  const remainingCount = Math.max(0, monthlyGoals.length - completedCount)

  function addGoal() {
    const cleanText = text.trim()
    if (!cleanText) return

    setSystem((current) => ({
      ...current,
      monthlyGoals: [...current.monthlyGoals, { id: Date.now(), text: cleanText, completed: false, monthKey, createdAt: new Date().toISOString() }]
    }))
    setText("")
  }

  function toggleGoal(id) {
    setSystem((current) => ({
      ...current,
      monthlyGoals: current.monthlyGoals.map((goal) => goal.id === id ? { ...goal, completed: !goal.completed } : goal)
    }))
  }

  function removeGoal(id) {
    setSystem((current) => ({
      ...current,
      monthlyGoals: current.monthlyGoals.filter((goal) => goal.id !== id)
    }))
  }

  function startHoldDelete(id) {
    window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = window.setTimeout(() => removeGoal(id), 650)
  }

  function stopHoldDelete() {
    window.clearTimeout(holdTimerRef.current)
  }

  return (
    <section className="terminal-card px-4 py-4">
      <div className="section-heading mb-4">
        <div>
          <div className="terminal-label">Monthly Goals</div>
          <h3 className="data-title mt-2 text-base text-white">Longer horizon</h3>
        </div>
        <div className="text-right">
          <div className="neon-number text-2xl text-white">{completion}%</div>
          <div className="terminal-subtext text-xs">{completedCount}/{monthlyGoals.length || 0}</div>
          <div className="terminal-subtext mt-2 text-xs">{remainingCount} left this month</div>
        </div>
      </div>

      <div className="thin-track mb-4">
        <div className="thin-fill" style={{ width: `${completion}%` }} />
      </div>

      <div className="space-y-2">
        {monthlyGoals.map((goal) => (
          <div
            key={goal.id}
            className="rounded-sm border border-white/8 bg-black/20 px-4 py-4"
            onPointerDown={() => startHoldDelete(goal.id)}
            onPointerUp={stopHoldDelete}
            onPointerLeave={stopHoldDelete}
            onPointerCancel={stopHoldDelete}
            onContextMenu={(event) => {
              event.preventDefault()
              removeGoal(goal.id)
            }}
          >
            <StatusCheckbox checked={goal.completed} onChange={() => toggleGoal(goal.id)} textClassName="text-lg text-white">
              {goal.text}
            </StatusCheckbox>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addGoal()
            }
          }}
          className="terminal-input flex-1 px-3 py-3"
          placeholder="Add monthly goal"
        />
        <button type="button" onClick={addGoal} className="terminal-button px-4 py-3 text-sm">+ Add</button>
      </div>
    </section>
  )
}
