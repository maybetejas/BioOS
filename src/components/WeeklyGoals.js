"use client"

import { useRef, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getWeekGoals } from "@/lib/dashboard"
import { getWeekKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function WeeklyGoals() {
  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")
  const holdTimerRef = useRef(null)

  if (!system) return null

  const weekKey = getWeekKey()
  const weeklyGoals = getWeekGoals(system, weekKey)
  const completedCount = weeklyGoals.filter((goal) => goal.completed).length
  const remainingCount = Math.max(0, weeklyGoals.length - completedCount)

  function addGoal() {
    const cleanText = text.trim()
    if (!cleanText) return

    setSystem((current) => ({
      ...current,
      weeklyGoals: [...current.weeklyGoals, { id: Date.now(), text: cleanText, completed: false, weekKey, createdAt: new Date().toISOString() }]
    }))
    setText("")
  }

  function toggleGoal(id) {
    setSystem((current) => ({
      ...current,
      weeklyGoals: current.weeklyGoals.map((goal) => goal.id === id ? { ...goal, completed: !goal.completed } : goal)
    }))
  }

  function removeGoal(id) {
    setSystem((current) => ({
      ...current,
      weeklyGoals: current.weeklyGoals.filter((goal) => goal.id !== id)
    }))
  }

  function startHoldDelete(id) {
    window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = window.setTimeout(() => removeGoal(id), 650)
  }

  function stopHoldDelete() {
    window.clearTimeout(holdTimerRef.current)
  }

  const completion = weeklyGoals.length > 0 ? Math.round((completedCount / weeklyGoals.length) * 100) : 0

  return (
    <section className="terminal-card px-3.5 py-3.5 sm:px-4 sm:py-4">
      <div className="section-heading mb-4">
        <div>
          <div className="terminal-label">Weekly Plan</div>
          <h3 className="data-title mt-2 text-sm text-white sm:text-base">Priority outcomes</h3>
        </div>
        <div className="text-right">
          <div className="neon-number text-xl text-white sm:text-2xl">{completion}%</div>
          <div className="terminal-subtext text-xs">{completedCount}/{weeklyGoals.length || 0}</div>
          <div className="terminal-subtext mt-2 text-xs">{remainingCount} left this week</div>
        </div>
      </div>

      <div className="thin-track mb-3.5 sm:mb-4">
        <div className="thin-fill" style={{ width: `${completion}%` }} />
      </div>

      <div className="space-y-2">
        {weeklyGoals.map((goal) => (
          <div
            key={goal.id}
            className="rounded-sm border border-white/8 bg-black/20 px-3 py-2.5 sm:px-4 sm:py-4"
            onPointerDown={() => startHoldDelete(goal.id)}
            onPointerUp={stopHoldDelete}
            onPointerLeave={stopHoldDelete}
            onPointerCancel={stopHoldDelete}
            onContextMenu={(event) => {
              event.preventDefault()
              removeGoal(goal.id)
            }}
          >
            <StatusCheckbox checked={goal.completed} onChange={() => toggleGoal(goal.id)} textClassName="text-sm text-white sm:text-base">
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
          className="terminal-input min-w-0 flex-1 px-3 py-2.5 sm:py-3"
          placeholder="Add weekly goal"
        />
        <button type="button" onClick={addGoal} className="terminal-button shrink-0 px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm">+ Add</button>
      </div>

      <div className="terminal-subtext mt-3 text-xs">Hold a weekly goal to delete it.</div>
    </section>
  )
}
