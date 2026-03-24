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
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-6">
      <div className="app-frame">
        <div className="app-content px-1 py-2 sm:px-2 sm:py-3">

          <Landing />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div>
              <DailyTodos />
              <WeeklyTodos />
              <Habits />
              <ThemeCustomizer />
            </div>

            <div>
              <Biometrics />
              <EmotionLog />
              <EnergyChart />
              <MomentumTrendChart />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
