"use client"

import { useEffect, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import CurrentFocus from "@/components/CurrentFocus"
import MainGoal from "@/components/MainGoal"
import KpiInput from "@/components/KpiInput"
import MoneyTracker from "@/components/MoneyTracker"
import DailyTasks from "@/components/DailyTasks"
import HabitTracker from "@/components/HabitTracker"
import WeeklyGoals from "@/components/WeeklyGoals"
import CheckIn from "@/components/CheckIn"
import MomentumScore from "@/components/MomentumScore"
import ThemeConsole from "@/components/ThemeConsole"

const DOCK_ITEMS = [
  { id: "status", label: "Status", icon: "A", targetId: "status-section" },
  { id: "ledger", label: "Ledger", icon: "L", targetId: "ledger-section" },
  { id: "goals", label: "Goals", icon: "G", targetId: "goals-section" },
  { id: "stats", label: "Stats", icon: "S", targetId: "stats-section" }
]

function StatusBar() {
  return (
    <div className="system-status-bar">
      <div>[ SYSTEM_STATUS: <strong>ACTIVE</strong> ]</div>
      <div className="status-leds" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

function SystemDock({ activeTab, onNavigate }) {
  return (
    <div className="system-dock">
      {DOCK_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item)}
          className={`system-dock-item ${activeTab === item.id ? "active" : ""}`}
        >
          <div className="system-dock-icon">{item.icon}</div>
          <div>{item.label}</div>
        </button>
      ))}
    </div>
  )
}

function AppHeader() {
  const { system } = useTeesha()

  if (!system) return null

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="terminal-label">Daily Execution + Pressure System</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <h1 className="data-title text-[1.55rem] text-white sm:text-[1.8rem]">{system.appName}</h1>
          <div className="terminal-subtext mt-1 text-sm">Visible inputs. Visible outcomes. No hiding.</div>
        </div>
        <div className="terminal-chip px-3 py-1 text-[0.65rem]">LIVE</div>
      </div>
    </div>
  )
}

export default function Page() {
  const [activeTab, setActiveTab] = useState("goals")

  useEffect(() => {
    const sectionElements = DOCK_ITEMS
      .map((item) => ({
        id: item.id,
        element: document.getElementById(item.targetId)
      }))
      .filter((entry) => entry.element)

    if (sectionElements.length === 0) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (!visibleEntry) {
          return
        }

        const matchingSection = sectionElements.find((entry) => entry.element === visibleEntry.target)

        if (matchingSection) {
          setActiveTab(matchingSection.id)
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.45, 0.7]
      }
    )

    sectionElements.forEach((entry) => observer.observe(entry.element))

    return () => {
      observer.disconnect()
    }
  }, [])

  function handleNavigate(item) {
    const target = document.getElementById(item.targetId)

    if (!target) {
      return
    }

    setActiveTab(item.id)
    target.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="mx-auto max-w-[430px] px-0 pb-0 pt-0 sm:max-w-[470px] sm:px-4 sm:py-6">
      <div className="app-frame">
        <StatusBar />
        <AppHeader />
        <div className="app-content space-y-4 px-3 pb-4 sm:px-4">
          <section id="status-section" className="dock-anchor">
            <CurrentFocus />
          </section>
          <section id="goals-section" className="dock-anchor space-y-4">
            <MainGoal />
            <KpiInput />
          </section>
          <section id="ledger-section" className="dock-anchor">
            <MoneyTracker />
          </section>
          <DailyTasks />
          <HabitTracker />
          <WeeklyGoals />
          <CheckIn />
          <section id="stats-section" className="dock-anchor">
            <MomentumScore />
          </section>
          <ThemeConsole />
        </div>
        <SystemDock activeTab={activeTab} onNavigate={handleNavigate} />
      </div>
    </div>
  )
}
