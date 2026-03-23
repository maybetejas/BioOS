"use client"

import Landing from "@/components/Landing"
import DailyTodos from "@/components/DailyTodos"
import WeeklyTodos from "@/components/WeeklyTodos"
import Habits from "@/components/Habits"
import Biometrics from "@/components/Biometrics"
import EmotionLog from "@/components/EmotionLog"

import SleepChart from "@/components/charts/SleepChart"
import EnergyChart from "@/components/charts/EnergyChart"
import MomentumTrendChart from "@/components/charts/MomentumTrendChart"

export default function Page() {

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">

      <Landing />

      <SleepChart />

      <EnergyChart />

      <MomentumTrendChart />

      <DailyTodos />

      <WeeklyTodos />

      <Habits />

      <Biometrics />

      <EmotionLog />

    </div>
  )
}
