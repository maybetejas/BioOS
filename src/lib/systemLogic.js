const DAY_MS = 24 * 60 * 60 * 1000
export const DEFAULT_THEME_ACCENT = "#6dff8b"

export const DEFAULT_SCHEDULE = [
  { id: "study-interviews", start: "08:00", end: "10:30", label: "Study (Interviews)" },
  { id: "washy-study", start: "11:30", end: "14:00", label: "Washy + Study" },
  { id: "freelance-work", start: "15:00", end: "17:00", label: "Freelance Work" },
  { id: "workout", start: "17:00", end: "18:00", label: "Workout" },
  { id: "free-flexible", start: "18:00", end: "23:00", label: "Free / Flexible" }
]

function pad(value) {
  return String(value).padStart(2, "0")
}

export function getDayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getIsoWeekParts(date = new Date()) {
  const working = new Date(date)
  working.setHours(0, 0, 0, 0)

  const day = working.getDay() || 7
  working.setDate(working.getDate() + 4 - day)

  const yearStart = new Date(working.getFullYear(), 0, 1)
  const week = Math.ceil((((working - yearStart) / DAY_MS) + 1) / 7)

  return {
    year: working.getFullYear(),
    week
  }
}

export function getWeekKey(date = new Date()) {
  const { year, week } = getIsoWeekParts(date)
  return `${year}-W${pad(week)}`
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeThemeAccent(value) {
  const normalized = normalizeText(value)
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : DEFAULT_THEME_ACCENT
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeNonNegativeNumber(value, fallback = 0) {
  return Math.max(0, normalizeNumber(value, fallback))
}

function normalizeDateString(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeDayKey(value, fallback) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? value : fallback
}

function normalizeWeekKey(value, fallback) {
  return /^\d{4}-W\d{2}$/.test(String(value)) ? value : fallback
}

function timeToMinutes(value) {
  const match = normalizeText(value).match(/^(\d{1,2}):(\d{2})$/)

  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return (hours * 60) + minutes
}

function normalizeTimeValue(value) {
  const minutes = timeToMinutes(value)

  if (minutes === null) {
    return null
  }

  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

function normalizeScheduleBlock(block, index) {
  const label = normalizeText(block?.label)
  const start = normalizeTimeValue(block?.start ?? block?.startTime)
  const end = normalizeTimeValue(block?.end ?? block?.endTime)

  if (!label || !start || !end || timeToMinutes(start) >= timeToMinutes(end)) {
    return null
  }

  return {
    id: block?.id ?? `schedule-${index}`,
    start,
    end,
    label
  }
}

function normalizeGoalKpi(kpi, index) {
  const name = normalizeText(kpi?.name)

  if (!name) {
    return null
  }

  return {
    id: kpi?.id ?? `kpi-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    target: normalizeNonNegativeNumber(kpi?.target)
  }
}

function normalizeMainGoal(mainGoal) {
  const kpis = (mainGoal?.kpis ?? [])
    .map((kpi, index) => normalizeGoalKpi(kpi, index))
    .filter(Boolean)

  return {
    title: normalizeText(mainGoal?.title) || "Set your main goal",
    targetValue: normalizeNonNegativeNumber(mainGoal?.targetValue),
    deadline: normalizeDayKey(mainGoal?.deadline, ""),
    progressKpiName: normalizeText(mainGoal?.progressKpiName),
    kpis
  }
}

function normalizeTask(task, fallbackDayKey, now) {
  const text = normalizeText(task?.text)

  if (!text) return null

  return {
    id: task?.id ?? Date.now() + Math.random(),
    text,
    completed: Boolean(task?.completed),
    date: normalizeDayKey(task?.date ?? task?.periodKey, fallbackDayKey),
    createdAt: normalizeDateString(task?.createdAt) ?? new Date(now).toISOString()
  }
}

function normalizeHabit(habit) {
  const name = normalizeText(habit?.name)

  if (!name) return null

  return {
    id: habit?.id ?? Date.now() + Math.random(),
    name,
    streak: Math.max(0, Math.floor(normalizeNumber(habit?.streak, 0))),
    lastCompletedDate: normalizeDayKey(habit?.lastCompletedDate ?? habit?.lastCompletedOn, null)
  }
}

function normalizeWeeklyGoal(goal, fallbackWeekKey, now) {
  const text = normalizeText(goal?.text)

  if (!text) return null

  return {
    id: goal?.id ?? Date.now() + Math.random(),
    text,
    completed: Boolean(goal?.completed),
    weekKey: normalizeWeekKey(goal?.weekKey ?? goal?.periodKey, fallbackWeekKey),
    createdAt: normalizeDateString(goal?.createdAt) ?? new Date(now).toISOString()
  }
}

function normalizeCheckIn(checkIn) {
  return {
    sleep: normalizeNumber(checkIn?.sleep, 0),
    energy: normalizeNumber(checkIn?.energy, 0),
    mood: normalizeNumber(checkIn?.mood, 0),
    focus: normalizeNumber(checkIn?.focus, 0),
    stress: normalizeNumber(checkIn?.stress, 0)
  }
}

function normalizeKpiValues(kpis) {
  if (!kpis || typeof kpis !== "object") {
    return {}
  }

  return Object.fromEntries(
    Object.entries(kpis)
      .map(([key, value]) => [normalizeText(key), normalizeNonNegativeNumber(value)])
      .filter(([key]) => key)
  )
}

function normalizeDailyLog(log) {
  return {
    kpis: normalizeKpiValues(log?.kpis),
    moneyEarned: normalizeNonNegativeNumber(log?.moneyEarned),
    tasksCompleted: Math.max(0, Math.floor(normalizeNumber(log?.tasksCompleted, 0))),
    habitsCompleted: Array.isArray(log?.habitsCompleted)
      ? [...new Set(log.habitsCompleted.map((name) => normalizeText(name)).filter(Boolean))]
      : [],
    checkIn: normalizeCheckIn(log?.checkIn)
  }
}

function normalizeMomentumSnapshot(entry, now) {
  const score = normalizeNumber(entry?.score, NaN)

  if (!Number.isFinite(score)) {
    return null
  }

  const recordedAt = normalizeDateString(entry?.recordedAt ?? entry?.date) ?? new Date(now).toISOString()

  return {
    dateKey: normalizeDayKey(entry?.dateKey, getDayKey(new Date(recordedAt))),
    score: Math.max(0, Math.min(100, Math.round(score))),
    recordedAt
  }
}

function emptyDailyLog() {
  return {
    kpis: {},
    moneyEarned: 0,
    tasksCompleted: 0,
    habitsCompleted: [],
    checkIn: {
      sleep: 0,
      energy: 0,
      mood: 0,
      focus: 0,
      stress: 0
    }
  }
}

function migrateLegacyDailyLogs(incoming, todayKey) {
  const logs = { ...(incoming?.dailyLogs ?? {}) }

  ;(incoming?.dailyTodos ?? []).forEach((task) => {
    const dayKey = normalizeDayKey(task?.periodKey, todayKey)
    const existing = normalizeDailyLog(logs[dayKey] ?? emptyDailyLog())

    if (task?.completed) {
      existing.tasksCompleted += 1
    }

    logs[dayKey] = existing
  })

  const todayLog = normalizeDailyLog(logs[todayKey] ?? emptyDailyLog())
  const completedHabits = (incoming?.habits ?? [])
    .filter((habit) => habit?.completedToday)
    .map((habit) => normalizeText(habit?.name))
    .filter(Boolean)

  if (completedHabits.length > 0) {
    todayLog.habitsCompleted = [...new Set([...todayLog.habitsCompleted, ...completedHabits])]
  }

  const latestBio = Array.isArray(incoming?.biometrics) ? incoming.biometrics.at(-1) : null
  const latestEmotion = Array.isArray(incoming?.emotions) ? incoming.emotions.at(-1) : null

  if (latestBio || latestEmotion) {
    todayLog.checkIn = normalizeCheckIn({
      ...todayLog.checkIn,
      sleep: latestBio?.sleep ?? todayLog.checkIn.sleep,
      energy: latestBio?.energy ?? todayLog.checkIn.energy,
      mood: latestEmotion?.mood ?? todayLog.checkIn.mood,
      focus: latestEmotion?.focus ?? latestEmotion?.alive ?? todayLog.checkIn.focus,
      stress: latestEmotion?.stress ?? todayLog.checkIn.stress
    })
  }

  logs[todayKey] = todayLog

  return Object.fromEntries(
    Object.entries(logs).map(([dayKey, log]) => [normalizeDayKey(dayKey, todayKey), normalizeDailyLog(log)])
  )
}

function createMeta(now) {
  return {
    lastDailyReset: getDayKey(now),
    lastWeeklyReset: getWeekKey(now)
  }
}

function resetMissedHabitStreaks(habits, todayKey) {
  return habits.map((habit) => {
    if (!habit.lastCompletedDate) {
      return { ...habit, streak: 0 }
    }

    const lastDate = new Date(`${habit.lastCompletedDate}T00:00:00`)
    const today = new Date(`${todayKey}T00:00:00`)
    const diffDays = Math.round((today - lastDate) / DAY_MS)

    if (diffDays > 1) {
      return {
        ...habit,
        streak: 0
      }
    }

    return habit
  })
}

export function createDefaultSystem(now = new Date()) {
  return {
    schemaVersion: 3,
    appName: "Accountability Tracker",
    themeAccent: DEFAULT_THEME_ACCENT,
    schedule: DEFAULT_SCHEDULE,
    mainGoal: {
      title: "Earn 40000 in 30 days",
      targetValue: 40000,
      deadline: "",
      progressKpiName: "Revenue",
      kpis: [
        { id: "kpi-calls", name: "Calls", target: 20 },
        { id: "kpi-outreach", name: "Outreach", target: 50 },
        { id: "kpi-revenue", name: "Revenue", target: 40000 }
      ]
    },
    dailyLogs: {},
    tasks: [],
    habits: [],
    weeklyGoals: [],
    moneyTargetPerDay: 1500,
    momentumHistory: [],
    meta: createMeta(now)
  }
}

export function normalizeSystem(rawSystem, now = new Date()) {
  const base = createDefaultSystem(now)
  const incoming = rawSystem && typeof rawSystem === "object" ? rawSystem : {}
  const todayKey = getDayKey(now)
  const weekKey = getWeekKey(now)

  let system = {
    ...base,
    ...incoming,
    schemaVersion: base.schemaVersion,
    appName: normalizeText(incoming.appName) || base.appName,
    themeAccent: normalizeThemeAccent(incoming.themeAccent),
    schedule: (incoming.schedule ?? incoming.routineTemplate ?? base.schedule)
      .map((block, index) => normalizeScheduleBlock(block, index))
      .filter(Boolean)
      .sort((left, right) => timeToMinutes(left.start) - timeToMinutes(right.start)),
    mainGoal: normalizeMainGoal(incoming.mainGoal ?? base.mainGoal),
    tasks: (incoming.tasks ?? incoming.dailyTodos ?? [])
      .map((task) => normalizeTask(task, todayKey, now))
      .filter(Boolean),
    habits: resetMissedHabitStreaks(
      (incoming.habits ?? []).map(normalizeHabit).filter(Boolean),
      todayKey
    ),
    weeklyGoals: (incoming.weeklyGoals ?? incoming.weeklyTodos ?? [])
      .map((goal) => normalizeWeeklyGoal(goal, weekKey, now))
      .filter(Boolean),
    dailyLogs: migrateLegacyDailyLogs(incoming, todayKey),
    moneyTargetPerDay: normalizeNonNegativeNumber(incoming.moneyTargetPerDay, base.moneyTargetPerDay),
    momentumHistory: (incoming.momentumHistory ?? [])
      .map((entry) => normalizeMomentumSnapshot(entry, now))
      .filter(Boolean)
      .sort((left, right) => new Date(left.recordedAt) - new Date(right.recordedAt)),
    meta: {
      ...createMeta(now),
      ...(incoming.meta ?? {})
    }
  }

  system.dailyLogs = {
    ...system.dailyLogs,
    [todayKey]: normalizeDailyLog(system.dailyLogs[todayKey] ?? emptyDailyLog())
  }

  return system
}

export function getEmptyDailyLog() {
  return emptyDailyLog()
}

export function getAcquiredHabits(habits) {
  return habits.filter((habit) => habit.streak >= 7)
}
