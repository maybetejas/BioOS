"use client"

export default function StatusCheckbox({
  checked,
  onChange,
  children,
  className = "",
  textClassName = ""
}) {
  return (
    <label className={`terminal-checkbox-label ${className}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />

      <span className="terminal-checkbox" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          className={`h-3 w-3 transition-opacity sm:h-3.5 sm:w-3.5 ${checked ? "opacity-100" : "opacity-0"}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className={`terminal-checkbox-text ${checked ? "terminal-checkbox-text-checked" : ""} ${textClassName}`.trim()}>
        {children}
      </span>
    </label>
  )
}
