"use client"

import { useRef, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getTodayTasks, updateDailyLog } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function DailyTasks() {
  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")
  const holdTimerRef = useRef(null)

  if (!system) return null

  const todayKey = getDayKey()
  const tasks = getTodayTasks(system, todayKey)
  const completedCount = tasks.filter((task) => task.completed).length
  const remainingCount = Math.max(0, tasks.length - completedCount)

  function buildSystemWithTaskCount(currentSystem, nextTasks) {
    const todayCompleted = nextTasks.filter((task) => task.date === todayKey && task.completed).length

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
      { id: Date.now(), text: cleanText, completed: false, date: todayKey, createdAt: new Date().toISOString() }
    ]))
    setText("")
  }

  function toggleTask(id) {
    setSystem((current) => buildSystemWithTaskCount(current, current.tasks.map((task) => (
      task.id === id ? { ...task, completed: !task.completed } : task
    ))))
  }

  function removeTask(id) {
    setSystem((current) => buildSystemWithTaskCount(current, current.tasks.filter((task) => task.id !== id)))
  }

  function startHoldDelete(id) {
    window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = window.setTimeout(() => removeTask(id), 650)
  }

  function stopHoldDelete() {
    window.clearTimeout(holdTimerRef.current)
  }

  return (
    <section className="terminal-card px-4 py-4">
      <div className="section-heading mb-4">
        <div>
          <div className="terminal-label">Today&apos;s Tasks</div>
          <h3 className="data-title mt-2 text-base text-white">Execution list</h3>
        </div>
        <div className="text-right">
          <div className="terminal-chip-muted px-3 py-1 text-xs">{completedCount} / {tasks.length || 0}</div>
          <div className="terminal-subtext mt-2 text-xs">{remainingCount} left</div>
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-sm border border-white/8 bg-black/20 px-3 py-3"
            onPointerDown={() => startHoldDelete(task.id)}
            onPointerUp={stopHoldDelete}
            onPointerLeave={stopHoldDelete}
            onPointerCancel={stopHoldDelete}
            onContextMenu={(event) => {
              event.preventDefault()
              removeTask(task.id)
            }}
          >
            <StatusCheckbox checked={task.completed} onChange={() => toggleTask(task.id)} textClassName="text-lg text-white">
              {task.text}
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
              addTask()
            }
          }}
          className="terminal-input flex-1 px-3 py-3"
          placeholder="Add task"
        />
        <button type="button" onClick={addTask} className="terminal-button px-4 py-3 text-sm">+ Add</button>
      </div>

      <div className="terminal-subtext mt-3 text-xs">Hold a task to delete it.</div>
    </section>
  )
}
