import { buildMomentumSeries } from "@/lib/momentum"
import { getDayKey, getEmptyDailyLog, getMonthKey, getWeekKey } from "@/lib/systemLogic"

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseDayKey(dayKey) {
  const [year, month, day] = String(dayKey).split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function getDailyLog(system, dayKey = getDayKey()) {
  return system?.dailyLogs?.[dayKey] ?? getEmptyDailyLog()
}

export function updateDailyLog(system, dayKey, updater) {
  const currentLog = getDailyLog(system, dayKey)
  const nextLog = typeof updater === "function" ? updater(currentLog) : updater

  return {
    ...system,
    dailyLogs: {
      ...system.dailyLogs,
      [dayKey]: {
        ...getEmptyDailyLog(),
        ...currentLog,
        ...nextLog,
        kpis: Object.prototype.hasOwnProperty.call(nextLog ?? {}, "kpis")
          ? { ...(nextLog?.kpis ?? {}) }
          : { ...(currentLog.kpis ?? {}) },
        habitsCompleted: Array.isArray(nextLog?.habitsCompleted)
          ? nextLog.habitsCompleted
          : currentLog.habitsCompleted ?? [],
        checkIn: {
          ...getEmptyDailyLog().checkIn,
          ...(currentLog.checkIn ?? {}),
          ...(nextLog?.checkIn ?? {})
        }
      }
    }
  }
}

export function getTodayTasks(system, dayKey = getDayKey()) {
  return (system?.tasks ?? []).filter((task) => task.date === dayKey)
}

export function getWeekGoals(system, weekKey = getWeekKey()) {
  return (system?.weeklyGoals ?? []).filter((goal) => goal.weekKey === weekKey)
}

export function getMonthGoals(system, monthKey = getMonthKey()) {
  return (system?.monthlyGoals ?? []).filter((goal) => goal.monthKey === monthKey)
}

export function getCurrentFocus(schedule, now = new Date()) {
  const minutesNow = (now.getHours() * 60) + now.getMinutes()

  return (schedule ?? []).find((block) => {
    const [startHours, startMinutes] = block.start.split(":").map(Number)
    const [endHours, endMinutes] = block.end.split(":").map(Number)
    const start = (startHours * 60) + startMinutes
    const end = (endHours * 60) + endMinutes

    return minutesNow >= start && minutesNow < end
  }) ?? null
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
}

export function formatValue(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
}

export function formatDayLabel(dayKey) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(parseDayKey(dayKey))
}

export function formatDeadline(dayKey) {
  if (!dayKey) return "No deadline"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parseDayKey(dayKey))
}

export function getPrimaryProgressKpiName(mainGoal) {
  if (mainGoal?.progressKpiName) {
    return mainGoal.progressKpiName
  }

  const revenueLike = (mainGoal?.kpis ?? []).find((kpi) => /revenue|sales|money|earn/i.test(kpi.name))
  return revenueLike?.name ?? mainGoal?.kpis?.[0]?.name ?? ""
}

export function isFinancialKpi(name) {
  return /revenue|sales|money|earn/i.test(name ?? "")
}

export function getGoalProgressData(system) {
  const mainGoal = system?.mainGoal ?? { targetValue: 0, kpis: [] }
  const progressKpiName = getPrimaryProgressKpiName(mainGoal)

  const currentValue = Object.values(system?.dailyLogs ?? {}).reduce((total, log) => {
    if (!progressKpiName) {
      return total + (Number(log?.moneyEarned) || 0)
    }

    return total + (Number(log?.kpis?.[progressKpiName]) || 0)
  }, 0)

  const progress = mainGoal.targetValue > 0
    ? clamp(currentValue / mainGoal.targetValue, 0, 1)
    : 0

  return {
    progressKpiName,
    currentValue,
    progress,
    isCurrency: isFinancialKpi(progressKpiName)
  }
}

export function getTodayKpiCompletion(system, dayKey = getDayKey()) {
  return (system?.mainGoal?.kpis?.length ?? 0) > 0
    ? (system.mainGoal.kpis.reduce((sum, kpi) => {
        const target = Number(kpi.target) || 0
        const actual = Number(getDailyLog(system, dayKey).kpis?.[kpi.name]) || 0

        if (target <= 0) {
          return sum
        }

        return sum + clamp(actual / target, 0, 1)
      }, 0) / system.mainGoal.kpis.length)
    : 0
}

export function getMoneySeries(system) {
  return Object.entries(system?.dailyLogs ?? {})
    .map(([dayKey, log]) => ({
      dayKey,
      date: formatDayLabel(dayKey),
      amount: Number(log?.moneyEarned) || 0
    }))
    .sort((left, right) => parseDayKey(left.dayKey) - parseDayKey(right.dayKey))
}

export function getMonthMoneyTotal(system, now = new Date()) {
  const month = now.getMonth()
  const year = now.getFullYear()

  return Object.entries(system?.dailyLogs ?? {}).reduce((total, [dayKey, log]) => {
    const date = parseDayKey(dayKey)
    if (date.getMonth() !== month || date.getFullYear() !== year) {
      return total
    }

    return total + (Number(log?.moneyEarned) || 0)
  }, 0)
}

export function getRecentMoneyEntries(system, count = 7) {
  return getMoneySeries(system).slice(-count).reverse()
}

export function getMomentumSeries(system) {
  return buildMomentumSeries(system).map((entry) => ({
    ...entry,
    date: formatDayLabel(entry.dayKey)
  }))
}
