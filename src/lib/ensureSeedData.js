export function ensureSeedData() {

  const raw = localStorage.getItem("teeshaOS")

  if (!raw) return

  const system = JSON.parse(raw)

  // check if we already have a week of data
  if (system.biometrics && system.biometrics.length >= 7) {
    return
  }

  const today = new Date()

  const biometrics = []
  const emotions = []

  for (let i = 6; i >= 0; i--) {

    const date = new Date()
    date.setDate(today.getDate() - i)

    biometrics.push({
      date: date.toISOString(),
      sleep: Math.floor(6 + Math.random() * 3),
      energy: Math.floor(4 + Math.random() * 5),
      focus: Math.floor(4 + Math.random() * 5)
    })

    emotions.push({
      date: date.toISOString(),
      mood: Math.floor(5 + Math.random() * 4),
      stress: Math.floor(3 + Math.random() * 4),
      alive: Math.floor(6 + Math.random() * 3)
    })
  }

  system.biometrics = biometrics
  system.emotions = emotions

  system.dailyTodos = [
    { id: Date.now(), text: "Ship feature", completed: true },
    { id: Date.now()+1, text: "Apply to jobs", completed: false },
    { id: Date.now()+2, text: "Solve backend problems", completed: true }
  ]

  system.weeklyTodos = [
    { id: Date.now()+3, text: "Launch portfolio", completed: false },
    { id: Date.now()+4, text: "Send 20 applications", completed: false }
  ]

  system.habits = [
    { id: Date.now()+5, name: "Voice training", streak: 3, completedToday: false },
    { id: Date.now()+6, name: "Reading", streak: 4, completedToday: true },
    { id: Date.now()+7, name: "Exercise", streak: 2, completedToday: false }
  ]

  localStorage.setItem("teeshaOS", JSON.stringify(system))

  console.log("Seeded initial week data")
}