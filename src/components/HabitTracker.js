"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDailyLog, updateDailyLog } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function HabitTracker() {
  const { system, setSystem } = useTeesha()
  const [name, setName] = useState("")

  if (!system) return null

  const todayKey = getDayKey()
  const todayLog = getDailyLog(system, todayKey)
  const completedSet = new Set(todayLog.habitsCompleted)

  function addHabit() {
    const cleanName = name.trim()
    if (!cleanName) return

    setSystem((current) => ({
      ...current,
      habits: [...current.habits, { id: Date.now(), name: cleanName, streak: 0, lastCompletedDate: null }]
    }))
    setName("")
  }

  function toggleHabit(habitName) {
    setSystem((current) => {
      const currentLog = getDailyLog(current, todayKey)
      const currentCompleted = currentLog.habitsCompleted ?? []
      const isCompleted = currentCompleted.includes(habitName)
      const nextCompleted = isCompleted ? currentCompleted.filter((entry) => entry !== habitName) : [...currentCompleted, habitName]

      const nextHabits = current.habits.map((habit) => {
        if (habit.name !== habitName) return habit

        if (isCompleted) {
          return {
            ...habit,
            streak: Math.max(0, habit.streak - 1),
            lastCompletedDate: habit.lastCompletedDate === todayKey ? null : habit.lastCompletedDate
          }
        }

        const previousDate = habit.lastCompletedDate
        const previous = previousDate ? new Date(`${previousDate}T00:00:00`) : null
        const today = new Date(`${todayKey}T00:00:00`)
        const diffDays = previous ? Math.round((today - previous) / (24 * 60 * 60 * 1000)) : null

        return {
          ...habit,
          streak: diffDays === 1 ? habit.streak + 1 : 1,
          lastCompletedDate: todayKey
        }
      })

      return updateDailyLog({ ...current, habits: nextHabits }, todayKey, (log) => ({
        ...log,
        habitsCompleted: nextCompleted
      }))
    })
  }

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label hot-text">Habit Telemetry</div>
          <h3 className="data-title mt-2 text-xl text-white">Daily Reinforcement</h3>
        </div>
      </div>

      <div className="space-y-3">
        {system.habits.map((habit, index) => {
          const colorClass = index % 3 === 0 ? "money-secondary" : index % 3 === 1 ? "money-primary" : "ember-text"
          const streakWidth = `${Math.min(100, habit.streak * 10)}%`

          return (
            <div key={habit.id} className="terminal-card px-4 py-4">
              <div className="flex items-start gap-3">
                <div className={`grid h-11 w-11 place-items-center border ${colorClass} text-lg font-bold`}>+</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xl font-semibold text-white">{habit.name}</div>
                    <div className={`text-sm font-semibold uppercase ${colorClass}`}>Streak {habit.streak}d</div>
                  </div>
                  <div className="thin-track mt-3">
                    <div className="thin-fill" style={{ width: streakWidth }} />
                  </div>
                </div>
                <div className="pt-1">
                  <StatusCheckbox checked={completedSet.has(habit.name)} onChange={() => toggleHabit(habit.name)}>
                    <span className="sr-only">Toggle {habit.name}</span>
                  </StatusCheckbox>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} className="terminal-input flex-1 px-3 py-3" placeholder="Add habit" />
        <button type="button" onClick={addHabit} className="terminal-button px-4 py-3 text-sm">Add</button>
      </div>
    </section>
  )
}
