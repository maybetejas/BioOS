"use client"

import { useTeesha } from "@/context/TeeshaContext"

const PRESETS = [
  "#25e7ff",
  "#59f3c1",
  "#ff6ff1",
  "#ffd25a",
  "#7aa2ff",
  "#ff8e63",
  "#9cff57",
  "#ff4d8d",
  "#a77dff",
  "#7df9ff"
]

export default function ThemeConsole() {
  const { system, setSystem } = useTeesha()

  if (!system) return null

  function updateAccent(themeAccent) {
    setSystem((current) => ({
      ...current,
      themeAccent
    }))
  }

  return (
    <section className="terminal-section">
      <div className="section-heading">
        <div>
          <div className="terminal-label">Theme Kernel</div>
          <h3 className="data-title mt-2 text-xl text-white">Color Control</h3>
        </div>
      </div>

      <div className="terminal-subtext mb-4 text-sm">
        Pick one color and the whole interface retunes its borders, glow, and highlight channels automatically.
      </div>

      <div className="flex flex-wrap gap-3">
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
          Custom accent. The app will auto-build the secondary hot color and the rest of the chrome from this.
        </div>
      </div>
    </section>
  )
}
