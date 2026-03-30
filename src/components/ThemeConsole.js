"use client"

import { useTeesha } from "@/context/TeeshaContext"
import { getThemeAccentForDate, THEME_ACCENT_CYCLE } from "@/lib/systemLogic"

const PRESETS = [...new Set([...THEME_ACCENT_CYCLE, "#59f3c1", "#7aa2ff", "#ff8e63", "#ff4d8d", "#a77dff"])]

export default function ThemeConsole() {
  const { system, setSystem } = useTeesha()

  if (!system) return null

  function updateAccent(themeAccent) {
    setSystem((current) => ({
      ...current,
      themeMode: "manual",
      themeAccent
    }))
  }

  function setMode(themeMode) {
    setSystem((current) => ({
      ...current,
      themeMode,
      themeAccent: themeMode === "auto" ? getThemeAccentForDate() : current.themeAccent
    }))
  }

  return (
    <section className="terminal-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="terminal-label">Accent Control</div>
          <h3 className="data-title mt-2 text-base text-white">Daily theme switch</h3>
        </div>
        <div className="terminal-chip-muted px-3 py-1 text-[0.62rem]">
          {system.themeMode === "auto" ? "AUTO DAILY" : "MANUAL"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("auto")}
          className={`terminal-button-muted px-3 py-3 text-xs ${system.themeMode === "auto" ? "border-[rgba(var(--accent-rgb),0.55)] text-white" : ""}`}
        >
          Auto every day
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`terminal-button-muted px-3 py-3 text-xs ${system.themeMode === "manual" ? "border-[rgba(var(--accent-rgb),0.55)] text-white" : ""}`}
        >
          Manual pick
        </button>
      </div>

      <div className="terminal-subtext mt-3 text-sm">
        One accent at a time across bars, borders, arrows, and highlights.
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => updateAccent(color)}
            className={`theme-swatch ${system.themeAccent === color ? "active" : ""}`}
            style={{ background: `linear-gradient(135deg, ${color}, rgba(255,255,255,0.08))` }}
            aria-label={`Set theme color ${color}`}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <input type="color" value={system.themeAccent} onChange={(event) => updateAccent(event.target.value)} className="theme-color-input" />
        <div className="terminal-subtext text-sm">
          Custom accent. Auto mode will pick the daily color on next open. Manual mode keeps your chosen accent.
        </div>
      </div>
    </section>
  )
}
