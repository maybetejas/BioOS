export function loadSystem() {
  const raw = localStorage.getItem("teeshaOS")

  if (!raw) {
    const initial = {
      dailyTodos: [],
      weeklyTodos: [],
      habits: [],
      biometrics: [],
      emotions: [],
      logs: []
    }

    localStorage.setItem("teeshaOS", JSON.stringify(initial))
    return initial
  }

  return JSON.parse(raw)
}

export function saveSystem(system) {
  localStorage.setItem("teeshaOS", JSON.stringify(system))
}