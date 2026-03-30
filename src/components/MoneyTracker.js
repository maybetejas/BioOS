"use client"

import { useEffect, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { formatCurrency, getDailyLog, updateDailyLog } from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"

export default function MoneyTracker() {
  const { system, setSystem } = useTeesha()
  const todayKey = getDayKey()
  const todayValue = system ? getDailyLog(system, todayKey).moneyEarned : 0
  const [draftValue, setDraftValue] = useState(todayValue)

  useEffect(() => {
    setDraftValue(todayValue)
  }, [todayValue])

  if (!system) return null

  const target = Number(system.moneyTargetPerDay) || 0
  const gap = Math.max(0, target - (Number(todayValue) || 0))

  function saveMoney() {
    setSystem((current) => updateDailyLog(current, todayKey, (log) => ({
      ...log,
      moneyEarned: Math.max(0, Number(draftValue) || 0)
    })))
  }

  return (
    <section className="terminal-card px-4 py-4">
      <div className="section-heading mb-4">
        <div>
          <div className="terminal-label hot-text">Record Earning</div>
          <h3 className="data-title mt-2 text-base text-white">Today&apos;s money</h3>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-white">{formatCurrency(todayValue)}</div>
          <div className="terminal-subtext text-xs">Target {formatCurrency(target)}</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              saveMoney()
            }
          }}
          className="terminal-input px-4 py-3 text-xl font-semibold"
          placeholder="0"
        />
        <button type="button" onClick={saveMoney} className="terminal-button px-5 py-3 text-sm">Save</button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="terminal-subtext text-sm">
          {gap > 0 ? `${formatCurrency(gap)} left to target` : "On target"}
        </div>
        <button
          type="button"
          onClick={() => setSystem((current) => ({ ...current, moneyTargetPerDay: Math.max(0, Number(draftValue) || 0) }))}
          className="terminal-button-muted px-3 py-2 text-xs"
        >
          Set as target
        </button>
      </div>
    </section>
  )
}
