"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import DailyTasks from "@/components/DailyTasks"
import HabitTracker from "@/components/HabitTracker"
import HeartbeatSignal from "@/components/ui/HeartbeatSignal"
import { useTeesha } from "@/context/TeeshaContext"
import {
  formatCurrency,
  getDailyLog,
  getHabitCompletionStats,
  getTaskDeadlineState,
  getTaskDueMinutes,
  getTimedTaskCompletionStats,
  getTodayTasks,
  updateDailyLog
} from "@/lib/dashboard"
import { getDayKey, getWeekStart } from "@/lib/systemLogic"
import { getQuoteOfTheDay } from "@/lib/quotes"
import { getRussianWordByOffset, getRussianWordOfTheDay } from "@/lib/russianWords"

function formatWordDate(date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)
}

function formatMinutes(minutes) {
  const safeMinutes = Math.max(0, Math.round(minutes || 0))
  const hours = Math.floor(safeMinutes / 60)
  const remaining = safeMinutes % 60
  if (hours <= 0) return `${remaining}m`
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

function getRecentRussianWords(days = 7) {
  return Array.from({ length: days }, (_, index) => getRussianWordByOffset(-index)).filter((entry) => entry.word)
}

function getSleepSeries(system, days = 7) {
  const start = getWeekStart()
  let lastValue = 0

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start)
    date.setDate(date.getDate() + index)
    const dayKey = date.toISOString().slice(0, 10)
    const sleep = Number(getDailyLog(system, dayKey).checkIn?.sleep)
    if (Number.isFinite(sleep) && sleep > 0) lastValue = sleep
    return {
      dayKey,
      date: dayKey.slice(5),
      value: Number.isFinite(sleep) && sleep > 0 ? sleep : lastValue
    }
  })
}

function getTaskCompletionSeries(system, days = 7) {
  const start = getWeekStart()

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start)
    date.setDate(date.getDate() + index)
    const dayKey = date.toISOString().slice(0, 10)
    const tasks = getTodayTasks(system, dayKey)
    const completed = getTimedTaskCompletionStats(tasks).completedOnTime
    const percent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    return {
      dayKey,
      date: dayKey.slice(5),
      value: percent
    }
  })
}

function BankBalanceCard({ balance, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(balance)

  return (
    <section className="terminal-card border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(5,19,35,0.95),rgba(13,24,44,0.92))] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_60px_rgba(0,0,0,0.35)] sm:px-5 sm:py-5">
      <div className="terminal-label text-cyan-200">Bank Balance</div>
      {editing ? (
        <div className="mt-4 space-y-3">
          <input
            type="number"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="terminal-input w-full border-cyan-400/30 bg-cyan-950/30 px-3 py-2.5 text-center text-2xl font-semibold text-cyan-100 sm:px-4 sm:py-3 sm:text-3xl"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onSave(Math.max(0, Number(draft) || 0))
                setEditing(false)
              }}
              className="terminal-button flex-1 px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="terminal-button-muted flex-1 px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="mt-4 w-full">
          <div className="neon-number money-primary text-[2rem] text-cyan-100 sm:text-[2.6rem]">{formatCurrency(balance)}</div>
          <div className="terminal-subtext mt-2 text-xs text-cyan-100/70 sm:text-sm">Current Balance</div>
        </button>
      )}
    </section>
  )
}

function QuoteCard({ quote }) {
  return (
    <section className="terminal-card border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(35,8,29,0.95),rgba(28,11,45,0.92))] px-4 py-4 sm:px-5 sm:py-5">
      <div className="terminal-label text-fuchsia-200">Quote Of The Day</div>
      <div className="mt-3 text-[0.95rem] leading-[1.6] text-white/92 italic sm:text-[1.08rem]">&quot;{quote.quote}&quot;</div>
    </section>
  )
}

function ProgressCard({ label, value, total, accentClass = "bg-[linear-gradient(90deg,rgba(var(--accent-strong-rgb),0.94),rgba(var(--accent-rgb),0.92))]" }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <section className="terminal-card border border-white/12 bg-[linear-gradient(135deg,rgba(8,16,24,0.94),rgba(12,20,31,0.92))] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/70">
        <span>{label}</span>
        <span>{value} / {total || 0}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/40">
        <div className={`h-full rounded-full shadow-[0_0_20px_rgba(var(--accent-rgb),0.28)] ${accentClass}`} style={{ width: `${percent}%` }} />
      </div>
    </section>
  )
}

function RussianWordCard({ word, onOpen }) {
  const meaning = Array.isArray(word?.meaning) ? word.meaning[0] : ""

  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <section className="terminal-card border border-amber-400/20 bg-[linear-gradient(135deg,rgba(33,20,5,0.95),rgba(40,18,10,0.92))] px-4 py-4 sm:px-5 sm:py-5">
        <div className="terminal-label text-amber-200">Russian Word Of The Day</div>
        <div className="data-title mt-3 text-[1.25rem] text-white sm:text-[1.55rem]">{word?.word ?? "..."}</div>
        {word?.phonetic ? <div className="terminal-subtext mt-2 text-xs text-amber-100/80 sm:text-sm">{word.phonetic}</div> : null}
        <div className="terminal-subtext mt-2 text-xs uppercase text-amber-100/75 sm:text-sm">{meaning}</div>
      </section>
    </button>
  )
}

function SleepTracker({ value, onSave }) {
  const [draft, setDraft] = useState(value)

  return (
    <section className="terminal-card border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(5,31,18,0.95),rgba(13,40,24,0.92))] px-4 py-4 sm:px-5 sm:py-5">
      <div className="terminal-label text-emerald-200">Sleep Tracker</div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-sm text-white/90">Hours slept today</div>
        <div className="text-lg font-semibold text-emerald-100">{Number(value) || 0}h</div>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="number"
          min="0"
          max="24"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="terminal-input min-w-0 flex-1 border-emerald-400/30 bg-emerald-950/20 px-3 py-2.5 text-white"
          placeholder="0"
        />
        <button type="button" onClick={() => onSave(Math.max(0, Number(draft) || 0))} className="terminal-button px-4 py-2.5 text-xs sm:text-sm">Save</button>
      </div>
    </section>
  )
}

function TaskCompletionChart({ data, label, dataKey, domain, formatter }) {
  return (
    <section className="terminal-card border border-orange-400/20 bg-[linear-gradient(135deg,rgba(32,16,5,0.95),rgba(24,15,11,0.92))] px-4 py-4 sm:px-5 sm:py-5">
      <div className="terminal-label text-orange-200">{label}</div>
      <div className="mt-4 h-44 w-full sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <XAxis dataKey="date" stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} domain={domain} />
            <Tooltip formatter={formatter} contentStyle={{ background: "rgba(9, 12, 17, 0.96)", border: "1px solid rgba(255, 169, 77, 0.22)", color: "#fff" }} />
            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} fill="url(#taskFill)" />
            <defs>
              <linearGradient id="taskFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function RussianModalContent() {
  const currentWord = getRussianWordOfTheDay()

  return (
    <div className="space-y-3">
      <section className="terminal-card border border-amber-400/20 bg-[linear-gradient(135deg,rgba(33,20,5,0.95),rgba(40,18,10,0.92))] px-4 py-4 sm:px-5 sm:py-5">
        <div className="terminal-label text-amber-200">Russian Word Details</div>
        <div className="mt-3 text-lg text-white">{currentWord?.word}</div>
        <div className="mt-1 text-sm text-white/75">{currentWord?.phonetic}</div>
        <div className="mt-2 text-sm text-white/85">{Array.isArray(currentWord?.meaning) ? currentWord.meaning.join(", ") : currentWord?.meaning}</div>
        <div className="mt-3 text-sm text-white/70">{currentWord?.usage}</div>
      </section>

      <section className="terminal-card border border-white/10 bg-[linear-gradient(135deg,rgba(15,17,24,0.98),rgba(24,13,34,0.94))] px-4 py-4 sm:px-5 sm:py-5">
        <div className="terminal-label text-amber-200">Past Words</div>
        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
          {getRecentRussianWords(7).map((entry) => (
            <div key={`${entry.date.toISOString()}-${entry.word?.id}`} className="rounded-sm border border-white/8 bg-black/20 px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{entry.word?.word}</div>
                  <div className="terminal-subtext mt-1 text-xs">{entry.word?.phonetic}</div>
                  <div className="terminal-subtext mt-1 text-xs uppercase text-white/65">{Array.isArray(entry.word?.meaning) ? entry.word.meaning[0] : ""}</div>
                </div>
                <div className="terminal-subtext text-xs text-white/65">{formatWordDate(entry.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function DeadlineWatchCard({ tasks, now }) {
  const currentMinutes = (now.getHours() * 60) + now.getMinutes()
  const timedPending = tasks
    .filter((task) => task.dueTime && !task.completed)
    .map((task) => ({
      task,
      dueMinutes: getTaskDueMinutes(task)
    }))
    .filter(({ dueMinutes }) => Number.isFinite(dueMinutes))
    .sort((left, right) => left.dueMinutes - right.dueMinutes)

  const future = timedPending.filter(({ dueMinutes }) => dueMinutes >= currentMinutes)
  const nextTask = future[0] ?? timedPending[0]

  if (!nextTask) {
    return (
      <section className="terminal-card px-4 py-4 sm:px-5 sm:py-5">
        <div className="terminal-label text-orange-200">Deadline Watch</div>
        <div className="terminal-subtext mt-3 text-xs">No task deadline set yet.</div>
      </section>
    )
  }

  const deadlineState = getTaskDeadlineState(nextTask.task, now)

  return (
    <section className="terminal-card px-4 py-4 sm:px-5 sm:py-5">
      <div className="terminal-label text-orange-200">Deadline Watch</div>
      <div className="mt-3 rounded-sm border border-white/10 bg-black/20 px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white">{nextTask.task.text}</div>
            <div className="terminal-subtext mt-1 text-xs">Due {nextTask.task.dueTime}</div>
          </div>
          <div className="terminal-subtext text-xs">{deadlineState.overdue ? "Late" : "On track"}</div>
        </div>
        <div className="thin-track mt-3">
          <div
            className={`thin-fill ${deadlineState.overdue ? "bg-[linear-gradient(90deg,#ff5c7c,#ff8c42)]" : ""}`}
            style={{ width: `${Math.round(deadlineState.progress * 100)}%` }}
          />
        </div>
        <div className="terminal-subtext mt-2 text-xs">
          {deadlineState.overdue ? "Deadline passed" : `${formatMinutes(deadlineState.remainingMinutes)} left`}
        </div>
      </div>
    </section>
  )
}

function WeekChartSection({ system }) {
  const [chartMode, setChartMode] = useState("sleep")
  const sleepSeries = getSleepSeries(system)
  const taskSeries = getTaskCompletionSeries(system)

  return (
    <section className="terminal-card px-4 py-4 sm:px-5 sm:py-5">
      <div className="terminal-label text-sky-200">Weekly Sleep / Execution</div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setChartMode("sleep")}
          className={`terminal-button-muted flex-1 px-3 py-2.5 text-xs sm:text-sm ${chartMode === "sleep" ? "border-[rgba(34,211,238,0.5)] text-white" : ""}`}
        >
          Sleep
        </button>
        <button
          type="button"
          onClick={() => setChartMode("completion")}
          className={`terminal-button-muted flex-1 px-3 py-2.5 text-xs sm:text-sm ${chartMode === "completion" ? "border-[rgba(245,158,11,0.5)] text-white" : ""}`}
        >
          Execution
        </button>
      </div>
      <div className="mt-3">
        <TaskCompletionChart
          data={chartMode === "sleep" ? sleepSeries : taskSeries}
          label={chartMode === "sleep" ? "Sleep Data - Last Week" : "Task Completion - Last Week"}
          dataKey="value"
          domain={chartMode === "sleep" ? [0, 12] : [0, 100]}
          formatter={chartMode === "sleep" ? (value) => [`${value}h`, "Sleep"] : (value) => [`${value}%`, "Completed"]}
        />
      </div>
    </section>
  )
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-2.5 sm:items-center sm:p-3">
      <div className="terminal-card terminal-modal w-full max-w-[420px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="section-heading mb-4">
          <h2 className="data-title text-base text-white">{title}</h2>
          <button type="button" onClick={onClose} className="terminal-button-muted px-2.5 py-2 text-[0.68rem] sm:px-3 sm:text-xs">Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Page() {
  const { system, setSystem } = useTeesha()
  const quote = useMemo(() => getQuoteOfTheDay(), [])
  const russianWord = useMemo(() => getRussianWordOfTheDay(), [])
  const [isRussianOpen, setIsRussianOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [heartbeatBoost, setHeartbeatBoost] = useState(0)
  const [burstActive, setBurstActive] = useState(false)
  const [strobeActive, setStrobeActive] = useState(false)

  const todayKey = getDayKey()
  const todayTasks = system ? getTodayTasks(system, todayKey) : []
  const todayTaskStats = getTimedTaskCompletionStats(todayTasks)
  const todayHabitStats = system
    ? getHabitCompletionStats(system, todayKey)
    : { total: 0, completed: 0, progress: 0 }
  const baseHeartbeatScore = Math.round((todayTaskStats.progress * 100 * 0.65) + (todayHabitStats.progress * 100 * 0.35))
  const combinedHeartbeatScore = Math.min(100, baseHeartbeatScore + heartbeatBoost)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(intervalId)
  }, [])

  function triggerFeedback({ fullComplete = false } = {}) {
    setBurstActive(true)
    setHeartbeatBoost(22)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(fullComplete ? [45, 60, 45, 60, 45] : [20, 26, 20])
    }

    window.setTimeout(() => setBurstActive(false), 1200)
    window.setTimeout(() => setHeartbeatBoost(0), 2400)

    if (fullComplete) {
      setStrobeActive(true)
      window.setTimeout(() => setStrobeActive(false), 3200)
    }
  }

  if (!system) return null

  return (
    <div className={`mx-auto max-w-[420px] px-2.5 pb-5 pt-3 sm:max-w-[520px] sm:px-4 sm:py-6 ${strobeActive ? "app-celebration app-strobe" : ""} ${burstActive ? "event-burst" : ""}`}>
      <div className="app-frame px-2.5 py-3 sm:px-4 sm:py-5">
        <div className="app-content space-y-3 sm:space-y-4">
          <div className="px-1 pb-1">
            <div className="terminal-label text-white/80">Execution System</div>
          </div>

          <BankBalanceCard
            balance={system.bankBalance ?? 0}
            onSave={(value) => setSystem((current) => ({ ...current, bankBalance: value }))}
          />

          <QuoteCard quote={quote} />

          <HeartbeatSignal completion={combinedHeartbeatScore} />

          <ProgressCard label="Habit progress" value={todayHabitStats.completed} total={todayHabitStats.total} />

          <ProgressCard label="Todo progress" value={todayTaskStats.completedOnTime} total={todayTaskStats.total} />

          <DeadlineWatchCard tasks={todayTasks} now={now} />

          <DailyTasks
            showProgressBar={false}
            onPositiveTick={({ allDone }) => triggerFeedback({ fullComplete: allDone })}
          />

          <HabitTracker onPositiveTick={({ allDone }) => triggerFeedback({ fullComplete: allDone })} />

          <RussianWordCard word={russianWord} onOpen={() => setIsRussianOpen(true)} />

          <SleepTracker
            value={getDailyLog(system, todayKey).checkIn?.sleep ?? 0}
            onSave={(value) => setSystem((current) => updateDailyLog(current, todayKey, (log) => ({
              ...log,
              checkIn: {
                ...log.checkIn,
                sleep: Math.max(0, Number(value) || 0)
              }
            })))}
          />

          <WeekChartSection system={system} />
        </div>
      </div>

      <Modal open={isRussianOpen} title="Russian Word" onClose={() => setIsRussianOpen(false)}>
        <RussianModalContent />
      </Modal>
    </div>
  )
}
