"use client"

import { useEffect, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { calculateMomentum, getSystemStatus } from "@/lib/momentum"
import { getAcquiredHabits } from "@/lib/systemLogic"
import { getQuoteOfTheDay } from "@/lib/quotes"
import { getRussianWordByOffset } from "@/lib/russianWords"
import DailyStructure from "@/components/DailyStructure"
import HeartbeatSignal from "@/components/ui/HeartbeatSignal"

const MOMENTUM_GUIDE = [
  {
    label: "Dominant Momentum",
    range: "85-100",
    description: "Execution, structure, and state are aligned.",
    actions: "Protect this by finishing the active block, closing key tasks, and preserving sleep and stress control."
  },
  {
    label: "Stable Growth",
    range: "65-84",
    description: "Good control across most systems with room to sharpen.",
    actions: "Complete the current structure block and close one high-leverage task to push into dominant momentum."
  },
  {
    label: "Execution Drift",
    range: "45-64",
    description: "Some activity is present, but follow-through is fragmented.",
    actions: "Use your time block as anchor: finish one block cleanly, complete one habit, then close one task."
  },
  {
    label: "Energy Instability",
    range: "25-44",
    description: "Execution is being pulled down by low consistency or weak state.",
    actions: "Do one small block now, reduce decision load, and stabilize with hydration, food, and a short reset."
  },
  {
    label: "Recovery Mode",
    range: "0-24",
    description: "This is a reset state, not a failure state.",
    actions: "Start tiny: complete one micro-block, log your state, and regain control with one small, certain win."
  }
]

function momentumGradient() {
  return "linear-gradient(90deg, rgba(var(--accent-deep-rgb), 0.95), rgba(var(--accent-mid-rgb), 0.95), rgba(var(--accent-strong-rgb), 0.95))"
}

export default function Landing() {
  const { system, setSystem } = useTeesha()
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [isMomentumGuideOpen, setIsMomentumGuideOpen] = useState(false)
  const [isWordGuideOpen, setIsWordGuideOpen] = useState(false)
  const [wordDayOffset, setWordDayOffset] = useState(0)

  useEffect(() => {
    if (!isWordGuideOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsWordGuideOpen(false)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isWordGuideOpen])

  function formatWordDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(date)
  }

  function formatCategory(category) {
    return category.replaceAll("_", " ")
  }

  if (!system) return null

  const momentum = calculateMomentum(system)
  const status = getSystemStatus(momentum)
  const dailyQuote = getQuoteOfTheDay()
  const { date: selectedWordDate, word: selectedWord } = getRussianWordByOffset(wordDayOffset)
  const { word: todayWord } = getRussianWordByOffset(0)
  const momentumWidth = `${Math.max(0, Math.min(100, momentum))}%`

  const completedTasks = system.dailyTodos.filter((task) => task.completed).length
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
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={saveName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              saveName()
            }

            if (event.key === "Escape") {
              setDraftName(system.appName)
              setIsEditingName(false)
            }
          }}
          className="terminal-input mb-3 w-full px-3 py-2 text-3xl font-bold terminal-glow-text"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraftName(system.appName)
            setIsEditingName(true)
          }}
          className="terminal-glow-text mb-3 text-left text-3xl font-bold"
        >
          {system.appName}
        </button>
      )}

      <div className="mb-3 text-sm terminal-subtext">
        System Status: <span className="terminal-glow-text">{status}</span>
      </div>

      <button
        type="button"
        onClick={() => setIsMomentumGuideOpen(true)}
        className="terminal-card mb-4 w-full px-3 py-3 text-left"
      >
        <div className="terminal-label mb-2 flex items-center justify-between">
          <span>Momentum</span>
          <span>{momentum}/100</span>
        </div>

        <div className="h-2 w-full overflow-hidden bg-black/50">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: momentumWidth,
              background: momentumGradient()
            }}
          />
        </div>

        <HeartbeatSignal momentum={momentum} />
      </button>

      <div className="terminal-divider mb-5 border-l-2 pl-4">
        <p className="italic leading-7">
          &ldquo;{dailyQuote.quote}&rdquo;
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setWordDayOffset(0)
          setIsWordGuideOpen(true)
        }}
        className="terminal-card mb-4 w-full px-4 py-4 text-left"
      >
        <div className="terminal-label mb-1">
          Russian Word of the Day
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="terminal-glow-text text-2xl font-semibold">
              {todayWord.word}
            </div>

            <div className="terminal-subtext mt-1 text-sm">
              {todayWord.phonetic} | {todayWord.meaning.join(", ")}
            </div>
          </div>

          <div className="terminal-chip inline-flex w-fit px-3 py-1 text-sm no-underline">
            Open
          </div>
        </div>
      </button>

      <DailyStructure />

      <section className="terminal-section mb-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div className="terminal-mini">
          <div className="terminal-label">
            Tasks
          </div>
          <div className="mt-1 text-lg font-semibold">
            {completedTasks}/{totalTasks}
          </div>
        </div>

        <details className="terminal-mini">
          <summary className="terminal-label cursor-pointer list-none">
            Acquired Habits ({acquiredHabits.length})
          </summary>

          <div className="terminal-subtext mt-2 space-y-1 text-sm">
            {acquiredHabits.length > 0
              ? acquiredHabits.map((habit) => (
                  <div key={habit.id}>
                    {habit.name}
                  </div>
                ))
              : "No habits acquired yet."}
          </div>
        </details>

        <div className="terminal-mini">
          <div className="terminal-label">
            Biological
          </div>
          <div className="mt-1 text-sm">
            {lastBio
              ? `Sleep ${lastBio.sleep}h | Energy ${lastBio.energy}`
              : "No morning check-in yet."}
          </div>
        </div>

        <div className="terminal-mini">
          <div className="terminal-label">
            Emotional
          </div>
          <div className="mt-1 text-sm">
            {lastEmotion
              ? `Mood ${lastEmotion.mood} | Stress ${lastEmotion.stress} | Focus ${lastEmotion.focus}`
              : "No night check-in yet."}
          </div>
        </div>
      </section>

      <section className="terminal-section mb-4 space-y-4">
        <div>
          <div className="terminal-label">
            Morning Insight
          </div>
          <div className="terminal-subtext mt-2 text-sm">
            {morningInsight?.text ?? "Morning insight appears after morning check-in."}
          </div>
        </div>

        <div className="terminal-mini">
          <div className="terminal-label">
            Night Insight
          </div>
          <div className="terminal-subtext mt-2 text-sm">
            {nightInsight?.text ?? "Night insight appears after night check-in."}
          </div>
        </div>
      </section>

      {isMomentumGuideOpen && (
        <div className="terminal-card mb-4 px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="terminal-glow-text font-semibold">
              Momentum Guide
            </div>

            <button
              type="button"
              onClick={() => setIsMomentumGuideOpen(false)}
              className="terminal-button-muted px-2 py-1"
            >
              Close
            </button>
          </div>

          <p className="terminal-subtext mb-3 text-sm">
            Your score now blends tasks, habits, daily structure completion, and your latest biological and emotional state.
          </p>

          <div className="space-y-3">
            {MOMENTUM_GUIDE.map((item) => (
              <div key={item.label} className="terminal-divider border-l-2 pl-3">
                <div className="terminal-glow-text font-semibold">
                  {item.label} ({item.range})
                </div>

                <div className="text-sm">
                  {item.description}
                </div>

                <div className="terminal-subtext mt-1 text-sm">
                  {item.actions}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isWordGuideOpen && (
        <div
          className="terminal-overlay fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          onClick={() => setIsWordGuideOpen(false)}
        >
          <div
            className="terminal-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto px-5 py-5 text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="terminal-label mb-1">
                  Russian Word of the Day
                </div>

                <div className="terminal-subtext text-sm">
                  {wordDayOffset === 0 ? "Today" : `${Math.abs(wordDayOffset)} day${Math.abs(wordDayOffset) === 1 ? "" : "s"} ago`} | {formatWordDate(selectedWordDate)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWordGuideOpen(false)}
                className="terminal-button-muted px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <div className="terminal-card mb-5 px-4 py-4">
              <div className="terminal-glow-text text-3xl font-semibold">
                {selectedWord.word}
              </div>

              <div className="terminal-subtext mt-2 text-base">
                {selectedWord.phonetic}
              </div>

              <div className="mt-3 text-lg text-neutral-100">
                {selectedWord.meaning.join(", ")}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em]">
                <span className="terminal-chip px-3 py-1">
                  {selectedWord.difficulty}
                </span>
                <span className="terminal-chip-muted px-3 py-1">
                  {formatCategory(selectedWord.category)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="terminal-label mb-1">
                Usage
              </div>
              <p className="text-neutral-100">
                {selectedWord.usage}
              </p>
            </div>

            <div className="mb-4">
              <div className="terminal-label mb-2">
                Example
              </div>

              <div className="space-y-3">
                {selectedWord.examples.map((example) => (
                  <div key={`${selectedWord.id}-${example.russian}`} className="terminal-card px-4 py-3">
                    <div className="text-lg text-white">
                      {example.russian}
                    </div>
                    <div className="terminal-subtext mt-1 text-sm">
                      {example.translation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="terminal-label mb-2">
                How Russians might respond
              </div>

              {selectedWord.responses.length > 0 ? (
                <div className="space-y-3">
                  {selectedWord.responses.map((response) => (
                    <div key={`${selectedWord.id}-${response.russian}`} className="terminal-card px-4 py-3">
                      <div className="text-lg text-white">
                        {response.russian}
                      </div>
                      <div className="terminal-subtext mt-1 text-sm">
                        {response.phonetic}
                      </div>
                      <div className="mt-2 text-sm text-neutral-200">
                        {response.meaning}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="terminal-card px-4 py-3 terminal-subtext">
                  No common response saved for this one yet.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setWordDayOffset((current) => current - 1)}
                className="terminal-button px-4 py-2 text-sm"
              >
                Previous Day
              </button>

              <button
                type="button"
                onClick={() => setWordDayOffset((current) => Math.min(current + 1, 0))}
                disabled={wordDayOffset === 0}
                className="terminal-button-muted px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                {wordDayOffset === 0 ? "Today" : "Next Day"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
