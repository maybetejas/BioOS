"use client"

import { createContext, useContext, useEffect, useSyncExternalStore } from "react"
import { DEFAULT_THEME_ACCENT } from "@/lib/systemLogic"
import {
  getSystemSnapshot,
  refreshStoredSystem,
  subscribeSystem,
  updateStoredSystem
} from "@/lib/storage"

const TeeshaContext = createContext()

function hexToRgbString(hex) {
  const normalized = String(hex).replace("#", "")

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "109, 255, 139"
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return `${red}, ${green}, ${blue}`
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function scaleRgb(rgbString, factor) {
  const [red, green, blue] = rgbString.split(",").map((part) => Number(part.trim()))

  if (![red, green, blue].every(Number.isFinite)) {
    return "109, 255, 139"
  }

  return [
    clampChannel(red * factor),
    clampChannel(green * factor),
    clampChannel(blue * factor)
  ].join(", ")
}

function mixRgb(rgbString, target, amount) {
  const [red, green, blue] = rgbString.split(",").map((part) => Number(part.trim()))

  if (![red, green, blue].every(Number.isFinite)) {
    return "168, 255, 189"
  }

  const mixed = [
    red + ((target[0] - red) * amount),
    green + ((target[1] - green) * amount),
    blue + ((target[2] - blue) * amount)
  ]

  return mixed.map(clampChannel).join(", ")
}

export function TeeshaProvider({ children }) {

  const system = useSyncExternalStore(
    subscribeSystem,
    getSystemSnapshot,
    () => null
  )

  useEffect(() => {
    refreshStoredSystem()

    window.addEventListener("focus", refreshStoredSystem)
    document.addEventListener("visibilitychange", refreshStoredSystem)
    const intervalId = window.setInterval(refreshStoredSystem, 60 * 1000)

    return () => {
      window.removeEventListener("focus", refreshStoredSystem)
      document.removeEventListener("visibilitychange", refreshStoredSystem)
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const accent = system?.themeAccent ?? DEFAULT_THEME_ACCENT
    const accentRgb = hexToRgbString(accent)

    document.documentElement.style.setProperty("--accent", accent)
    document.documentElement.style.setProperty("--accent-rgb", accentRgb)
    document.documentElement.style.setProperty("--accent-deep-rgb", scaleRgb(accentRgb, 0.18))
    document.documentElement.style.setProperty("--accent-mid-rgb", scaleRgb(accentRgb, 0.42))
    document.documentElement.style.setProperty("--accent-strong-rgb", mixRgb(accentRgb, [255, 255, 255], 0.4))
  }, [system])

  return (
    <TeeshaContext.Provider value={{ system, setSystem: updateStoredSystem }}>
      {children}
    </TeeshaContext.Provider>
  )
}

export function useTeesha() {
  return useContext(TeeshaContext)
}
