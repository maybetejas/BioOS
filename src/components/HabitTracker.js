"use client"

import { useRef, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDailyLog, getScheduledHabits, updateDailyLog } from "@/lib/dashboard"
import { getDayKey, getPreviousScheduledHabitDayKey, HABIT_REPEAT_DAYS } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" }
]

function getPreviousCompletedDay(dailyLogs, habitName, todayKey) {
  return Object.entries(dailyLogs ?? {})
    .filter(([dayKey, log]) => dayKey < todayKey && (log?.habitsCompleted ?? []).includes(habitName))
    .map(([dayKey]) => dayKey)
    .sort()
    .at(-1) ?? null
}

function formatRepeatLabel(repeatDays = HABIT_REPEAT_DAYS) {
  if (repeatDays.length === HABIT_REPEAT_DAYS.length) {
    return "Daily"
  }

  return WEEKDAY_OPTIONS
    .filter((day) => repeatDays.includes(day.value))
    .map((day) => day.label)
    .join(", ")
}

export default function HabitTracker({ onPositiveTick }) {
  const { system, setSystem } = useTeesha()
  const [name, setName] = useState("")
  const [repeatDays, setRepeatDays] = useState(HABIT_REPEAT_DAYS)
  const holdTimerRef = useRef(null)

  if (!system) return null

  const todayKey = getDayKey()
  const todayLog = getDailyLog(system, todayKey)
  const completedSet = new Set(todayLog.habitsCompleted)
  const activeHabits = getScheduledHabits(system, todayKey)
  const completedCount = activeHabits.filter((habit) => completedSet.has(habit.name)).length
  const remainingCount = Math.max(0, activeHabits.length - completedCount)
  const progress = activeHabits.length > 0 ? completedCount / activeHabits.length : 0

  function toggleRepeatDay(day) {
    setRepeatDays((current) => {
      if (current.includes(day)) {
        return current.length === 1 ? current : current.filter((entry) => entry !== day)
      }

      return [...current, day].sort((left, right) => left - right)
    })
  }

  function addHabit() {
    const cleanName = name.trim()
    if (!cleanName) return

    setSystem((current) => ({
      ...current,
      habits: [...current.habits, { id: Date.now(), name: cleanName, repeatDays, streak: 0, lastCompletedDate: null }]
    }))
    setName("")
    setRepeatDays(HABIT_REPEAT_DAYS)
  }

  function toggleHabit(habitName) {
    const wasCompleted = completedSet.has(habitName)

    setSystem((current) => {
      const currentLog = getDailyLog(current, todayKey)
      const currentCompleted = currentLog.habitsCompleted ?? []
      const isCompleted = currentCompleted.includes(habitName)
      const nextCompleted = isCompleted ? currentCompleted.filter((entry) => entry !== habitName) : [...currentCompleted, habitName]

      const nextHabits = current.habits.map((habit) => {
        if (habit.name !== habitName) return habit

        if (isCompleted) {
          const previousCompletedDay = getPreviousCompletedDay(current.dailyLogs, habit.name, todayKey)

          return {
            ...habit,
            streak: Math.max(0, habit.streak - 1),
            lastCompletedDate: habit.lastCompletedDate === todayKey ? previousCompletedDay : habit.lastCompletedDate
          }
        }

        const previousScheduledDay = getPreviousScheduledHabitDayKey(habit, todayKey)

        return {
          ...habit,
          streak: habit.lastCompletedDate === previousScheduledDay ? habit.streak + 1 : 1,
          lastCompletedDate: todayKey
        }
      })

      return updateDailyLog({ ...current, habits: nextHabits }, todayKey, (log) => ({
        ...log,
        habitsCompleted: nextCompleted
      }))
    })

    if (!wasCompleted) {
      const nextCompletedCount = completedCount + 1
      const allDone = activeHabits.length > 0 && nextCompletedCount >= activeHabits.length
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([18, 28, 18])
      }
      document.body.classList.remove("happy-flash")
      void document.body.offsetWidth
      document.body.classList.add("happy-flash")
      window.setTimeout(() => document.body.classList.remove("happy-flash"), 900)
      onPositiveTick?.({ allDone })
    }
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
          <div className="terminal-chip-muted px-2.5 py-1 text-[0.68rem] sm:px-3 sm:text-xs">{completedCount} / {activeHabits.length || 0}</div>
          <div className="terminal-subtext mt-2 text-xs">{remainingCount} left</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/70">
          <span>Habit progress</span>
          <span>{completedCount} / {activeHabits.length || 0}</span>
        </div>
        <div className="progress-track mt-2 h-2">
          <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {activeHabits.length === 0 ? (
          <div className="rounded-sm border border-white/8 bg-black/20 px-3 py-4 text-sm text-white/72 sm:px-4">
            No habits scheduled today.
          </div>
        ) : null}
        {activeHabits.map((habit, index) => {
          const colorClass = index % 3 === 0 ? "money-secondary" : index % 3 === 1 ? "money-primary" : "ember-text"
          const streakWidth = `${Math.min(100, Math.round((habit.streak / 7) * 100))}%`
          const repeatLabel = formatRepeatLabel(habit.repeatDays)

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
                    <div className="min-w-0">
                      <div className="break-words text-sm font-semibold text-white sm:text-base">{habit.name}</div>
                      <div className="terminal-subtext mt-1 text-[0.68rem] uppercase tracking-[0.12em]">{repeatLabel}</div>
                    </div>
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

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {WEEKDAY_OPTIONS.map((day) => {
          const selected = repeatDays.includes(day.value)

          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleRepeatDay(day.value)}
              className={`rounded-[0.55rem] border px-1.5 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.08em] transition ${
                selected
                  ? "border-[rgba(var(--accent-rgb),0.62)] bg-[rgba(var(--accent-rgb),0.20)] text-white"
                  : "border-white/8 bg-white/[0.035] text-white/45"
              }`}
              aria-pressed={selected}
            >
              {day.label}
            </button>
          )
        })}
      </div>

      <div className="terminal-subtext mt-3 text-xs">Hold a habit to delete it.</div>
    </section>
  )
}
