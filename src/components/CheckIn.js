"use client"

import { useTeesha } from "@/context/TeeshaContext"
import { getDailyLog, updateDailyLog } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"

const FIELDS = [
  { key: "sleep", label: "Sleep", max: 24 },
  { key: "energy", label: "Energy", max: 10 },
  { key: "mood", label: "Mood", max: 10 },
  { key: "focus", label: "Focus", max: 10 },
  { key: "stress", label: "Stress", max: 10 }
]

export default function CheckIn() {
  const { system, setSystem } = useTeesha()

  if (!system) return null

  const todayKey = getDayKey()
  const todayLog = getDailyLog(system, todayKey)

  function updateField(field, rawValue) {
    setSystem((current) => updateDailyLog(current, todayKey, (log) => ({
      ...log,
      checkIn: {
        ...log.checkIn,
        [field]: Math.max(0, Number(rawValue) || 0)
      }
    })))
  }

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label">Biometric Check-In</div>
          <h3 className="data-title mt-2 text-xl text-white">Context Only</h3>
        </div>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {FIELDS.map((field, index) => (
          <label key={field.key} className={`metric-tile ${index % 3 === 0 ? "accent" : index % 3 === 1 ? "hot" : "ember"}`}>
            <div className="terminal-label">{field.label}</div>
            <input type="number" min="0" max={field.max} value={todayLog.checkIn?.[field.key] ?? 0} onChange={(event) => updateField(field.key, event.target.value)} className="terminal-input mt-3 w-full px-3 py-3 text-3xl font-semibold" />
          </label>
        ))}
      </div>
    </section>
  )
}
