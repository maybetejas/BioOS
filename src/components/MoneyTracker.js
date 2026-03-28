"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { useTeesha } from "@/context/TeeshaContext"
import {
  formatCurrency,
  getDailyLog,
  getMonthMoneyTotal,
  getMoneySeries,
  getRecentMoneyEntries,
  updateDailyLog
} from "@/lib/dashboard"
import { getDayKey } from "@/lib/systemLogic"

export default function MoneyTracker() {
  const { system, setSystem } = useTeesha()

  if (!system) return null

  const todayKey = getDayKey()
  const todayLog = getDailyLog(system, todayKey)
  const moneySeries = getMoneySeries(system)
  const monthTotal = getMonthMoneyTotal(system)
  const recentEntries = getRecentMoneyEntries(system)
  const pressureGap = Math.max(0, (system.moneyTargetPerDay || 0) - (todayLog.moneyEarned || 0))

  function updateMoney(rawValue) {
    setSystem((current) => updateDailyLog(current, todayKey, (log) => ({
      ...log,
      moneyEarned: Math.max(0, Number(rawValue) || 0)
    })))
  }

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label hot-text">Pain Engine Tracker</div>
          <h3 className="data-title mt-2 text-xl text-white">Real-Time Earnings</h3>
        </div>
      </div>

      <div className="panel-frame px-4 py-4">
        <div className="terminal-label">Monthly Total</div>
        <div className="neon-number money-primary mt-3 text-[3rem] sm:text-[3.4rem]">{formatCurrency(monthTotal)}</div>
        <div className="mt-8 text-right">
          <div className="neon-number money-secondary text-[2.25rem] sm:text-[2.7rem]">{formatCurrency(todayLog.moneyEarned)}</div>
          <div className="terminal-label mt-2 hot-text">Today Earned</div>
        </div>
      </div>

      <div className="mt-5 panel-frame px-4 py-4">
        <div className="section-heading">
          <h3 className="data-title text-xl text-white">Earnings Trend</h3>
          <div className="terminal-subtext text-xs">Actual daily earnings</div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moneySeries} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--terminal-grid)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} minTickGap={18} />
              <YAxis stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="rgb(var(--hot-rgb))" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 terminal-card px-4 py-4">
        <div className="terminal-label hot-text">Add Today&apos;s Earning</div>
        <input type="number" value={todayLog.moneyEarned} onChange={(event) => updateMoney(event.target.value)} className="terminal-input mt-4 w-full px-4 py-4 text-[2rem] font-semibold" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="terminal-subtext mb-1 text-xs uppercase tracking-[0.14em]">Daily Target</div>
            <input
              type="number"
              value={system.moneyTargetPerDay}
              onChange={(event) => setSystem((current) => ({ ...current, moneyTargetPerDay: Math.max(0, Number(event.target.value) || 0) }))}
              className="terminal-input w-full px-3 py-3"
            />
          </div>
          <div className={`panel-frame px-3 py-3 ${pressureGap > 0 ? "text-red-200" : "text-emerald-200"}`}>
            <div className="terminal-label">Pressure</div>
            <div className="mt-2 text-lg font-semibold">{pressureGap > 0 ? `-${formatCurrency(pressureGap)}` : "On target"}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="section-heading">
          <h3 className="data-title text-xl text-white">Daily Entries</h3>
        </div>
        {recentEntries.map((entry) => (
          <div key={entry.dayKey} className="list-row">
            <div>
              <div className="terminal-subtext text-xs uppercase">{entry.dayKey}</div>
              <div className="mt-1 text-lg font-semibold text-white">Money Logged</div>
            </div>
            <div className="text-right text-2xl font-semibold text-white">{formatCurrency(entry.amount)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
