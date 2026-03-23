"use client"

import Landing from "@/components/Landing"
import DailyTodos from "@/components/DailyTodos"
import WeeklyTodos from "@/components/WeeklyTodos"
import Habits from "@/components/Habits"
import Biometrics from "@/components/Biometrics"
import EmotionLog from "@/components/EmotionLog"
import ThemeCustomizer from "@/components/ThemeCustomizer"

import EnergyChart from "@/components/charts/EnergyChart"
import MomentumTrendChart from "@/components/charts/MomentumTrendChart"

export default function Page() {

  return (
    <div className="mx-auto max-w-3xl p-3 sm:p-5">
      <div className="app-frame">
        <div className="app-content px-4 py-5 sm:px-6 sm:py-6">

          <Landing />

          <EnergyChart />

          <MomentumTrendChart />

          <DailyTodos />

          <WeeklyTodos />

          <Habits />

          <Biometrics />

          <EmotionLog />

          <ThemeCustomizer />

        </div>
      </div>
    </div>
  )
}
