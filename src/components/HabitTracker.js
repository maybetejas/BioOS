"use client"

import { useRef, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDailyLog, updateDailyLog } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function HabitTracker() {
  const { system, setSystem } = useTeesha()
  const [name, setName] = useState("")
  const holdTimerRef = useRef(null)

  if (!system) return null

  const todayKey = getDayKey()
  const todayLog = getDailyLog(system, todayKey)
  const completedSet = new Set(todayLog.habitsCompleted)
  const remainingCount = Math.max(0, system.habits.length - completedSet.size)

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

  function removeHabit(id, habitName) {
    setSystem((current) => {
      const currentLog = getDailyLog(current, todayKey)

      return updateDailyLog({
        ...current,
        habits: current.habits.filter((habit) => habit.id !== id)
      }, todayKey, (log) => ({
        ...log,
        habitsCompleted: (currentLog.habitsCompleted ?? []).filter((entry) => entry !== habitName)
      }))
    })
  }

  function startHoldDelete(id, habitName) {
    window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = window.setTimeout(() => removeHabit(id, habitName), 650)
  }

  function stopHoldDelete() {
    window.clearTimeout(holdTimerRef.current)
  }

  return (
    <section className="terminal-card px-3.5 py-3.5 sm:px-4 sm:py-4">
      <div className="section-heading mb-4">
        <div>
          <div className="terminal-label hot-text">Habits</div>
          <h3 className="data-title mt-2 text-sm text-white sm:text-base">Daily reinforcement</h3>
        </div>
        <div className="text-right">
          <div className="terminal-chip-muted px-2.5 py-1 text-[0.68rem] sm:px-3 sm:text-xs">{completedSet.size} / {system.habits.length || 0}</div>
          <div className="terminal-subtext mt-2 text-xs">{remainingCount} left</div>
        </div>
      </div>

      <div className="space-y-2">
        {system.habits.map((habit, index) => {
          const colorClass = index % 3 === 0 ? "money-secondary" : index % 3 === 1 ? "money-primary" : "ember-text"
          const streakWidth = `${Math.min(100, Math.round((habit.streak / 7) * 100))}%`

          return (
            <div
              key={habit.id}
              className="rounded-sm border border-white/8 bg-black/20 px-3 py-3 sm:px-4 sm:py-4"
              onPointerDown={() => startHoldDelete(habit.id, habit.name)}
              onPointerUp={stopHoldDelete}
              onPointerLeave={stopHoldDelete}
              onPointerCancel={stopHoldDelete}
              onContextMenu={(event) => {
                event.preventDefault()
                removeHabit(habit.id, habit.name)
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`grid h-9 w-9 place-items-center border ${colorClass} text-sm font-bold sm:h-11 sm:w-11 sm:text-lg`}>+</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-white sm:text-base">{habit.name}</div>
                    <div className={`text-xs font-semibold uppercase sm:text-sm ${colorClass}`}>{habit.streak}d</div>
                  </div>
                  <div className="thin-track mt-2.5 sm:mt-3">
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
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addHabit()
            }
          }}
          className="terminal-input min-w-0 flex-1 px-3 py-2.5 sm:py-3"
          placeholder="Add habit"
        />
        <button type="button" onClick={addHabit} className="terminal-button shrink-0 px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm">+ Add</button>
      </div>

      <div className="terminal-subtext mt-3 text-xs">Hold a habit to delete it.</div>
    </section>
  )
}
