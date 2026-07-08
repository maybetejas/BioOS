import { buildMomentumSeries } from "@/lib/momentum"
import { calculateTodayScoreForDay } from "@/lib/momentum"
import { getDayKey, getEmptyDailyLog, getMonthKey, getRetainedMonthKeys, getWeekKey, isHabitScheduledForDay } from "@/lib/systemLogic"

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseDayKey(dayKey) {
  const [year, month, day] = String(dayKey).split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function parseMonthKey(monthKey) {
  const [year, month] = String(monthKey).split("-").map(Number)
  return new Date(year, (month || 1) - 1, 1)
}

function getMonthFromIsoDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : getMonthKey(date)
}

function isInMonth(dayKey, monthKey) {
  return String(dayKey).slice(0, 7) === monthKey
}

function getDaysInMonth(monthKey) {
  const start = parseMonthKey(monthKey)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)

  return Array.from({ length: end.getDate() }, (_, index) => {
    const date = new Date(start)
    date.setDate(index + 1)
    return getDayKey(date)
  })
}

function averagePercent(values) {
  const realValues = values.filter((value) => Number.isFinite(value))
  if (realValues.length === 0) return 0
  return Math.round(realValues.reduce((sum, value) => sum + value, 0) / realValues.length)
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

export function getTaskStats(tasks = []) {
  const total = tasks.length
  const completed = tasks.filter((task) => task.completed).length

  return {
    total,
    completed,
    progress: total > 0 ? completed / total : 0
  }
}

export function getTimedTaskCompletionStats(tasks = []) {
  const total = tasks.length
  const completedOnTime = tasks.filter((task) => {
    if (!task?.completed) return false
    if (!task?.dueTime) return true

    const [dueHours, dueMinutes] = String(task.dueTime).split(":").map(Number)
    if (!Number.isFinite(dueHours) || !Number.isFinite(dueMinutes)) return true

    // Backward compatibility for tasks created before completedAt existed.
    if (!task.completedAt) {
      return task.completedOnTime !== false
    }

    const completedAt = new Date(task.completedAt)
    if (Number.isNaN(completedAt.getTime())) return false

    const completedMinutes = (completedAt.getHours() * 60) + completedAt.getMinutes()
    const deadlineMinutes = (dueHours * 60) + dueMinutes

    return completedMinutes <= deadlineMinutes
  }).length
  const completedLate = tasks.filter((task) => task?.completed && !task?.completedOnTime).length

  return {
    total,
    completedOnTime,
    completedLate,
    progress: total > 0 ? completedOnTime / total : 0
  }
}

export function getTaskDueMinutes(task) {
  if (!task?.dueTime) return null
  const [hours, minutes] = String(task.dueTime).split(":").map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return (hours * 60) + minutes
}

export function getTaskDeadlineState(task, now = new Date()) {
  const dueMinutes = getTaskDueMinutes(task)

  if (dueMinutes === null) {
    return {
      dueMinutes: null,
      progress: 0,
      overdue: false,
      remainingMinutes: null
    }
  }

  const currentMinutes = (now.getHours() * 60) + now.getMinutes()

  return {
    dueMinutes,
    progress: clamp(currentMinutes / Math.max(1, dueMinutes), 0, 1),
    overdue: currentMinutes > dueMinutes,
    remainingMinutes: dueMinutes - currentMinutes
  }
}

export function getScheduledHabits(system, dayKey = getDayKey()) {
  return (system?.habits ?? []).filter((habit) => isHabitScheduledForDay(habit, dayKey))
}

export function getHabitCompletionStats(system, dayKey = getDayKey()) {
  const scheduledHabits = getScheduledHabits(system, dayKey)
  const completedSet = new Set(getDailyLog(system, dayKey).habitsCompleted ?? [])
  const total = scheduledHabits.length
  const completed = scheduledHabits.filter((habit) => completedSet.has(habit.name)).length

  return {
    total,
    completed,
    progress: total > 0 ? completed / total : 0
  }
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

export function getDailyCompletionPercent(system, dayKey = getDayKey()) {
  const tasks = getTodayTasks(system, dayKey)

  if (tasks.length === 0) return 0

  return Math.round((getTimedTaskCompletionStats(tasks).completedOnTime / tasks.length) * 100)
}

export function formatMonthLabel(monthKey) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(parseMonthKey(monthKey))
}

export function getArchiveMonthOptions(system, now = new Date()) {
  const retainedMonthKeys = getRetainedMonthKeys(now)

  return retainedMonthKeys
    .map((monthKey) => {
      const dailyLogCount = Object.keys(system?.dailyLogs ?? {}).filter((dayKey) => isInMonth(dayKey, monthKey)).length

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        dailyLogCount,
        isCurrent: monthKey === getMonthKey(now)
      }
    })
    .reverse()
}

export function getWeekCompletionPercent(system, now = new Date()) {
  const weekStart = new Date(now)
  const day = weekStart.getDay()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() + (day === 0 ? -6 : 1 - day))

  const dayKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return getDayKey(date)
  }).filter((dayKey) => parseDayKey(dayKey) <= now)

  return averagePercent(dayKeys.map((dayKey) => calculateTodayScoreForDay(system, dayKey)))
}

export function getMonthCompletionPercent(system, monthKey = getMonthKey()) {
  const todayKey = getDayKey()
  const dayKeys = getDaysInMonth(monthKey).filter((dayKey) => dayKey <= todayKey)

  return averagePercent(dayKeys.map((dayKey) => calculateTodayScoreForDay(system, dayKey)))
}

export function getMonthlyArchive(system, monthKey = getMonthKey()) {
  const dailyLogs = Object.fromEntries(
    Object.entries(system?.dailyLogs ?? {}).filter(([dayKey]) => isInMonth(dayKey, monthKey))
  )
  const tasks = (system?.tasks ?? []).filter((task) => isInMonth(task.date, monthKey))
  const weeklyGoals = (system?.weeklyGoals ?? []).filter((goal) => getMonthFromIsoDate(goal.createdAt) === monthKey)
  const monthlyGoals = (system?.monthlyGoals ?? []).filter((goal) => goal.monthKey === monthKey)
  const momentumHistory = (system?.momentumHistory ?? []).filter((entry) => isInMonth(entry.dateKey, monthKey))
  const loggedDayKeys = Object.keys(dailyLogs).sort()
  const taskStats = getTimedTaskCompletionStats(tasks)
  const completedWeeklyGoals = weeklyGoals.filter((goal) => goal.completed).length
  const completedMonthlyGoals = monthlyGoals.filter((goal) => goal.completed).length
  const habitStats = loggedDayKeys.reduce((totals, dayKey) => {
    const stats = getHabitCompletionStats(system, dayKey)
    return {
      completed: totals.completed + stats.completed,
      total: totals.total + stats.total
    }
  }, { completed: 0, total: 0 })
  const sleepValues = loggedDayKeys
    .map((dayKey) => Number(dailyLogs[dayKey]?.checkIn?.sleep) || 0)
    .filter((value) => value > 0)

  return {
    appName: system?.appName ?? "Accountability Tracker",
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    exportedAt: new Date().toISOString(),
    summary: {
      monthlyCompletionPercent: getMonthCompletionPercent(system, monthKey),
      loggedDays: loggedDayKeys.length,
      taskCompletionPercent: taskStats.total > 0 ? Math.round((taskStats.completedOnTime / taskStats.total) * 100) : 0,
      habitCompletionPercent: habitStats.total > 0 ? Math.round((habitStats.completed / habitStats.total) * 100) : 0,
      weeklyGoalCompletionPercent: weeklyGoals.length > 0 ? Math.round((completedWeeklyGoals / weeklyGoals.length) * 100) : 0,
      monthlyGoalCompletionPercent: monthlyGoals.length > 0 ? Math.round((completedMonthlyGoals / monthlyGoals.length) * 100) : 0,
      averageSleepHours: sleepValues.length > 0 ? Number((sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length).toFixed(2)) : 0
    },
    data: {
      dailyLogs,
      tasks,
      weeklyGoals,
      monthlyGoals,
      momentumHistory,
      mainGoal: system?.mainGoal ?? null,
      habits: system?.habits ?? [],
      moneyTargetPerDay: system?.moneyTargetPerDay ?? 0,
      bankBalance: system?.bankBalance ?? 0
    }
  }
}
