"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { calculateMomentum, getSystemStatus } from "@/lib/momentum"
import { getAcquiredHabits } from "@/lib/systemLogic"
import { getQuoteOfTheDay } from "@/lib/quotes"

const MOMENTUM_GUIDE = [
  {
    label: "Dominant Momentum",
    range: "80-100",
    tone: "text-amber-700",
    description: "You are executing hard and staying emotionally steady.",
    actions: "Keep tasks moving, finish habits early, and protect your energy so the pace stays sustainable."
  },
  {
    label: "Stable Growth",
    range: "60-79",
    tone: "text-emerald-600",
    description: "You are on track and building momentum well.",
    actions: "Complete one more key task, close remaining habits, and log a strong mood or energy check-in."
  },
  {
    label: "Execution Drift",
    range: "40-59",
    tone: "text-sky-600",
    description: "Progress is happening, but not enough to feel locked in yet.",
    actions: "Finish a few tasks now, remove distractions, and tighten the rest of your day into smaller wins."
  },
  {
    label: "Energy Instability",
    range: "20-39",
    tone: "text-orange-600",
    description: "Low consistency or low energy is pulling the day down.",
    actions: "Handle one easy task, complete one habit, and improve your basics like food, water, sleep, or a short walk."
  },
  {
    label: "Recovery Mode",
    range: "0-19",
    tone: "text-rose-600",
    description: "This is a reset state, not a failure state.",
    actions: "Start tiny: log your mood or energy, finish one simple task, and rebuild control with the smallest useful action."
  }
]

const STATUS_STYLES = {
  "Dominant Momentum": "text-amber-700",
  "Stable Growth": "text-emerald-600",
  "Execution Drift": "text-sky-600",
  "Energy Instability": "text-orange-600",
  "Recovery Mode": "text-rose-600"
}

export default function Landing() {

  const { system, setSystem } = useTeesha()
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [isMomentumGuideOpen, setIsMomentumGuideOpen] = useState(false)

  if (!system) return null

  const momentum = calculateMomentum(system)
  const status = getSystemStatus(momentum)
  const dailyQuote = getQuoteOfTheDay()
  const statusStyle = STATUS_STYLES[status] ?? "border-neutral-300 text-neutral-700"

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
        <button
          type="button"
          onClick={() => setIsMomentumGuideOpen(true)}
          className="underline underline-offset-2"
        >
          Momentum Score: {momentum}
        </button>
      </div>

      <div className={`mb-2 ${statusStyle}`}>
        System Status: {status}
      </div>

      <div className="mb-4 border-l-2 border-neutral-400 pl-4 text-neutral-700">
        <p className="italic leading-7">
          &ldquo;{dailyQuote.quote}&rdquo;
        </p>
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

      {isMomentumGuideOpen && (
        <div className="mb-4 border px-3 py-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="font-semibold">
              Momentum Guide
            </div>

            <button
              type="button"
              onClick={() => setIsMomentumGuideOpen(false)}
              className="border px-2"
            >
              Close
            </button>
          </div>

          <p className="mb-3 text-sm text-gray-600">
            Your score comes from completed tasks, completed habits, and your latest mood and energy logs.
          </p>

          <div className="space-y-3">
            {MOMENTUM_GUIDE.map((item) => (
              <div key={item.label} className="border-l-2 pl-3">
                <div className={`font-semibold ${item.tone}`}>
                  {item.label} ({item.range})
                </div>

                <div className="text-sm">
                  {item.description}
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  {item.actions}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
