"use client"

import { useTeesha } from "@/context/TeeshaContext"
import { getDailyLog, updateDailyLog } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"

export default function KpiInput() {
  const { system, setSystem } = useTeesha()

  if (!system) return null

  const todayKey = getDayKey()
  const todayLog = getDailyLog(system, todayKey)

  function updateKpiValue(name, rawValue) {
    setSystem((current) => updateDailyLog(current, todayKey, (log) => {
      const nextKpis = { ...log.kpis }

      if (rawValue === "") delete nextKpis[name]
      else nextKpis[name] = Math.max(0, Number(rawValue) || 0)

      return {
        ...log,
        kpis: nextKpis
      }
    }))
  }

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label">Telemetry Input</div>
          <h3 className="data-title mt-2 text-xl text-white">Daily KPI Capture</h3>
        </div>
      </div>

      <div className="space-y-3">
        {system.mainGoal.kpis.length > 0 ? system.mainGoal.kpis.map((kpi) => (
          <label key={kpi.id} className="terminal-card flex items-center gap-3 px-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="data-title text-sm text-white">{kpi.name}</div>
              <div className="terminal-subtext mt-1 text-sm">Target: {kpi.target}</div>
            </div>
            <input
              type="number"
              inputMode="numeric"
              value={todayLog.kpis?.[kpi.name] ?? ""}
              onChange={(event) => updateKpiValue(kpi.name, event.target.value)}
              className="terminal-input w-28 px-3 py-3 text-right text-xl"
              placeholder="0"
            />
          </label>
        )) : (
          <div className="terminal-subtext">Add at least one KPI in Main Goal first.</div>
        )}
      </div>
    </section>
  )
}
