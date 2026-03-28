"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { useTeesha } from "@/context/TeeshaContext"
import { getDailyLog, getMomentumSeries, getTodayKpiCompletion } from "@/lib/dashboard"
import { calculateMomentum } from "@/lib/momentum"
import { getDayKey } from "@/lib/systemLogic"

function ratio(done, total) {
  if (total <= 0) return 0
  return done / total
}

export default function MomentumScore() {
  const { system } = useTeesha()

  if (!system) return null

  const todayKey = getDayKey()
  const todayLog = getDailyLog(system, todayKey)
  const todayTasks = system.tasks.filter((task) => task.date === todayKey)
  const completedTasks = todayTasks.filter((task) => task.completed).length
  const taskCompletion = ratio(completedTasks, todayTasks.length)
  const habitCompletion = ratio(todayLog.habitsCompleted.length, system.habits.length)
  const kpiCompletion = getTodayKpiCompletion(system, todayKey)
  const momentum = calculateMomentum(system)
  const momentumSeries = getMomentumSeries(system)

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label">Current Momentum Velocity</div>
          <h3 className="data-title mt-2 text-xl text-white">Momentum Score</h3>
        </div>
      </div>

      <div className="terminal-card px-4 py-5">
        <div
          className="mx-auto grid h-[220px] w-[220px] place-items-center rounded-full border border-white/10"
          style={{ background: `conic-gradient(rgb(var(--accent-rgb)) 0 ${momentum * 3.6}deg, rgba(255,255,255,0.14) ${momentum * 3.6}deg 360deg)` }}
        >
          <div className="grid h-[178px] w-[178px] place-items-center rounded-full bg-[rgb(var(--ink-rgb))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <div className="text-center">
              <div className="neon-number money-primary text-[4rem]">{momentum}</div>
              <div className="hot-text text-sm font-semibold uppercase tracking-[0.08em]">{Math.round(kpiCompletion * 100)}% KPI rate</div>
            </div>
          </div>
        </div>

        <div className="metric-grid mt-5">
          <div className="metric-tile accent"><div className="terminal-label">Tasks</div><div className="mt-2 text-2xl font-semibold text-white">{Math.round(taskCompletion * 30)}</div></div>
          <div className="metric-tile hot"><div className="terminal-label">Habits</div><div className="mt-2 text-2xl font-semibold text-white">{Math.round(habitCompletion * 30)}</div></div>
          <div className="metric-tile ember"><div className="terminal-label">KPI</div><div className="mt-2 text-2xl font-semibold text-white">{Math.round(kpiCompletion * 40)}</div></div>
          <div className="metric-tile accent"><div className="terminal-label">Output</div><div className="mt-2 text-2xl font-semibold text-white">{momentum}/100</div></div>
        </div>
      </div>

      <div className="mt-5 h-52 w-full panel-frame px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={momentumSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--terminal-grid)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis stroke="var(--terminal-text-soft)" tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="rgb(var(--accent-rgb))" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
