"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTeesha } from "@/context/TeeshaContext"
import DailyTasks from "@/components/DailyTasks"
import HabitTracker from "@/components/HabitTracker"
import MonthlyGoals from "@/components/MonthlyGoals"
import WeeklyGoals from "@/components/WeeklyGoals"
import {
  formatCurrency,
  getDailyLog,
  getMoneySeries,
  getMomentumSeries,
  getMonthGoals,
  getTodayTasks,
  getWeekGoals,
  updateDailyLog
} from "@/lib/dashboard"
import { calculateMomentum } from "@/lib/momentum"
import { getQuoteOfTheDay } from "@/lib/quotes"
import { getRussianWordByOffset, getRussianWordOfTheDay, RUSSIAN_WORDS } from "@/lib/russianWords"
import { getDayKey, getMonthKey, getWeekKey } from "@/lib/systemLogic"

const CHECKIN_FIELDS = [
  { key: "sleep", label: "Sleep", suffix: "h" },
  { key: "energy", label: "Energy" },
  { key: "mood", label: "Mood" },
  { key: "focus", label: "Focus" },
  { key: "stress", label: "Stress" }
]

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(values) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getRecentDayKeys(system, count = 7) {
  return Object.keys(system?.dailyLogs ?? {}).sort().slice(-count)
}

function getRollingTaskPercent(system, todayKey) {
  const todayTasks = getTodayTasks(system, todayKey)

  if (todayTasks.length > 0) {
    const done = todayTasks.filter((task) => task.completed).length
    return clampPercent((done / todayTasks.length) * 100)
  }

  const recentDayKeys = getRecentDayKeys(system)
  const samples = recentDayKeys
    .map((dayKey) => {
      const tasks = getTodayTasks(system, dayKey)

      if (tasks.length === 0) {
        return null
      }

      return tasks.filter((task) => task.completed).length / tasks.length
    })
    .filter((value) => value !== null)

  return clampPercent(average(samples) * 100)
}

function getRollingHabitPercent(system, todayLog) {
  if ((system.habits?.length ?? 0) > 0) {
    const completedHabits = todayLog.habitsCompleted.length

    if (completedHabits > 0) {
      return clampPercent((completedHabits / system.habits.length) * 100)
    }
  }

  const recentDayKeys = getRecentDayKeys(system)
  const samples = recentDayKeys
    .map((dayKey) => {
      const log = getDailyLog(system, dayKey)

      if ((system.habits?.length ?? 0) === 0) {
        return null
      }

      return (log.habitsCompleted.length || 0) / system.habits.length
    })
    .filter((value) => value !== null)

  return clampPercent(average(samples) * 100)
}

function getProgressPercent(items) {
  if (items.length === 0) {
    return 0
  }

  return clampPercent((items.filter((item) => item.completed).length / items.length) * 100)
}

function getTrendSignal(delta, value = 0) {
  if (delta > 0 || (value > 80 && delta >= 0)) {
    return { symbol: "▲", label: "Rising", className: "text-emerald-300" }
  }

  if (delta < 0) {
    return { symbol: "▼", label: "Falling", className: "text-rose-300" }
  }

  return { symbol: "●", label: "Stable", className: "text-white/60" }
}

function getSparkValues(values, count) {
  const recent = values.slice(-count)

  if (recent.length === 0) {
    return Array.from({ length: count }, (_, index) => ({
      id: `empty-${index}`,
      height: 14
    }))
  }

  const maxValue = Math.max(...recent.map((value) => Number(value) || 0), 1)

  return recent.map((value, index) => ({
    id: `${index}-${value}`,
    height: 14 + Math.round(((Number(value) || 0) / maxValue) * 34)
  }))
}

function getCheckInChartData(system, count = 7) {
  return getRecentDayKeys(system, count).map((dayKey) => {
    const log = getDailyLog(system, dayKey)

    return {
      dayKey,
      date: dayKey.slice(5),
      sleep: Number(log.checkIn?.sleep) || 0,
      energy: Number(log.checkIn?.energy) || 0,
      mood: Number(log.checkIn?.mood) || 0,
      focus: Number(log.checkIn?.focus) || 0,
      stress: Number(log.checkIn?.stress) || 0
    }
  })
}

function BankBalanceCard({ balance, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(balance)

  useEffect(() => {
    setDraft(balance)
  }, [balance])

  function saveBalance() {
    onSave(Math.max(0, Number(draft) || 0))
    setEditing(false)
  }

  return (
    <section className="terminal-card px-5 py-5 text-center">
      <div className="terminal-label">Bank Balance</div>
      {editing ? (
        <div className="mt-4 space-y-3">
          <input
            type="number"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                saveBalance()
              }
            }}
            className="terminal-input w-full px-4 py-3 text-center text-3xl font-semibold"
          />
          <div className="flex gap-2">
            <button type="button" onClick={saveBalance} className="terminal-button flex-1 px-4 py-3 text-sm">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="terminal-button-muted flex-1 px-4 py-3 text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="mt-4 w-full">
          <div className="neon-number text-[2.6rem] money-primary">{formatCurrency(balance)}</div>
          <div className="terminal-subtext mt-2 text-sm">Current Balance</div>
        </button>
      )}
    </section>
  )
}

function CheckInTrendCard({ chartData, selectedMetric, onSelectMetric }) {
  const selectedField = CHECKIN_FIELDS.find((field) => field.key === selectedMetric) ?? CHECKIN_FIELDS[0]
  const maxValue = selectedField.key === "sleep" ? 12 : 10

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CHECKIN_FIELDS.map((field) => (
          <button
            key={field.key}
            type="button"
            onClick={() => onSelectMetric(field.key)}
            className={`terminal-button-muted px-3 py-2 text-xs ${selectedMetric === field.key ? "border-[rgba(var(--accent-rgb),0.55)] text-white" : ""}`}
          >
            {field.label}
          </button>
        ))}
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <XAxis dataKey="date" stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} domain={[0, maxValue]} />
            <Tooltip
              formatter={(value) => [`${value}${selectedField.suffix ?? ""}`, selectedField.label]}
              contentStyle={{
                background: "rgba(9, 12, 17, 0.96)",
                border: "1px solid rgba(var(--accent-rgb), 0.2)",
                color: "#fff"
              }}
            />
            <Line type="monotone" dataKey={selectedMetric} stroke="rgb(var(--accent-rgb))" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MainSystemCard({ progressItems, momentum, momentumSignal, momentumBars, onLogDay, onOpenMomentum, checkInChartData, selectedCheckInMetric, onSelectCheckInMetric }) {
  return (
    <section className="terminal-section px-5 py-5">
      <div className="space-y-6">
        <div className="space-y-4">
          {progressItems.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="terminal-label text-[0.62rem] text-white/75">{item.label}</div>
                  <div className="terminal-subtext mt-1 text-xs">{item.remainingLabel}</div>
                </div>
                <div className="text-sm font-semibold text-white">{item.percent}%</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,rgb(var(--accent-rgb)),rgba(var(--hot-rgb),0.9))]" style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={onOpenMomentum} className="grid w-full grid-cols-[auto_1fr] items-end gap-4 text-left">
          <div>
            <div className="terminal-label">Momentum</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="neon-number text-[2.4rem] money-primary">{momentum}</div>
              <div className={`text-sm font-semibold ${momentumSignal.className}`}>{momentumSignal.symbol}</div>
            </div>
          </div>
          <div className="flex h-12 items-end gap-1.5">
            {momentumBars.map((bar) => (
              <div key={bar.id} className="flex-1 rounded-t-sm bg-[linear-gradient(180deg,rgba(var(--accent-rgb),0.28),rgba(var(--accent-rgb),0.88))]" style={{ height: `${bar.height}px` }} />
            ))}
          </div>
        </button>

        <button type="button" onClick={onLogDay} className="terminal-button w-full px-4 py-3 text-sm">Log Day</button>

        <CheckInTrendCard
          chartData={checkInChartData}
          selectedMetric={selectedCheckInMetric}
          onSelectMetric={onSelectCheckInMetric}
        />
      </div>
    </section>
  )
}

function MomentumChartCard({ data }) {
  return (
    <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(-7)} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <XAxis dataKey="date" stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "rgba(9, 12, 17, 0.96)",
                border: "1px solid rgba(var(--accent-rgb), 0.2)",
                color: "#fff"
              }}
            />
            <Bar dataKey="score" fill="rgb(var(--accent-rgb))" radius={[3, 3, 0, 0]} name="Momentum" />
          </BarChart>
        </ResponsiveContainer>
    </div>
  )
}

function formatWordDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date)
}

function RussianWordModalContent({
  activeWord,
  wordOffset,
  onChangeOffset,
  onSelectWord
}) {
  const meanings = Array.isArray(activeWord?.meaning) ? activeWord.meaning : []
  const examples = Array.isArray(activeWord?.examples) ? activeWord.examples : []
  const responses = Array.isArray(activeWord?.responses) ? activeWord.responses : []
  const historyDays = 30
  const recentWords = Array.from({ length: historyDays }, (_, index) => getRussianWordByOffset(-index)).filter((entry) => entry.word)
  const phraseBank = RUSSIAN_WORDS.filter(Boolean)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => onChangeOffset(wordOffset - 1)} className="terminal-button-muted px-3 py-2 text-xs">Prev Day</button>
        <div className="terminal-chip-muted px-3 py-1 text-[0.62rem]">{formatWordDate(activeWord.date)}</div>
        <button type="button" onClick={() => onChangeOffset(wordOffset + 1)} className="terminal-button-muted px-3 py-2 text-xs">Next Day</button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="terminal-label">Day Slider</div>
          <div className="terminal-subtext text-xs">{Math.abs(wordOffset)} day back</div>
        </div>
        <input
          type="range"
          min={-180}
          max={0}
          step={1}
          value={Math.min(0, Math.max(-180, wordOffset))}
          onChange={(event) => onChangeOffset(Number(event.target.value))}
          className="w-full accent-[var(--accent)]"
        />
      </div>

      <div>
        <div className="data-title text-[1.6rem] text-white">{activeWord.word?.word}</div>
        {activeWord.word?.phonetic ? <div className="terminal-subtext mt-2 text-sm">{activeWord.word.phonetic}</div> : null}
        {meanings.length > 0 ? <div className="mt-3 text-lg text-white">{meanings.join(", ")}</div> : null}
        {activeWord.word?.usage ? <div className="terminal-subtext mt-2 text-sm">{activeWord.word.usage}</div> : null}
      </div>

      {examples.length > 0 ? (
        <div className="space-y-2">
          <div className="terminal-label">Examples</div>
          {examples.slice(0, 2).map((example, index) => (
            <div key={`${example.translation}-${index}`} className="rounded-sm border border-white/8 bg-black/20 px-3 py-3">
              <div className="text-sm text-white">{example.russian}</div>
              <div className="terminal-subtext mt-1 text-sm">{example.translation}</div>
            </div>
          ))}
        </div>
      ) : null}

      {responses.length > 0 ? (
        <div className="space-y-2">
          <div className="terminal-label">Responses</div>
          {responses.slice(0, 2).map((response, index) => (
            <div key={`${response.meaning}-${index}`} className="rounded-sm border border-white/8 bg-black/20 px-3 py-3">
              <div className="text-sm text-white">{response.russian}</div>
              <div className="terminal-subtext mt-1 text-sm">{response.meaning}{response.phonetic ? ` • ${response.phonetic}` : ""}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-sm border border-white/8 bg-black/20 px-3 py-3">
          <div className="terminal-label">Difficulty</div>
          <div className="mt-2 text-sm text-white capitalize">{activeWord.word?.difficulty ?? "Unknown"}</div>
        </div>
        <div className="rounded-sm border border-white/8 bg-black/20 px-3 py-3">
          <div className="terminal-label">Category</div>
          <div className="mt-2 text-sm text-white capitalize">{String(activeWord.word?.category ?? "general").replace(/_/g, " ")}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="section-heading mb-0">
          <div className="terminal-label">Seen History</div>
          <div className="terminal-subtext text-xs">Last {historyDays} days</div>
        </div>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {recentWords.map((entry) => (
            <button
              key={`${entry.date.toISOString()}-${entry.word?.id}`}
              type="button"
              onClick={() => onSelectWord(entry.date)}
              className="w-full rounded-sm border border-white/8 bg-black/20 px-3 py-3 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{entry.word?.word}</div>
                  <div className="terminal-subtext mt-1 text-xs uppercase">
                    {Array.isArray(entry.word?.meaning) ? entry.word.meaning[0] : ""}
                  </div>
                </div>
                <div className="terminal-subtext text-xs">{formatWordDate(entry.date)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="section-heading mb-0">
          <div className="terminal-label">Phrase Bank</div>
          <div className="terminal-subtext text-xs">{phraseBank.length} words / phrases</div>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {phraseBank.map((entry) => (
            <div key={entry.id} className="rounded-sm border border-white/8 bg-black/20 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{entry.word}</div>
                  {entry.phonetic ? <div className="terminal-subtext mt-1 text-xs">{entry.phonetic}</div> : null}
                </div>
                <div className="terminal-subtext text-xs capitalize">{String(entry.category ?? "general").replace(/_/g, " ")}</div>
              </div>
              {Array.isArray(entry.meaning) && entry.meaning.length > 0 ? (
                <div className="terminal-subtext mt-2 text-sm">{entry.meaning.join(", ")}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuoteCard({ quote }) {
  return (
    <section className="terminal-card px-5 py-5">
      <div className="terminal-label">Quote Of The Day</div>
      <div className="mt-3 text-[1.02rem] leading-[1.45] text-white/92 italic sm:text-[1.08rem]">&quot;{quote.quote}&quot;</div>
    </section>
  )
}

function RussianWordCard({ word, onOpen }) {
  const meaning = Array.isArray(word?.meaning) ? word.meaning[0] : ""

  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <section className="terminal-card px-5 py-5">
        <div className="terminal-label">Russian Word</div>
        <div className="data-title mt-3 text-[1.55rem] text-white">{word?.word ?? "..."}</div>
        <div className="terminal-subtext mt-2 text-sm uppercase">{meaning}</div>
      </section>
    </button>
  )
}

function GoalsSummaryCard({ label, percent, remainingLabel, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <section className="terminal-card px-4 py-4">
        <div className="terminal-label">{label}</div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="terminal-subtext text-sm">{remainingLabel}</div>
          <div className="text-sm font-semibold text-white">{percent}%</div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,rgb(var(--accent-rgb)),rgba(var(--hot-rgb),0.9))]" style={{ width: `${percent}%` }} />
        </div>
      </section>
    </button>
  )
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 sm:items-center">
      <div className="terminal-card terminal-modal w-full max-w-[420px] px-5 py-5">
        <div className="section-heading mb-4">
          <h2 className="data-title text-base text-white">{title}</h2>
          <button type="button" onClick={onClose} className="terminal-button-muted px-3 py-2 text-xs">Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Page() {
  const { system, setSystem } = useTeesha()
  const [isLogDayOpen, setIsLogDayOpen] = useState(false)
  const [isRussianOpen, setIsRussianOpen] = useState(false)
  const [isMomentumOpen, setIsMomentumOpen] = useState(false)
  const [isWeeklyOpen, setIsWeeklyOpen] = useState(false)
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false)
  const [russianWordOffset, setRussianWordOffset] = useState(0)
  const [selectedCheckInMetric, setSelectedCheckInMetric] = useState("sleep")
  const [checkInDraft, setCheckInDraft] = useState({
    sleep: "",
    energy: "",
    mood: "",
    focus: "",
    stress: ""
  })

  useEffect(() => {
    if (!system) {
      return
    }

    const todayKey = getDayKey()
    const popupKey = `teeshaOS.russianWordSeen.${todayKey}`

    if (typeof window !== "undefined" && !window.localStorage.getItem(popupKey)) {
      window.localStorage.setItem(popupKey, "1")
      const frameId = window.requestAnimationFrame(() => {
        setIsRussianOpen(true)
      })

      return () => window.cancelAnimationFrame(frameId)
    }

    return undefined
  }, [system])

  const quote = useMemo(() => getQuoteOfTheDay(), [])
  const russianWord = useMemo(() => getRussianWordOfTheDay(), [])

  if (!system) {
    return null
  }

  const todayKey = getDayKey()
  const weekKey = getWeekKey()
  const monthKey = getMonthKey()
  const todayLog = getDailyLog(system, todayKey)
  const todayTasks = getTodayTasks(system, todayKey)
  const weeklyGoals = getWeekGoals(system, weekKey)
  const monthlyGoals = getMonthGoals(system, monthKey)
  const weeklyPercent = getProgressPercent(weeklyGoals)
  const monthlyPercent = getProgressPercent(monthlyGoals)
  const completedTasks = todayTasks.filter((task) => task.completed).length
  const completedHabits = todayLog.habitsCompleted.length
  const remainingTasks = Math.max(0, todayTasks.length - completedTasks)
  const remainingHabits = Math.max(0, (system.habits?.length ?? 0) - completedHabits)
  const remainingWeekly = Math.max(0, weeklyGoals.length - weeklyGoals.filter((goal) => goal.completed).length)
  const remainingMonthly = Math.max(0, monthlyGoals.length - monthlyGoals.filter((goal) => goal.completed).length)
  const taskPercent = getRollingTaskPercent(system, todayKey)
  const habitPercent = getRollingHabitPercent(system, todayLog)
  const weeklyDisplayPercent = weeklyGoals.length > 0 ? weeklyPercent : clampPercent(average(getRecentDayKeys(system).map((dayKey) => getProgressPercent(getWeekGoals(system, getWeekKey(new Date(`${dayKey}T00:00:00`)))))))
  const momentum = calculateMomentum(system)
  const momentumSeries = getMomentumSeries(system)
  const previousMomentum = momentumSeries.length > 1 ? momentumSeries.at(-2)?.score ?? momentum : momentum
  const momentumDelta = momentum - previousMomentum
  const momentumSignal = getTrendSignal(momentumDelta, momentum)
  const momentumBars = getSparkValues(momentumSeries.map((entry) => entry.score), 7)
  const checkInChartData = getCheckInChartData(system)
  const moneySeries = getMoneySeries(system)
  const latestMoney = moneySeries.at(-1)?.amount ?? 0
  const activeRussianWord = getRussianWordByOffset(russianWordOffset)
  const progressItems = [
    { label: "Tasks", percent: taskPercent, remainingLabel: `${remainingTasks} left today` },
    { label: "Habits", percent: habitPercent, remainingLabel: `${remainingHabits} left today` },
    { label: "Weekly", percent: weeklyDisplayPercent, remainingLabel: `${remainingWeekly} left this week` },
    { label: "Monthly", percent: monthlyPercent, remainingLabel: `${remainingMonthly} left this month` }
  ]

  function saveCheckIn() {
    setSystem((current) => updateDailyLog(current, todayKey, (log) => ({
      ...log,
      checkIn: {
        sleep: Math.max(0, Number(checkInDraft.sleep) || 0),
        energy: Math.max(0, Number(checkInDraft.energy) || 0),
        mood: Math.max(0, Number(checkInDraft.mood) || 0),
        focus: Math.max(0, Number(checkInDraft.focus) || 0),
        stress: Math.max(0, Number(checkInDraft.stress) || 0)
      }
    })))
    setIsLogDayOpen(false)
  }

  function openLogDay() {
    setCheckInDraft({
      sleep: todayLog.checkIn.sleep || "",
      energy: todayLog.checkIn.energy || "",
      mood: todayLog.checkIn.mood || "",
      focus: todayLog.checkIn.focus || "",
      stress: todayLog.checkIn.stress || ""
    })
    setIsLogDayOpen(true)
  }

  return (
    <div className="mx-auto max-w-[430px] px-3 pb-8 pt-5 sm:max-w-[470px] sm:px-4 sm:py-6">
      <div className="app-frame px-3 py-4 sm:px-4 sm:py-5">
        <div className="app-content space-y-4">
          <div className="px-1 pb-1">
            <div className="terminal-label">System</div>
            <h1 className="data-title mt-2 text-[1.32rem] text-white">BioTracker</h1>
          </div>

          <BankBalanceCard
            balance={system.bankBalance ?? latestMoney}
            onSave={(value) => setSystem((current) => ({ ...current, bankBalance: value }))}
          />

          <QuoteCard quote={quote} />

          <MainSystemCard
            progressItems={progressItems}
            momentum={momentum}
            momentumSignal={momentumSignal}
            momentumBars={momentumBars}
            onLogDay={openLogDay}
            onOpenMomentum={() => setIsMomentumOpen(true)}
            checkInChartData={checkInChartData}
            selectedCheckInMetric={selectedCheckInMetric}
            onSelectCheckInMetric={setSelectedCheckInMetric}
          />
          <RussianWordCard
            word={activeRussianWord.word ?? russianWord}
            onOpen={() => setIsRussianOpen(true)}
          />

          <DailyTasks />
          <HabitTracker />
          <GoalsSummaryCard label="Weekly Goals" percent={weeklyPercent} remainingLabel={`${remainingWeekly} left this week`} onOpen={() => setIsWeeklyOpen(true)} />
          <GoalsSummaryCard label="Monthly Goals" percent={monthlyPercent} remainingLabel={`${remainingMonthly} left this month`} onOpen={() => setIsMonthlyOpen(true)} />
        </div>
      </div>

      <Modal open={isLogDayOpen} title="Log Day" onClose={() => setIsLogDayOpen(false)}>
        <div className="space-y-3">
          {CHECKIN_FIELDS.map((field) => (
            <label key={field.key} className="block">
              <div className="terminal-label mb-2">{field.label}</div>
              <input
                type="number"
                value={checkInDraft[field.key]}
                onChange={(event) => setCheckInDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                className="terminal-input w-full px-3 py-3"
              />
            </label>
          ))}
          <button type="button" onClick={saveCheckIn} className="terminal-button mt-2 w-full px-4 py-3 text-sm">Save</button>
        </div>
      </Modal>

      <Modal open={isRussianOpen} title="Russian Word" onClose={() => setIsRussianOpen(false)}>
        <RussianWordModalContent
          activeWord={activeRussianWord}
          wordOffset={russianWordOffset}
          onChangeOffset={setRussianWordOffset}
          onSelectWord={(date) => {
            const baseDate = new Date()
            baseDate.setHours(0, 0, 0, 0)
            const targetDate = new Date(date)
            targetDate.setHours(0, 0, 0, 0)
            const diffDays = Math.round((targetDate - baseDate) / (24 * 60 * 60 * 1000))
            setRussianWordOffset(diffDays)
          }}
        />
      </Modal>

      <Modal open={isMomentumOpen} title="Momentum" onClose={() => setIsMomentumOpen(false)}>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="terminal-label">Overall Score</div>
            <div className="mt-2 text-3xl font-semibold text-white">{momentum}</div>
          </div>
          <div className={`text-sm font-semibold ${momentumSignal.className}`}>{momentumSignal.symbol} {momentumSignal.label}</div>
        </div>
        <MomentumChartCard data={momentumSeries} />
      </Modal>

      <Modal open={isWeeklyOpen} title="Weekly Goals" onClose={() => setIsWeeklyOpen(false)}>
        <WeeklyGoals />
      </Modal>

      <Modal open={isMonthlyOpen} title="Monthly Goals" onClose={() => setIsMonthlyOpen(false)}>
        <MonthlyGoals />
      </Modal>
    </div>
  )
}
