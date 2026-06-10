"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import HabitTracker from "@/components/HabitTracker"
import { useTeesha } from "@/context/TeeshaContext"
import { getDailyLog, getHabitCompletionStats, updateDailyLog } from "@/lib/dashboard"
import { getDayKey, isHabitScheduledForDay } from "@/lib/systemLogic"
import { getQuoteOfTheDay } from "@/lib/quotes"
import { getRussianWordByOffset, getRussianWordOfTheDay } from "@/lib/russianWords"
import { clearStoredSystem } from "@/lib/storage"

const SLEEP_TARGET = 8

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseDayKey(dayKey) {
  const [year, month, day] = String(dayKey).split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function formatDayKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getRecentDays(days = 7) {
  const today = parseDayKey(getDayKey())

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - index))
    const dayKey = formatDayKey(date)

    return {
      dayKey,
      label: dayKey.slice(5),
      shortLabel: date.toLocaleDateString("en-US", { weekday: "short" })
    }
  })
}

function formatWordDate(date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)
}

function repairText(value) {
  if (typeof value !== "string") return ""
  if (!/[\u00c3\u00c2\u00d0\u00d1\u00e2]/.test(value)) return value

  try {
    const bytes = Uint8Array.from(Array.from(value, (character) => character.charCodeAt(0) & 255))
    return new TextDecoder("utf-8").decode(bytes)
  } catch {
    return value
  }
}

function getMeaning(word) {
  const meaning = Array.isArray(word?.meaning) ? word.meaning[0] : word?.meaning
  return repairText(meaning)
}

function getSleepSeries(system, days = 7) {
  return getRecentDays(days).map((day) => {
    const sleep = Number(getDailyLog(system, day.dayKey).checkIn?.sleep)
    const value = Number.isFinite(sleep) ? clamp(sleep, 0, 24) : 0

    return {
      ...day,
      sleep: value,
      target: SLEEP_TARGET
    }
  })
}

function getHabitSeries(system, days = 7) {
  return getRecentDays(days).map((day) => {
    const stats = getHabitCompletionStats(system, day.dayKey)

    return {
      ...day,
      completed: stats.completed,
      total: stats.total,
      percent: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }
  })
}

function getHabitDetailSeries(system, habitName, days = 14) {
  const habit = (system?.habits ?? []).find((entry) => entry.name === habitName)

  return getRecentDays(days).map((day) => {
    const completed = getDailyLog(system, day.dayKey).habitsCompleted ?? []
    const scheduled = habitName === "all" || (habit ? isHabitScheduledForDay(habit, day.dayKey) : false)
    const value = habitName === "all"
      ? getHabitCompletionStats(system, day.dayKey).completed
      : scheduled && completed.includes(habitName) ? 1 : 0

    return {
      ...day,
      scheduled,
      value
    }
  })
}

function getRussianSeries(system, days = 14) {
  return getRecentDays(days).map((day) => ({
    ...day,
    studied: getDailyLog(system, day.dayKey).checkIn?.russianReviewed ? 1 : 0
  }))
}

function getStreak(series, key) {
  let streak = 0

  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (!series[index][key]) break
    streak += 1
  }

  return streak
}

function getAverage(values) {
  const realValues = values.filter((value) => value > 0)
  if (realValues.length === 0) return 0
  return realValues.reduce((sum, value) => sum + value, 0) / realValues.length
}

function Card({ className = "", children }) {
  return (
    <section className={`terminal-card violet-card px-4 py-4 sm:px-5 sm:py-5 ${className}`}>
      {children}
    </section>
  )
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-[0.7rem] border border-white/10 bg-white/[0.035] px-3 py-2">
      <div className="terminal-subtext text-[0.68rem] uppercase tracking-[0.14em]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

function QuoteCard({ quote }) {
  return (
    <Card className="quote-card">
      <div className="terminal-label">Quote of the day</div>
      <div className="mt-3 text-[0.98rem] leading-relaxed text-white/90">&quot;{quote.quote}&quot;</div>
    </Card>
  )
}

function RussianWordCard({ word, studied, streak, rhythm, onToggleStudied, onOpen }) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <button type="button" onClick={onOpen} className="magic-tile grid h-16 w-16 shrink-0 place-items-center text-3xl">
          *
        </button>
        <div className="min-w-0 flex-1">
          <div className="terminal-label">Russian word of the day</div>
          <button type="button" onClick={onOpen} className="mt-2 block text-left">
            <div className="data-title text-[1.55rem] leading-tight text-white">{repairText(word?.word) || "..."}</div>
            {word?.phonetic ? <div className="terminal-subtext mt-1 text-xs">{repairText(word.phonetic)}</div> : null}
            <div className="terminal-subtext mt-1 text-xs uppercase text-white/70">{getMeaning(word)}</div>
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {rhythm.map((entry) => (
          <div
            key={entry.dayKey}
            className={`h-2 flex-1 rounded-full ${entry.studied ? "bg-[rgb(var(--accent-strong-rgb))] shadow-[0_0_14px_rgba(var(--accent-rgb),0.55)]" : "bg-white/10"}`}
            title={`${entry.label}: ${entry.studied ? "studied" : "not yet"}`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="terminal-subtext text-xs">{streak} day Russian streak</div>
        <button
          type="button"
          onClick={onToggleStudied}
          className={`terminal-button px-3 py-2 text-xs ${studied ? "studied-button" : ""}`}
        >
          {studied ? "Studied" : "Mark studied"}
        </button>
      </div>
    </Card>
  )
}

function SleepTracker({ value, average, onSave }) {
  const [draft, setDraft] = useState(String(value || ""))
  const numericValue = Number(value) || 0
  const quality = numericValue >= 7 && numericValue <= 9
    ? "On target"
    : numericValue > 0 && numericValue < 7
      ? "Short"
      : numericValue > 9
        ? "Long"
        : "Not logged"

  function saveSleep(nextValue = draft) {
    const parsed = clamp(Number(nextValue) || 0, 0, 24)
    setDraft(String(parsed || ""))
    onSave(parsed)
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="magic-tile sleep-orb grid h-16 w-16 shrink-0 place-items-center">
          <span className="sr-only">Sleep</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="terminal-label">Sleep tracker</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <div className="text-sm text-white/88">Hours slept today</div>
              <div className="terminal-subtext mt-1 text-xs">{quality}</div>
            </div>
            <div className="text-2xl font-bold text-white">{numericValue}h</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatPill label="Target" value={`${SLEEP_TARGET}h`} />
        <StatPill label="Avg" value={`${average.toFixed(1)}h`} />
        <StatPill label="Today" value={quality} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="number"
          min="0"
          max="24"
          step="0.25"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") saveSleep()
          }}
          className="terminal-input min-w-0 flex-1 rounded-[0.65rem] px-3 py-2.5 text-white"
          placeholder="0"
        />
        <button type="button" onClick={() => saveSleep()} className="terminal-button rounded-[0.65rem] px-4 py-2.5 text-xs">Save</button>
      </div>

      <div className="mt-3 flex gap-2">
        {[6, 7.5, 8, 9].map((hours) => (
          <button
            key={hours}
            type="button"
            onClick={() => saveSleep(hours)}
            className="terminal-button-muted flex-1 rounded-[0.65rem] px-2 py-2 text-[0.68rem]"
          >
            {hours}h
          </button>
        ))}
      </div>
    </Card>
  )
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="terminal-label">{title}</div>
          {subtitle ? <div className="terminal-subtext mt-1 text-xs">{subtitle}</div> : null}
        </div>
        {action}
      </div>
      <div className="mt-4 h-48 w-full sm:h-56">
        {children}
      </div>
    </Card>
  )
}

function SleepChart({ data }) {
  return (
    <ChartCard title="Sleep data" subtitle="Last 7 days, target line is 8h">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sleepGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-strong-rgb))" stopOpacity={0.92} />
              <stop offset="100%" stopColor="rgb(var(--accent-rgb))" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.52)" tickLine={false} axisLine={false} fontSize={11} minTickGap={12} />
          <YAxis stroke="rgba(255,255,255,0.52)" tickLine={false} axisLine={false} fontSize={11} domain={[0, 12]} />
          <Tooltip
            formatter={(value) => [`${value}h`, "Sleep"]}
            contentStyle={{ background: "rgba(18, 9, 34, 0.96)", border: "1px solid rgba(216, 121, 255, 0.32)", borderRadius: "12px", color: "#fff" }}
          />
          <ReferenceLine y={SLEEP_TARGET} stroke="rgba(255,255,255,0.36)" strokeDasharray="4 5" />
          <Area type="monotone" dataKey="sleep" stroke="rgb(var(--accent-strong-rgb))" strokeWidth={2.5} fill="url(#sleepGlow)" activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function HabitChart({ data, detailData, habits, selectedHabit, onSelectedHabitChange }) {
  const activeHabit = selectedHabit === "all" || habits.some((habit) => habit.name === selectedHabit)
    ? selectedHabit
    : "all"

  return (
    <ChartCard
      title="Habit data"
      subtitle={activeHabit === "all" ? "Habits fulfilled each day" : `Frequency for ${activeHabit}`}
      action={(
        <select
          value={activeHabit}
          onChange={(event) => onSelectedHabitChange(event.target.value)}
          className="terminal-select max-w-[9rem] rounded-[0.65rem] px-2 py-2 text-[0.68rem]"
        >
          <option value="all">All habits</option>
          {habits.map((habit) => (
            <option key={habit.id} value={habit.name}>{habit.name}</option>
          ))}
        </select>
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={activeHabit === "all" ? data : detailData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="habitGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-strong-rgb))" />
              <stop offset="100%" stopColor="rgb(var(--accent-rgb))" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.52)" tickLine={false} axisLine={false} fontSize={11} minTickGap={12} />
          <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.52)" tickLine={false} axisLine={false} fontSize={11} domain={[0, "dataMax"]} />
          <Tooltip
            formatter={(value, name, item) => {
              if (activeHabit === "all") {
                return [`${value} habits`, "Completed"]
              }

              return [item?.payload?.scheduled ? (value ? "Done" : "Missed") : "Off day", activeHabit]
            }}
            contentStyle={{ background: "rgba(18, 9, 34, 0.96)", border: "1px solid rgba(216, 121, 255, 0.32)", borderRadius: "12px", color: "#fff" }}
          />
          <Bar dataKey={activeHabit === "all" ? "completed" : "value"} radius={[8, 8, 2, 2]} fill="url(#habitGlow)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function RussianModalContent({ rhythm }) {
  const currentWord = getRussianWordOfTheDay()

  return (
    <div className="space-y-3">
      <Card>
        <div className="terminal-label">Russian word details</div>
        <div className="mt-3 data-title text-xl text-white">{repairText(currentWord?.word)}</div>
        <div className="terminal-subtext mt-1 text-sm">{repairText(currentWord?.phonetic)}</div>
        <div className="mt-2 text-sm text-white/85">{Array.isArray(currentWord?.meaning) ? currentWord.meaning.map(repairText).join(", ") : repairText(currentWord?.meaning)}</div>
        <div className="terminal-subtext mt-3 text-sm">{repairText(currentWord?.usage)}</div>
      </Card>

      <Card>
        <div className="terminal-label">Russian rhythm</div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {rhythm.map((entry) => (
            <div key={entry.dayKey} className={`rounded-[0.6rem] px-2 py-2 text-center text-[0.68rem] ${entry.studied ? "bg-[rgba(var(--accent-rgb),0.28)] text-white" : "bg-white/5 text-white/45"}`}>
              {entry.shortLabel}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="terminal-label">Past words</div>
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
          {Array.from({ length: 7 }, (_, index) => getRussianWordByOffset(-index)).map((entry) => (
            <div key={`${entry.date.toISOString()}-${entry.word?.id}`} className="rounded-[0.7rem] border border-white/8 bg-black/20 px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{repairText(entry.word?.word)}</div>
                  <div className="terminal-subtext mt-1 text-xs">{repairText(entry.word?.phonetic)}</div>
                  <div className="terminal-subtext mt-1 text-xs uppercase text-white/65">{getMeaning(entry.word)}</div>
                </div>
                <div className="terminal-subtext text-xs text-white/65">{formatWordDate(entry.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
      <div className="terminal-modal violet-card w-full max-w-[420px] rounded-[1rem] border border-white/12 px-4 py-4 shadow-[0_0_50px_rgba(var(--accent-rgb),0.22)] sm:px-5 sm:py-5">
        <div className="section-heading mb-4">
          <h2 className="data-title text-base text-white">{title}</h2>
          <button type="button" onClick={onClose} className="terminal-button-muted rounded-[0.65rem] px-3 py-2 text-xs">Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ClearStorageButton({ onClear }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="px-1 pb-7 pt-3">
        <button type="button" onClick={() => setOpen(true)} className="danger-button w-full rounded-[0.85rem] px-4 py-3 text-xs uppercase tracking-[0.16em]">
          Clear storage
        </button>
      </div>

      <Modal open={open} title="Delete everything?" onClose={() => setOpen(false)}>
        <div className="text-sm leading-relaxed text-white/78">
          This deletes the saved habits, sleep logs, Russian study marks, theme choice, and all app data on this device.
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="terminal-button-muted flex-1 rounded-[0.65rem] px-3 py-2.5 text-xs">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClear()
              setOpen(false)
            }}
            className="danger-button flex-1 rounded-[0.65rem] px-3 py-2.5 text-xs uppercase tracking-[0.12em]"
          >
            Yes, delete
          </button>
        </div>
      </Modal>
    </>
  )
}

export default function Page() {
  const { system, setSystem } = useTeesha()
  const quote = useMemo(() => getQuoteOfTheDay(), [])
  const russianWord = useMemo(() => getRussianWordOfTheDay(), [])
  const [isRussianOpen, setIsRussianOpen] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState("all")
  const [burstActive, setBurstActive] = useState(false)
  const [strobeActive, setStrobeActive] = useState(false)

  if (!system) return null

  const todayKey = getDayKey()
  const todayLog = getDailyLog(system, todayKey)
  const todayHabitStats = getHabitCompletionStats(system, todayKey)
  const sleepSeries = getSleepSeries(system)
  const habitSeries = getHabitSeries(system)
  const habitDetailSeries = getHabitDetailSeries(system, selectedHabit)
  const russianSeries = getRussianSeries(system)
  const russianStreak = getStreak(russianSeries, "studied")
  const sleepAverage = getAverage(sleepSeries.map((entry) => entry.sleep))
  const habitDaysWithHabits = habitSeries.filter((entry) => entry.total > 0)
  const habitPercentAverage = habitDaysWithHabits.length > 0
    ? Math.round(habitDaysWithHabits.reduce((sum, entry) => sum + entry.percent, 0) / habitDaysWithHabits.length)
    : 0
  const studiedToday = Boolean(todayLog.checkIn?.russianReviewed)

  function triggerFeedback({ fullComplete = false } = {}) {
    setBurstActive(true)

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(fullComplete ? [45, 60, 45, 60, 45] : [20, 26, 20])
    }

    document.body.classList.remove("happy-flash")
    void document.body.offsetWidth
    document.body.classList.add("happy-flash")

    window.setTimeout(() => {
      setBurstActive(false)
      document.body.classList.remove("happy-flash")
    }, 1000)

    if (fullComplete) {
      setStrobeActive(true)
      window.setTimeout(() => setStrobeActive(false), 2800)
    }
  }

  function saveTodayCheckIn(patch) {
    setSystem((current) => updateDailyLog(current, todayKey, (log) => ({
      ...log,
      checkIn: {
        ...log.checkIn,
        ...patch
      }
    })))
  }

  return (
    <div className={`mx-auto max-w-[420px] px-3 pb-4 pt-3 sm:max-w-[520px] sm:px-4 sm:py-6 ${strobeActive ? "app-celebration app-strobe" : ""} ${burstActive ? "event-burst" : ""}`}>
      <div className="app-frame rounded-[1.35rem] px-3 py-4 sm:px-4 sm:py-5">
        <div className="app-content space-y-3 sm:space-y-4">
          <header className="flex items-start justify-between gap-3 px-1 pb-1">
            <div>
              <div className="terminal-label text-white/70">Daily reinforcement</div>
              <h1 className="data-title mt-2 text-xl text-white sm:text-2xl">Track the essentials</h1>
            </div>
            <div className="terminal-chip-muted rounded-[0.7rem] px-3 py-1.5 text-[0.68rem]">
              {todayHabitStats.completed} / {todayHabitStats.total || 0}
            </div>
          </header>

          <div className="grid grid-cols-3 gap-2">
            <StatPill label="Habits" value={`${habitPercentAverage || 0}%`} />
            <StatPill label="Sleep" value={`${sleepAverage.toFixed(1)}h`} />
            <StatPill label="Russian" value={`${russianStreak}d`} />
          </div>

          <HabitTracker onPositiveTick={({ allDone }) => triggerFeedback({ fullComplete: allDone })} />

          <RussianWordCard
            word={russianWord}
            studied={studiedToday}
            streak={russianStreak}
            rhythm={russianSeries}
            onToggleStudied={() => {
              saveTodayCheckIn({ russianReviewed: !studiedToday })
              if (!studiedToday) triggerFeedback()
            }}
            onOpen={() => setIsRussianOpen(true)}
          />

          <QuoteCard quote={quote} />

          <SleepTracker
            value={todayLog.checkIn?.sleep ?? 0}
            average={sleepAverage}
            onSave={(value) => {
              saveTodayCheckIn({ sleep: value })
              triggerFeedback({ fullComplete: value >= 7 && value <= 9 })
            }}
          />

          <SleepChart data={sleepSeries} />

          <HabitChart
            data={habitSeries}
            detailData={habitDetailSeries}
            habits={system.habits}
            selectedHabit={selectedHabit}
            onSelectedHabitChange={setSelectedHabit}
          />

          <ClearStorageButton onClear={() => {
            clearStoredSystem()
            window.location.reload()
          }} />
        </div>
      </div>

      <Modal open={isRussianOpen} title="Russian word" onClose={() => setIsRussianOpen(false)}>
        <RussianModalContent rhythm={russianSeries} />
      </Modal>
    </div>
  )
}
