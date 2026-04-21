"use client"

import { useEffect, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDailyCompletionPercent, getTaskDeadlineState, getTimedTaskCompletionStats, getTodayTasks, updateDailyLog } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function DailyTasks({ showProgressBar = true, onPositiveTick }) {
  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")
  const [dueTime, setDueTime] = useState("")
  const [holdTimerId, setHoldTimerId] = useState(null)
  const [now, setNow] = useState(() => new Date())

  const todayKey = getDayKey()
  const tasks = system ? getTodayTasks(system, todayKey) : []
  const { total, completedOnTime, progress } = getTimedTaskCompletionStats(tasks)
  const remainingCount = Math.max(0, total - completedOnTime)
  const percent = system ? getDailyCompletionPercent(system, todayKey) : 0

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(intervalId)
  }, [])

  if (!system) return null

  function vibrate(pattern) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern)
    }
  }

  function triggerQuickPulse() {
    document.body.classList.remove("happy-flash")
    void document.body.offsetWidth
    document.body.classList.add("happy-flash")
    window.setTimeout(() => document.body.classList.remove("happy-flash"), 900)
  }

  function buildSystemWithTaskCount(currentSystem, nextTasks) {
    const todayCompleted = getTimedTaskCompletionStats(nextTasks.filter((task) => task.date === todayKey)).completedOnTime

    return updateDailyLog({ ...currentSystem, tasks: nextTasks }, todayKey, (log) => ({
      ...log,
      tasksCompleted: todayCompleted
    }))
  }

  function addTask() {
    const cleanText = text.trim()
    if (!cleanText) return

    setSystem((current) => buildSystemWithTaskCount(current, [
      ...current.tasks,
      {
        id: Date.now(),
        text: cleanText,
        completed: false,
        date: todayKey,
        createdAt: new Date().toISOString(),
        dueTime: /^\d{1,2}:\d{2}$/.test(dueTime) ? dueTime : "",
        completedAt: null,
        completedOnTime: false
      }
    ]))
    setText("")
    setDueTime("")
  }

  function toggleTask(id) {
    setSystem((current) => {
      const now = new Date()

      return buildSystemWithTaskCount(current, current.tasks.map((task) => {
        if (task.id !== id) return task

        const nextCompleted = !task.completed
        const deadlineState = getTaskDeadlineState(task, now)
        const completedOnTime = !nextCompleted ? false : (!task.dueTime || !deadlineState.overdue)

        return {
          ...task,
          completed: nextCompleted,
          completedAt: nextCompleted ? now.toISOString() : null,
          completedOnTime
        }
      }))
    })

    const task = tasks.find((entry) => entry.id === id)
    const becameCompleted = task ? !task.completed : false

    if (becameCompleted) {
      const allDone = tasks.length > 0 && tasks.every((entry) => (entry.id === id ? true : entry.completed))
      vibrate([24, 35, 24])
      triggerQuickPulse()
      onPositiveTick?.({ allDone })
    }
  }

  function removeTask(id) {
    setSystem((current) => buildSystemWithTaskCount(current, current.tasks.filter((task) => task.id !== id)))
  }

  function startHoldDelete(id) {
    if (holdTimerId) window.clearTimeout(holdTimerId)
    const timerId = window.setTimeout(() => removeTask(id), 650)
    setHoldTimerId(timerId)
  }

  function stopHoldDelete() {
    if (holdTimerId) window.clearTimeout(holdTimerId)
    setHoldTimerId(null)
  }

  return (
    <section className="terminal-card px-3.5 py-3.5 sm:px-4 sm:py-4">
      <div className="section-heading mb-4">
        <div>
          <div className="terminal-label">Today&apos;s Tasks</div>
          <h3 className="data-title mt-2 text-sm text-white sm:text-base">Execution list</h3>
        </div>
        <div className="text-right">
          <div className="terminal-chip-muted px-2.5 py-1 text-[0.68rem] sm:px-3 sm:text-xs">{completedOnTime} / {total || 0}</div>
          <div className="terminal-subtext mt-2 text-xs">{remainingCount} left</div>
        </div>
      </div>

      {showProgressBar ? (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/70">
            <span>Daily execution</span>
            <span>{percent}%</span>
          </div>
          <div className="progress-track mt-2 h-2">
            <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {tasks.map((task) => {
          const deadlineState = task.dueTime ? getTaskDeadlineState(task, now) : null

          return (
            <div
              key={task.id}
              className="rounded-sm border border-white/8 bg-black/20 px-3 py-2.5 sm:py-3"
              onPointerDown={() => startHoldDelete(task.id)}
              onPointerUp={stopHoldDelete}
              onPointerLeave={stopHoldDelete}
              onPointerCancel={stopHoldDelete}
              onContextMenu={(event) => {
                event.preventDefault()
                removeTask(task.id)
              }}
            >
              <StatusCheckbox checked={task.completed} onChange={() => toggleTask(task.id)} textClassName="text-sm text-white sm:text-base">
                {task.text}
              </StatusCheckbox>
              {deadlineState ? (
                <div className="mt-2">
                  <div className="flex items-center justify-between gap-2 text-[0.65rem] uppercase tracking-[0.16em] text-white/55">
                    <span>Due {task.dueTime}</span>
                    <span>{deadlineState.overdue ? "Late" : "On track"}</span>
                  </div>
                  <div className="thin-track mt-1.5">
                    <div
                      className={`thin-fill ${deadlineState.overdue ? "bg-[linear-gradient(90deg,#ff5c7c,#ff8c42)]" : ""}`}
                      style={{ width: `${Math.round(deadlineState.progress * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addTask()
            }
          }}
          className="terminal-input min-w-0 flex-1 px-3 py-2.5 sm:py-3"
          placeholder="Add task"
        />
        <input
          type="time"
          value={dueTime}
          onChange={(event) => setDueTime(event.target.value)}
          className="terminal-input min-w-0 px-3 py-2.5 sm:py-3"
        />
        <button type="button" onClick={addTask} className="terminal-button shrink-0 px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm">+ Add</button>
      </div>

      <div className="terminal-subtext mt-2 text-xs">Set a time if you want the task to count only when finished before the deadline.</div>
      <div className="terminal-subtext mt-3 text-xs">Hold a task to delete it.</div>
    </section>
  )
}
