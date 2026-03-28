"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { formatCurrency, formatDeadline, formatValue, getDailyLog, getGoalProgressData } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"

function createKpi() {
  return {
    id: `kpi-${Date.now()}-${Math.random()}`,
    name: "",
    target: 0
  }
}

export default function MainGoal() {
  const { system, setSystem } = useTeesha()
  const [draftKpi, setDraftKpi] = useState(createKpi())

  if (!system) return null

  const todayLog = getDailyLog(system, getDayKey())
  const { currentValue, progress, progressKpiName, isCurrency } = getGoalProgressData(system)
  const formatMetric = isCurrency ? formatCurrency : formatValue

  function updateGoal(field, value) {
    setSystem((current) => ({
      ...current,
      mainGoal: {
        ...current.mainGoal,
        [field]: value
      }
    }))
  }

  function addKpi() {
    const name = draftKpi.name.trim()
    const target = Number(draftKpi.target)

    if (!name) return

    setSystem((current) => ({
      ...current,
      mainGoal: {
        ...current.mainGoal,
        kpis: [...current.mainGoal.kpis, {
          ...draftKpi,
          name,
          target: Number.isFinite(target) ? Math.max(0, target) : 0
        }]
      }
    }))
    setDraftKpi(createKpi())
  }

  function removeKpi(id) {
    setSystem((current) => ({
      ...current,
      mainGoal: {
        ...current.mainGoal,
        kpis: current.mainGoal.kpis.filter((kpi) => kpi.id !== id)
      }
    }))
  }

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label">Primary Objective</div>
          <h2 className="mt-2 text-[2rem] font-semibold leading-[1.02] text-white">{system.mainGoal.title}</h2>
        </div>
        <div className="text-right">
          <div className="neon-number text-[2.3rem] money-primary">{Math.round(progress * 100)}%</div>
        </div>
      </div>

      <div className="mt-5 progress-track">
        <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <div className="metric-grid mt-5">
        <div className="metric-tile accent">
          <div className="terminal-label">Tracked Value</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatMetric(currentValue)}</div>
          <div className="terminal-subtext text-sm">{progressKpiName || "Goal progress input"}</div>
        </div>
        <div className="metric-tile hot">
          <div className="terminal-label">Target</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatMetric(system.mainGoal.targetValue)}</div>
          <div className="terminal-subtext text-sm">Goal target value</div>
        </div>
        <div className="metric-tile ember">
          <div className="terminal-label">Deadline</div>
          <div className="mt-2 text-2xl font-semibold text-white">{system.mainGoal.deadline ? system.mainGoal.deadline.slice(5) : "OPEN"}</div>
          <div className="terminal-subtext text-sm">{formatDeadline(system.mainGoal.deadline)}</div>
        </div>
        <div className="metric-tile accent">
          <div className="terminal-label">KPI Count</div>
          <div className="mt-2 text-2xl font-semibold text-white">{system.mainGoal.kpis.length}</div>
          <div className="terminal-subtext text-sm">Daily execution inputs</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input value={system.mainGoal.title} onChange={(event) => updateGoal("title", event.target.value)} className="terminal-input px-3 py-3 sm:col-span-2" placeholder="Main goal" />
        <input type="number" value={system.mainGoal.targetValue} onChange={(event) => updateGoal("targetValue", Math.max(0, Number(event.target.value) || 0))} className="terminal-input px-3 py-3" placeholder="Target value" />
        <input type="date" value={system.mainGoal.deadline} onChange={(event) => updateGoal("deadline", event.target.value)} className="terminal-input px-3 py-3" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {system.mainGoal.kpis.map((kpi) => (
          <div key={kpi.id} className="terminal-chip px-3 py-2 text-sm">
            <span>{kpi.name}</span>
            <span className="text-white">{Number(todayLog.kpis?.[kpi.name]) || 0}/{kpi.target}</span>
            <button type="button" onClick={() => removeKpi(kpi.id)} className="terminal-subtext underline">x</button>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_0.7fr_auto]">
        <input value={draftKpi.name} onChange={(event) => setDraftKpi((current) => ({ ...current, name: event.target.value }))} className="terminal-input px-3 py-3" placeholder="Add KPI" />
        <input type="number" value={draftKpi.target} onChange={(event) => setDraftKpi((current) => ({ ...current, target: event.target.value }))} className="terminal-input px-3 py-3" placeholder="Target" />
        <button type="button" onClick={addKpi} className="terminal-button px-4 py-3 text-sm">Add</button>
      </div>
    </section>
  )
}
