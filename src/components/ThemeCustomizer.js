"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { DEFAULT_THEME_ACCENT } from "@/lib/systemLogic"

export default function ThemeCustomizer() {
  const { system, setSystem } = useTeesha()
  const [isOpen, setIsOpen] = useState(false)

  if (!system) return null

  const currentAccent = system.themeAccent ?? DEFAULT_THEME_ACCENT

  function updateAccent(nextAccent) {
    setSystem((current) => ({
      ...current,
      themeAccent: nextAccent
    }))
  }

  return (
    <section className="terminal-section mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="terminal-label mb-1">
            Visual Theme
          </div>
          <div className="terminal-subtext text-sm">
            Change the accent color for the full interface.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="terminal-button px-4 py-2 text-sm"
        >
          Change Color
        </button>
      </div>

      {isOpen && (
        <div className="terminal-card mt-4 grid gap-3 p-4 md:grid-cols-[120px_1fr]">
          <div
            className="terminal-picker-swatch h-24"
            style={{
              background: `linear-gradient(135deg, ${currentAccent}, #04110b)`
            }}
          />

          <div className="space-y-3">
            <input
              type="color"
              value={currentAccent}
              onChange={(event) => updateAccent(event.target.value)}
              className="theme-color-input"
            />

            <input
              type="text"
              value={currentAccent}
              readOnly
              className="terminal-input w-full px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}
    </section>
  )
}
