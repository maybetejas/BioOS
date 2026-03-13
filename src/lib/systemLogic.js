const DAY_MS = 24 * 60 * 60 * 1000
export const ACQUIRED_HABIT_STREAK = 7

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

function parseDayKey(dayKey) {
  if (!dayKey || typeof dayKey !== "string") return null

  const [year, month, day] = dayKey.split("-").map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function getDayDiff(fromDayKey, toDayKey) {
  const from = parseDayKey(fromDayKey)
  const to = parseDayKey(toDayKey)

  if (!from || !to) return Infinity

  return Math.round((to - from) / DAY_MS)
}

function createMeta(now) {
  return {
    lastDailyReset: getDayKey(now),
    lastWeeklyReset: getWeekKey(now)
  }
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeTask(task, type, now) {
  const text = normalizeText(task?.text)

  if (!text) return null

  return {
    id: task?.id ?? Date.now() + Math.random(),
    text,
    completed: Boolean(task?.completed),
    createdAt: task?.createdAt ?? new Date(now).toISOString(),
    periodKey: task?.periodKey ?? (type === "daily" ? getDayKey(now) : getWeekKey(now))
  }
}

function normalizePendingTask(task, fallbackType, now) {
  const text = normalizeText(task?.text)

  if (!text) return null

  return {
    id: task?.id ?? Date.now() + Math.random(),
    text,
    sourcePeriod: task?.sourcePeriod ?? task?.periodKey ?? (fallbackType === "daily" ? getDayKey(now) : getWeekKey(now)),
    movedAt: task?.movedAt ?? new Date(now).toISOString()
  }
}

function normalizeHabit(habit) {
  const name = normalizeText(habit?.name)

  if (!name) return null

  return {
    id: habit?.id ?? Date.now() + Math.random(),
    name,
    streak: Number.isFinite(Number(habit?.streak)) ? Math.max(Number(habit.streak), 0) : 0,
    completedToday: Boolean(habit?.completedToday),
    lastCompletedOn: typeof habit?.lastCompletedOn === "string" ? habit.lastCompletedOn : null,
    previousCompletedOn: typeof habit?.previousCompletedOn === "string" ? habit.previousCompletedOn : null
  }
}

function normalizeBiometric(entry, now) {
  const sleep = Number(entry?.sleep)
  const energy = Number(entry?.energy)

  if (![sleep, energy].every(Number.isFinite)) {
    return null
  }

  const date = entry?.date ?? new Date(now).toISOString()

  return {
    date,
    dateKey: entry?.dateKey ?? getDayKey(new Date(date)),
    sleep,
    energy
  }
}

function normalizeEmotion(entry, now) {
  const mood = Number(entry?.mood)
  const stress = Number(entry?.stress)
  const focus = Number.isFinite(Number(entry?.focus))
    ? Number(entry.focus)
    : Number(entry?.alive)

  if (![mood, stress, focus].every(Number.isFinite)) {
    return null
  }

  const date = entry?.date ?? new Date(now).toISOString()

  return {
    date,
    dateKey: entry?.dateKey ?? getDayKey(new Date(date)),
    mood,
    stress,
    focus
  }
}

function normalizeInsight(insight) {
  if (!insight || typeof insight.text !== "string" || !insight.text.trim()) {
    return null
  }

  return {
    date: insight.date,
    text: insight.text.trim(),
    type: insight.type ?? null
  }
}

function looksLikeLegacyDemoData(incoming) {
  if (incoming?.meta) {
    return false
  }

  const dailyTexts = (incoming?.dailyTodos ?? []).map((todo) => normalizeText(todo?.text))
  const weeklyTexts = (incoming?.weeklyTodos ?? []).map((todo) => normalizeText(todo?.text))
  const habitNames = (incoming?.habits ?? []).map((habit) => normalizeText(habit?.name))

  const hasDemoDaily = ["Ship feature", "Apply to jobs", "Solve backend problems"].every((text) => dailyTexts.includes(text))
  const hasDemoWeekly = ["Launch portfolio", "Send 20 applications"].every((text) => weeklyTexts.includes(text))
  const hasDemoHabits = ["Voice training", "Reading", "Exercise"].every((text) => habitNames.includes(text))

  return hasDemoDaily && hasDemoWeekly && hasDemoHabits
}

function rolloverDaily(system, todayKey, now) {
  if (system.meta.lastDailyReset === todayKey) {
    return system
  }

  const unfinished = system.dailyTodos
    .filter((todo) => !todo.completed)
    .map((todo) => ({
      id: todo.id,
      text: todo.text,
      sourcePeriod: todo.periodKey,
      movedAt: new Date(now).toISOString()
    }))

  const habits = system.habits.map((habit) => {
    const daysSinceLastCompletion = getDayDiff(habit.lastCompletedOn, todayKey)
    const streak = daysSinceLastCompletion > 1 ? 0 : habit.streak

    return {
      ...habit,
      streak,
      completedToday: false,
      previousCompletedOn: null
    }
  })

  return {
    ...system,
    dailyTodos: [],
    pendingDailyTodos: [...unfinished, ...system.pendingDailyTodos],
    habits,
    meta: {
      ...system.meta,
      lastDailyReset: todayKey
    }
  }
}

function rolloverWeekly(system, weekKey, now) {
  if (system.meta.lastWeeklyReset === weekKey) {
    return system
  }

  const unfinished = system.weeklyTodos
    .filter((todo) => !todo.completed)
    .map((todo) => ({
      id: todo.id,
      text: todo.text,
      sourcePeriod: todo.periodKey,
      movedAt: new Date(now).toISOString()
    }))

  return {
    ...system,
    weeklyTodos: [],
    pendingWeeklyTodos: [...unfinished, ...system.pendingWeeklyTodos],
    meta: {
      ...system.meta,
      lastWeeklyReset: weekKey
    }
  }
}

export function createDefaultSystem(now = new Date()) {
  return {
    schemaVersion: 2,
    appName: "Accountability Tracker",
    dailyTodos: [],
    weeklyTodos: [],
    pendingDailyTodos: [],
    pendingWeeklyTodos: [],
    habits: [],
    biometrics: [],
    emotions: [],
    insights: {
      morning: null,
      night: null
    },
    meta: createMeta(now)
  }
}

export function normalizeSystem(rawSystem, now = new Date()) {
  const base = createDefaultSystem(now)
  const rawIncoming = rawSystem && typeof rawSystem === "object" ? rawSystem : {}
  const incoming = looksLikeLegacyDemoData(rawIncoming)
    ? {
        ...rawIncoming,
        dailyTodos: [],
        weeklyTodos: [],
        habits: [],
        biometrics: [],
        emotions: [],
        insights: {
          morning: null,
          night: null
        }
      }
    : rawIncoming

  let system = {
    ...base,
    ...incoming,
    schemaVersion: base.schemaVersion,
    appName: normalizeText(incoming.appName) || base.appName,
    dailyTodos: (incoming.dailyTodos ?? []).map((todo) => normalizeTask(todo, "daily", now)).filter(Boolean),
    weeklyTodos: (incoming.weeklyTodos ?? []).map((todo) => normalizeTask(todo, "weekly", now)).filter(Boolean),
    pendingDailyTodos: (incoming.pendingDailyTodos ?? []).map((todo) => normalizePendingTask(todo, "daily", now)).filter(Boolean),
    pendingWeeklyTodos: (incoming.pendingWeeklyTodos ?? []).map((todo) => normalizePendingTask(todo, "weekly", now)).filter(Boolean),
    habits: (incoming.habits ?? []).map(normalizeHabit).filter(Boolean),
    biometrics: (incoming.biometrics ?? []).map((entry) => normalizeBiometric(entry, now)).filter(Boolean),
    emotions: (incoming.emotions ?? []).map((entry) => normalizeEmotion(entry, now)).filter(Boolean),
    insights: {
      morning: normalizeInsight(incoming.insights?.morning),
      night: normalizeInsight(incoming.insights?.night)
    },
    meta: {
      ...createMeta(now),
      ...(incoming.meta ?? {})
    }
  }

  const todayKey = getDayKey(now)
  const weekKey = getWeekKey(now)

  system = rolloverDaily(system, todayKey, now)
  system = rolloverWeekly(system, weekKey, now)

  return system
}

export function upsertEntryByDay(entries, entry) {
  return [
    ...entries.filter((item) => item.dateKey !== entry.dateKey),
    entry
  ].sort((left, right) => new Date(left.date) - new Date(right.date))
}

export function getAcquiredHabits(habits) {
  return habits.filter((habit) => habit.streak >= ACQUIRED_HABIT_STREAK)
}
