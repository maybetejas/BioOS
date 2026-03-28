"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getTodayTasks, updateDailyLog } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"
import StatusCheckbox from "@/components/ui/StatusCheckbox"

export default function DailyTasks() {
  const { system, setSystem } = useTeesha()
  const [text, setText] = useState("")

  if (!system) return null

  const todayKey = getDayKey()
  const tasks = getTodayTasks(system, todayKey)
  const completedCount = tasks.filter((task) => task.completed).length

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

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label">Operational Tasks</div>
          <h3 className="data-title mt-2 text-xl text-white">Execution List</h3>
        </div>
        <div className="terminal-chip-muted px-3 py-1 text-xs">{completedCount} / {tasks.length || 0}</div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="terminal-card px-3 py-3">
            <StatusCheckbox checked={task.completed} onChange={() => toggleTask(task.id)}>
              {task.text}
            </StatusCheckbox>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input value={text} onChange={(event) => setText(event.target.value)} className="terminal-input flex-1 px-3 py-3" placeholder="Add task" />
        <button type="button" onClick={addTask} className="terminal-button px-4 py-3 text-sm">Add</button>
      </div>
    </section>
  )
}
