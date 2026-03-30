"use client"

import { createContext, useContext, useEffect, useSyncExternalStore } from "react"
import { DEFAULT_THEME_ACCENT, getThemeAccentForDate, THEME_ACCENT_CYCLE } from "@/lib/systemLogic"
import {
  getSystemSnapshot,
  refreshStoredSystem,
  subscribeSystem,
  updateStoredSystem
} from "@/lib/storage"

const TeeshaContext = createContext()

function hexToRgb(hex) {
  const normalized = String(hex).replace("#", "")

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return { red: 109, green: 255, blue: 139 }
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16)
  }
}

function rgbToString({ red, green, blue }) {
  return `${red}, ${green}, ${blue}`
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function scaleRgb(rgb, factor) {
  return rgbToString({
    red: clampChannel(rgb.red * factor),
    green: clampChannel(rgb.green * factor),
    blue: clampChannel(rgb.blue * factor)
  })
}

function mixRgb(source, target, amount) {
  return rgbToString({
    red: clampChannel(source.red + ((target.red - source.red) * amount)),
    green: clampChannel(source.green + ((target.green - source.green) * amount)),
    blue: clampChannel(source.blue + ((target.blue - source.blue) * amount))
  })
}

function rgbToHsl({ red, green, blue }) {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let hue = 0
  const lightness = (max + min) / 2
  const saturation = delta === 0
    ? 0
    : delta / (1 - Math.abs((2 * lightness) - 1))

  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = ((b - r) / delta) + 2
    else hue = ((r - g) / delta) + 4
  }

  return {
    hue: Math.round((hue * 60 + 360) % 360),
    saturation,
    lightness
  }
}

function hueToRgb(p, q, t) {
  let value = t

  if (value < 0) value += 1
  if (value > 1) value -= 1
  if (value < 1 / 6) return p + ((q - p) * 6 * value)
  if (value < 1 / 2) return q
  if (value < 2 / 3) return p + ((q - p) * ((2 / 3) - value) * 6)
  return p
}

function hslToRgb({ hue, saturation, lightness }) {
  const h = hue / 360

  if (saturation === 0) {
    const gray = clampChannel(lightness * 255)
    return { red: gray, green: gray, blue: gray }
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - (lightness * saturation)
  const p = (2 * lightness) - q

  return {
    red: clampChannel(hueToRgb(p, q, h + (1 / 3)) * 255),
    green: clampChannel(hueToRgb(p, q, h) * 255),
    blue: clampChannel(hueToRgb(p, q, h - (1 / 3)) * 255)
  }
}

function buildThemePalette(hex) {
  const accentRgb = hexToRgb(hex)
  const accentHsl = rgbToHsl(accentRgb)
  const brightRgb = hslToRgb({
    hue: accentHsl.hue,
    saturation: Math.min(1, Math.max(0.58, accentHsl.saturation)),
    lightness: Math.min(0.82, Math.max(0.64, accentHsl.lightness + 0.12))
  })
  const softRgb = hslToRgb({
    hue: accentHsl.hue,
    saturation: Math.min(1, Math.max(0.45, accentHsl.saturation - 0.05)),
    lightness: Math.min(0.66, Math.max(0.5, accentHsl.lightness + 0.02))
  })

  return {
    accentRgb: rgbToString(accentRgb),
    accentDeepRgb: scaleRgb(accentRgb, 0.16),
    accentMidRgb: scaleRgb(accentRgb, 0.44),
    accentStrongRgb: mixRgb(accentRgb, { red: 255, green: 255, blue: 255 }, 0.28),
    hotRgb: rgbToString(brightRgb),
    emberRgb: rgbToString(softRgb)
  }
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
    const palette = buildThemePalette(accent)

    document.documentElement.style.setProperty("--accent", accent)
    document.documentElement.style.setProperty("--accent-rgb", palette.accentRgb)
    document.documentElement.style.setProperty("--accent-deep-rgb", palette.accentDeepRgb)
    document.documentElement.style.setProperty("--accent-mid-rgb", palette.accentMidRgb)
    document.documentElement.style.setProperty("--accent-strong-rgb", palette.accentStrongRgb)
    document.documentElement.style.setProperty("--hot-rgb", palette.hotRgb)
    document.documentElement.style.setProperty("--ember-rgb", palette.emberRgb)
  }, [system])

  useEffect(() => {
    if (!system || system.themeMode !== "auto") {
      return
    }

    const dailyAccent = getThemeAccentForDate()

    if (system.themeAccent === dailyAccent) {
      return
    }

    updateStoredSystem((current) => (
      current?.themeMode === "auto"
        ? { ...current, themeAccent: dailyAccent }
        : current
    ))
  }, [system])

  useEffect(() => {
    if (typeof window === "undefined" || typeof DeviceMotionEvent === "undefined") {
      return
    }

    let lastSwapAt = 0

    function handleMotion(event) {
      const acceleration = event.accelerationIncludingGravity

      if (!acceleration) {
        return
      }

      const totalForce = Math.abs(acceleration.x || 0) + Math.abs(acceleration.y || 0) + Math.abs(acceleration.z || 0)
      const now = Date.now()

      if (totalForce < 42 || now - lastSwapAt < 1400) {
        return
      }

      lastSwapAt = now

      updateStoredSystem((current) => {
        const currentAccent = current?.themeAccent ?? DEFAULT_THEME_ACCENT
        const currentIndex = THEME_ACCENT_CYCLE.indexOf(currentAccent)
        const nextAccent = THEME_ACCENT_CYCLE[(currentIndex + 1 + THEME_ACCENT_CYCLE.length) % THEME_ACCENT_CYCLE.length]

        return {
          ...current,
          themeMode: "manual",
          themeAccent: nextAccent
        }
      })
    }

    window.addEventListener("devicemotion", handleMotion)

    return () => {
      window.removeEventListener("devicemotion", handleMotion)
    }
  }, [])

  return (
    <TeeshaContext.Provider value={{ system, setSystem: updateStoredSystem }}>
      {children}
    </TeeshaContext.Provider>
  )
}

export function useTeesha() {
  return useContext(TeeshaContext)
}
