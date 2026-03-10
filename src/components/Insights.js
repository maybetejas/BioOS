"use client"

import { useTeesha } from "@/context/TeeshaContext"

export default function Insights() {

  const { system } = useTeesha()

  if (!system) return null

  const insights = []

  const tasksDone = system.dailyTodos.filter(t => t.completed).length
  const totalTasks = system.dailyTodos.length

  if (totalTasks > 0 && tasksDone / totalTasks < 0.4) {
    insights.push("Execution drift detected")
  }

  const lastBio = system.biometrics.at(-1)

  if (lastBio && lastBio.sleep < 6) {
    insights.push("Sleep debt detected")
  }

  if (lastBio && lastBio.energy < 4) {
    insights.push("Low energy levels")
  }

  const lastEmotion = system.emotions.at(-1)

  if (lastEmotion && lastEmotion.mood < 4) {
    insights.push("Mood instability detected")
  }

  if (lastEmotion && lastEmotion.stress > 7) {
    insights.push("High stress state")
  }

  return (
    <div>

      <h2 className="text-xl font-bold mb-3">
        System Insights
      </h2>

      {insights.length === 0 && (
        <div>No insights yet.</div>
      )}

      {insights.map((insight, index) => (
        <div key={index}>
          • {insight}
        </div>
      ))}

    </div>
  )
}