"use client"

import { useTeesha } from "@/context/TeeshaContext"
import { calculateMomentum, getSystemStatus } from "@/lib/momentum"

export default function Landing() {

  const { system } = useTeesha()

  if (!system) return null

  const momentum = calculateMomentum(system)
  const status = getSystemStatus(momentum)

  const completedTasks = system.dailyTodos.filter(t => t.completed).length
  const totalTasks = system.dailyTodos.length

  const completedHabits = system.habits.filter(h => h.completedToday).length

  const lastBio = system.biometrics.at(-1)
  const lastEmotion = system.emotions.at(-1)

  return (
    <div>

      <h1 className="text-3xl font-bold mb-3">
        Teesha stats 
      </h1>

      <div className="mb-2">
        Momentum Score: {momentum}
      </div>

      <div className="mb-2">
        System Status: {status}
      </div>

      <div className="mb-2">
        Tasks Completed: {completedTasks}/{totalTasks}
      </div>

      <div className="mb-2">
        Habits Completed: {completedHabits}
      </div>

      {lastBio && (
        <div className="mb-2">
          Sleep: {lastBio.sleep}h | Energy: {lastBio.energy}
        </div>
      )}

      {lastEmotion && (
        <div>
          Mood: {lastEmotion.mood} | Alive: {lastEmotion.alive}
        </div>
      )}

    </div>
  )
}