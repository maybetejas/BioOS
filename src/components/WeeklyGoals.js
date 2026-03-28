"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getWeekGoals } from "@/lib/dashboard"
import { getWeekKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function WeeklyGoals() {
  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")

  if (!system) return null

  const weekKey = getWeekKey()
  const weeklyGoals = getWeekGoals(system, weekKey)
  const completedCount = weeklyGoals.filter((goal) => goal.completed).length

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

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label">Weekly Objectives</div>
          <h3 className="data-title mt-2 text-xl text-white">Manual Weekly Tracking</h3>
        </div>
        <div className="neon-number text-3xl text-white">{completedCount}<span className="terminal-subtext text-lg">/{weeklyGoals.length || 0}</span></div>
      </div>

      <div className="space-y-3">
        {weeklyGoals.map((goal) => (
          <div key={goal.id} className="terminal-card px-4 py-4">
            <StatusCheckbox checked={goal.completed} onChange={() => toggleGoal(goal.id)}>
              {goal.text}
            </StatusCheckbox>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input value={text} onChange={(event) => setText(event.target.value)} className="terminal-input flex-1 px-3 py-3" placeholder="Add weekly goal" />
        <button type="button" onClick={addGoal} className="terminal-button px-4 py-3 text-sm">Add</button>
      </div>
    </section>
  )
}
