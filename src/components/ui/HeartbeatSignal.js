"use client"

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function buildHeartbeatPath(amplitude) {
  const baseline = 28
  const peak = baseline - amplitude
  const dip = baseline + Math.max(5, amplitude * 0.58)
  const segments = [
    "M 0 28",
    "L 30 28",
    "L 40 27",
    "L 52 28",
    `L 66 ${peak + 7}`,
    `L 76 ${peak}`,
    `L 88 ${dip}`,
    "L 98 28",
    "L 126 28",
    "L 138 27",
    "L 150 28",
    `L 164 ${peak + 5}`,
    `L 174 ${peak - 1}`,
    `L 186 ${dip - 2}`,
    "L 198 28",
    "L 232 28",
    "L 244 27",
    "L 256 28",
    `L 268 ${peak + 8}`,
    `L 278 ${peak + 1}`,
    `L 290 ${dip - 1}`,
    "L 302 28",
    "L 360 28"
  ]

  return segments.join(" ")
}

export default function HeartbeatSignal({ momentum }) {
  const safeMomentum = clamp(Number(momentum) || 0, 0, 100)
  const amplitude = 6 + ((safeMomentum / 100) * 14)
  const glowOpacity = 0.16 + ((safeMomentum / 100) * 0.34)
  const pulseDuration = `${clamp(1.8 - (safeMomentum / 1000), 1.15, 1.8)}s`
  const path = buildHeartbeatPath(amplitude)

  return (
    <div className="heartbeat-shell mt-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="terminal-label">Heartbeat</span>
        <span className="terminal-subtext text-xs">
          {safeMomentum >= 75 ? "Strong signal" : safeMomentum >= 45 ? "Stable signal" : "Weak signal"}
        </span>
      </div>

      <div className="heartbeat-track">
        <div className="heartbeat-scan" />

        <svg
          viewBox="0 0 360 56"
          className="heartbeat-svg"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M 0 28 L 360 28" className="heartbeat-baseline" />
          <path
            d={path}
            className="heartbeat-path"
            style={{
              animationDuration: pulseDuration,
              filter: `drop-shadow(0 0 8px rgba(var(--accent-rgb), ${glowOpacity}))`
            }}
          />
        </svg>
      </div>
    </div>
  )
}
