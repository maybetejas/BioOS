function pickMessage(messages, indexHint) {
  return messages[indexHint % messages.length]
}

export function buildMorningInsight({ sleep, energy, date }) {
  const highCapacity = sleep >= 7 && energy >= 7
  const lowCapacity = sleep < 5 || energy <= 4

  let type = "moderate"
  let messages = [
    "Decent capacity today. Focus on consistent progress.",
    "Energy is moderate today. Aim for steady work, not perfection.",
    "Good enough conditions to move forward. Start with one small win."
  ]

  if (highCapacity) {
    type = "high"
    messages = [
      "You're well rested today. Use the energy on high leverage work.",
      "Sleep and energy are strong today. Push forward while capacity is high.",
      "Strong biological state detected. This is a good day to ship something meaningful."
    ]
  } else if (lowCapacity) {
    type = "low"
    messages = [
      "Low energy detected. Prioritize recovery and one meaningful task.",
      "Your system looks tired today. Reduce ambition and protect momentum.",
      "Recovery day signals detected. Focus on sleep, sunlight, and one small action."
    ]
  }

  return {
    date,
    type,
    text: pickMessage(messages, sleep + energy)
  }
}

export function buildNightInsight({
  mood,
  stress,
  focus,
  tasksCompleted,
  totalTasks,
  habitsCompleted,
  date
}) {
  const taskRate = totalTasks > 0 ? tasksCompleted / totalTasks : 0

  if (stress >= 7 && mood <= 4) {
    return {
      date,
      type: "burnout",
      text: pickMessage([
        "High stress and low mood showed up today. Prioritize recovery tomorrow.",
        "You may be pushing too hard. Protect energy and avoid overexertion tomorrow."
      ], stress + mood)
    }
  }

  if (tasksCompleted === 0 && habitsCompleted === 0) {
    return {
      date,
      type: "zero-day",
      text: pickMessage([
        "No execution landed today. Start tomorrow with one small action.",
        "Zero days happen. Reset with a simple task first thing tomorrow."
      ], totalTasks + habitsCompleted)
    }
  }

  if (mood <= 4 && focus <= 5) {
    return {
      date,
      type: "gloom",
      text: pickMessage([
        "Low mood and weak focus showed up today. Change your environment and simplify tomorrow.",
        "Today felt heavy and scattered. Get sunlight, reduce noise, and reset tomorrow."
      ], mood + focus)
    }
  }

  if (mood >= 7 && focus >= 7) {
    return {
      date,
      type: "positive",
      text: pickMessage([
        "Mood and focus both held up today. Notice what helped and repeat it.",
        "Today felt sharp and emotionally steady. Try to repeat the setup tomorrow."
      ], mood + focus + habitsCompleted)
    }
  }

  if (taskRate >= 0.7) {
    return {
      date,
      type: "execution",
      text: pickMessage([
        "Execution was strong today. Momentum builds from days like this.",
        "You followed through on most tasks today. Keep the rhythm."
      ], tasksCompleted + totalTasks)
    }
  }

  return {
    date,
    type: "neutral",
    text: pickMessage([
      "The day was mixed. Tighten the plan and protect your energy tomorrow.",
      "Not a bad day, not a great one. Pick one priority and execute cleanly tomorrow."
    ], mood + stress + tasksCompleted)
  }
}
