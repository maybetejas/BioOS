export function calculateMomentum(system) {

  if (!system) return 0

  const tasksDone = system.dailyTodos.filter(t => t.completed).length
  const totalTasks = system.dailyTodos.length || 1

  const habitsDone = system.habits.filter(h => h.completedToday).length
  const totalHabits = system.habits.length || 1

  const taskScore = (tasksDone / totalTasks) * 40
  const habitScore = (habitsDone / totalHabits) * 30

  const lastBio = system.biometrics.at(-1)
  const lastEmotion = system.emotions.at(-1)

  let energyScore = 0
  let moodScore = 0

  if (lastBio) {
    energyScore = (lastBio.energy || 0) * 1.5
  }

  if (lastEmotion) {
    moodScore = (lastEmotion.mood || 0) * 1.5
  }

  const momentum = taskScore + habitScore + energyScore + moodScore

  return Math.round(momentum)
}

export function getSystemStatus(momentum) {

  if (momentum >= 80) return "Dominant Momentum"
  if (momentum >= 60) return "Stable Growth"
  if (momentum >= 40) return "Execution Drift"
  if (momentum >= 20) return "Energy Instability"

  return "Recovery Mode"
}