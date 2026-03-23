function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function ratio(done, total) {
  if (total <= 0) return 0
  return clamp(done / total, 0, 1)
}

function sleepQuality(sleepHours) {
  if (!Number.isFinite(sleepHours)) return 0
  if (sleepHours >= 7 && sleepHours <= 9) return 1
  if (sleepHours < 7) return clamp(sleepHours / 7, 0, 1)
  return clamp(1 - ((sleepHours - 9) / 3), 0, 1)
}

function bioScore(lastBio) {
  if (!lastBio) return 0

  const energyComponent = clamp((Number(lastBio.energy) || 0) / 10, 0, 1)
  const sleepComponent = sleepQuality(Number(lastBio.sleep))

  return ((energyComponent * 0.65) + (sleepComponent * 0.35)) * 15
}

function emotionalScore(lastEmotion) {
  if (!lastEmotion) return 0

  const mood = clamp((Number(lastEmotion.mood) || 0) / 10, 0, 1)
  const focus = clamp((Number(lastEmotion.focus) || 0) / 10, 0, 1)
  const stress = clamp((Number(lastEmotion.stress) || 0) / 10, 0, 1)
  const stability = 1 - stress

  return ((mood * 0.45) + (focus * 0.35) + (stability * 0.2)) * 15
}

export function calculateMomentum(system) {
  if (!system) return 0

  const tasksDone = system.dailyTodos.filter((task) => task.completed).length
  const taskRatio = ratio(tasksDone, system.dailyTodos.length)
  const taskScore = taskRatio * 30

  const habitsDone = system.habits.filter((habit) => habit.completedToday).length
  const habitRatio = ratio(habitsDone, system.habits.length)
  const habitScore = habitRatio * 20

  const completedBlocks = system.routineTemplate.filter((block) =>
    system.dailyStructure?.completedBlockIds?.includes(block.id)
  ).length
  const structureRatio = ratio(completedBlocks, system.routineTemplate.length)
  const structureScore = structureRatio * 20

  const lastBio = system.biometrics.at(-1)
  const lastEmotion = system.emotions.at(-1)
  const biologicalScore = bioScore(lastBio)
  const emotionalStabilityScore = emotionalScore(lastEmotion)

  const highExecution = taskRatio >= 0.7 && habitRatio >= 0.7 && structureRatio >= 0.7
  const lowStability = (Number(lastBio?.energy) || 0) <= 3 || (Number(lastEmotion?.stress) || 0) >= 8

  let momentum = taskScore + habitScore + structureScore + biologicalScore + emotionalStabilityScore

  if (highExecution) {
    momentum += 5
  }

  if (lowStability) {
    momentum -= 5
  }

  return Math.round(clamp(momentum, 0, 100))
}

export function getSystemStatus(momentum) {
  if (momentum >= 85) return "Dominant Momentum"
  if (momentum >= 65) return "Stable Growth"
  if (momentum >= 45) return "Execution Drift"
  if (momentum >= 25) return "Energy Instability"

  return "Recovery Mode"
}
