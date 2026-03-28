function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function ratio(done, total) {
  if (total <= 0) return 0
  return clamp(done / total, 0, 1)
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

export function calculateMomentumForDay(system, dayKey) {
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

  const momentum = (taskRatio * 30) + (habitRatio * 30) + (kpiRatio * 40)

  return Math.round(clamp(momentum, 0, 100))
}

function getTodayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function calculateMomentum(system) {
  return calculateMomentumForDay(system, getTodayKey())
}

export function getSystemStatus(momentum) {
  if (momentum >= 85) return "Locked In"
  if (momentum >= 65) return "On Track"
  if (momentum >= 45) return "Some Drift"
  if (momentum >= 25) return "Pressure Rising"

  return "Needs Action"
}
