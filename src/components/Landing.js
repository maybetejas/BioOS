"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { calculateMomentum, getSystemStatus } from "@/lib/momentum"
import { getAcquiredHabits } from "@/lib/systemLogic"

export default function Landing() {

  const { system, setSystem } = useTeesha()
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState("")

  if (!system) return null

  const momentum = calculateMomentum(system)
  const status = getSystemStatus(momentum)

  const completedTasks = system.dailyTodos.filter((t) => t.completed).length
  const totalTasks = system.dailyTodos.length

  const acquiredHabits = getAcquiredHabits(system.habits)

  const lastBio = system.biometrics.at(-1)
  const lastEmotion = system.emotions.at(-1)
  const morningInsight = system.insights?.morning
  const nightInsight = system.insights?.night

  function saveName() {
    const nextName = draftName.trim() || "Accountability Tracker"

    setSystem((current) => ({
      ...current,
      appName: nextName
    }))

    setDraftName(nextName)
    setIsEditingName(false)
  }

  return (
    <div>

      {isEditingName ? (
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              saveName()
            }

            if (e.key === "Escape") {
              setDraftName(system.appName)
              setIsEditingName(false)
            }
          }}
          className="mb-3 w-full border px-2 py-1 text-3xl font-bold"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraftName(system.appName)
            setIsEditingName(true)
          }}
          className="mb-3 text-left text-3xl font-bold"
        >
          {system.appName}
        </button>
      )}

      <div className="mb-2">
        Momentum Score: {momentum}
      </div>

      <div className="mb-2">
        System Status: {status}
      </div>

      <div className="mb-2">
        Tasks Completed: {completedTasks}/{totalTasks}
      </div>

      <details className="mb-2">
        <summary>
          Acquired Habits ({acquiredHabits.length})
        </summary>

        <div className="mt-2">
          {acquiredHabits.length > 0
            ? acquiredHabits.map((habit) => (
                <div key={habit.id}>
                  {habit.name}
                </div>
              ))
            : "No habits acquired yet."}
        </div>
      </details>

      {lastBio && (
        <div className="mb-2">
          Sleep: {lastBio.sleep}h | Energy: {lastBio.energy}
        </div>
      )}

      {lastEmotion && (
        <div>
          Mood: {lastEmotion.mood} | Stress: {lastEmotion.stress} | Focus: {lastEmotion.focus}
        </div>
      )}

      {morningInsight && (
        <div className="mt-4">
          Morning Insight: {morningInsight.text}
        </div>
      )}

      {nightInsight && (
        <div className="mt-2">
          Night Insight: {nightInsight.text}
        </div>
      )}

    </div>
  )
}
