import { getMonthKey, getWeekKey } from "@/lib/systemLogic"

const CHECKIN_FIELDS = ["sleep", "energy", "mood", "focus", "stress"]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function ratio(done, total) {
  if (total <= 0) return 0
  return clamp(done / total, 0, 1)
}

function parseDayKey(dayKey) {
  const [year, month, day] = String(dayKey).split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function getKpiCompletion(system, dayKey) {
  const kpis = system?.mainGoal?.kpis ?? []
  const todayLog = system?.dailyLogs?.[dayKey] ?? null

  if (kpis.length === 0) {
    return 0
  }

  const score = kpis.reduce((total, kpi) => {
    const target = Number(kpi.target) || 0
    const actual = Number(todayLog?.kpis?.[kpi.name]) || 0

    if (target <= 0) {
      return total
    }

    return total + ratio(actual, target)
  }, 0)

  return score / kpis.length
}

function getCheckInCompletion(system, dayKey) {
  const checkIn = system?.dailyLogs?.[dayKey]?.checkIn ?? {}
  const completedCount = CHECKIN_FIELDS.filter((field) => (Number(checkIn?.[field]) || 0) > 0).length

  return ratio(completedCount, CHECKIN_FIELDS.length)
}

function getWeeklyCompletion(system, dayKey) {
  const weekKey = getWeekKey(parseDayKey(dayKey))
  const weeklyGoals = (system?.weeklyGoals ?? []).filter((goal) => goal.weekKey === weekKey)
  const completedCount = weeklyGoals.filter((goal) => goal.completed).length

  return ratio(completedCount, weeklyGoals.length)
}

function getMonthlyCompletion(system, dayKey) {
  const monthKey = getMonthKey(parseDayKey(dayKey))
  const monthlyGoals = (system?.monthlyGoals ?? []).filter((goal) => goal.monthKey === monthKey)
  const completedCount = monthlyGoals.filter((goal) => goal.completed).length

  return ratio(completedCount, monthlyGoals.length)
}

export function calculateTodayScoreForDay(system, dayKey) {
  if (!system || !dayKey) return 0

  const todayLog = system?.dailyLogs?.[dayKey] ?? null
  const todayTasks = (system?.tasks ?? []).filter((task) => task.date === dayKey)
  const completedTasks = todayTasks.filter((task) => task.completed).length
  const taskRatio = ratio(completedTasks, todayTasks.length)

  const habitsCompleted = Array.isArray(todayLog?.habitsCompleted)
    ? todayLog.habitsCompleted.length
    : 0
  const habitRatio = ratio(habitsCompleted, system.habits?.length ?? 0)
  const kpiRatio = getKpiCompletion(system, dayKey)
  const checkInRatio = getCheckInCompletion(system, dayKey)
  const weeklyRatio = getWeeklyCompletion(system, dayKey)
  const monthlyRatio = getMonthlyCompletion(system, dayKey)

  const todayScore = (
    (taskRatio * 25)
    + (habitRatio * 20)
    + (kpiRatio * 20)
    + (checkInRatio * 20)
    + (weeklyRatio * 10)
    + (monthlyRatio * 5)
  )

  return Math.round(clamp(todayScore, 0, 100))
}

export function buildMomentumSeries(system) {
  const historyMap = new Map((system?.momentumHistory ?? []).map((entry) => [entry.dateKey, entry]))
  const dayKeys = [...new Set([
    ...Object.keys(system?.dailyLogs ?? {}),
    ...(system?.momentumHistory ?? []).map((entry) => entry.dateKey)
  ])].sort((left, right) => parseDayKey(left) - parseDayKey(right))

  let previousMomentum = 0
  let highScoreStreak = 0

  return dayKeys.map((dayKey) => {
    const historyEntry = historyMap.get(dayKey)

    if (historyEntry) {
      highScoreStreak = (historyEntry.todayScore ?? 0) >= 80 ? highScoreStreak + 1 : 0
      previousMomentum = historyEntry.score

      return {
        dayKey,
        todayScore: historyEntry.todayScore ?? 0,
        score: historyEntry.score
      }
    }

    const todayScore = calculateTodayScoreForDay(system, dayKey)
    highScoreStreak = todayScore >= 80 ? highScoreStreak + 1 : 0

    let momentum = (previousMomentum * 0.82) + (todayScore * 0.18)

    if (todayScore < 35) {
      momentum -= 8
    } else if (highScoreStreak >= 3) {
      momentum += 3
    }

    momentum = Math.round(clamp(momentum, 0, 100))
    previousMomentum = momentum

    return {
      dayKey,
      todayScore,
      score: momentum
    }
  })
}

function getTodayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function calculateMomentumForDay(system, dayKey) {
  if (!system || !dayKey) return 0

  const series = buildMomentumSeries(system)
  const match = series.find((entry) => entry.dayKey === dayKey)

  return match?.score ?? 0
}

export function calculateTodayScore(system) {
  return calculateTodayScoreForDay(system, getTodayKey())
}

export function calculateMomentum(system) {
  return calculateMomentumForDay(system, getTodayKey())
}

export function getSystemStatus(momentum) {
  if (momentum >= 85) return "Locked In"
  if (momentum >= 70) return "Stable Build"
  if (momentum >= 50) return "Mixed Execution"
  if (momentum >= 30) return "Losing Grip"

  return "Needs Reset"
}
