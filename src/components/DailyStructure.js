"use client"

import { useEffect, useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"
import { getDayKey } from "@/lib/systemLogic"

const TYPE_STYLES = {
  skill: "border-sky-300/30 bg-sky-500/10 text-sky-100",
  financial: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
  physical: "border-amber-300/30 bg-amber-500/10 text-amber-100",
  free: "border-neutral-300/30 bg-white/10 text-neutral-100"
}

function toMinutes(timeValue) {
  const [hours, minutes] = String(timeValue).split(":").map(Number)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return (hours * 60) + minutes
}

function formatTime(timeValue) {
  const minutes = toMinutes(timeValue)

  if (minutes === null) {
    return timeValue
  }

  const date = new Date()
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date)
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value) && toMinutes(value) !== null
}

function formatType(type) {
  return String(type)
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function createEmptyForm() {
  return {
    id: null,
    startTime: "",
    endTime: "",
    label: "",
    type: "skill"
  }
}

function createBlockId(start, end, label, existingIds) {
  const base = normalizeIdPart(`${label}-${start}-${end}`)
  let candidate = `routine-${base || "block"}`
  let suffix = 2

  while (existingIds.has(candidate)) {
    candidate = `routine-${base || "block"}-${suffix}`
    suffix += 1
  }

  return candidate
}

function normalizeIdPart(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

function normalizeTag(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
}

function getTypeStyle(type) {
  if (type === "skill") return TYPE_STYLES.skill
  if (type === "financial") return TYPE_STYLES.financial
  if (type === "physical") return TYPE_STYLES.physical
  if (type === "free") return TYPE_STYLES.free
  return "border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-100"
}

export default function DailyStructure() {
  const { system, setSystem } = useTeesha()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(createEmptyForm())
  const [newTag, setNewTag] = useState("")
  const [error, setError] = useState("")
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30 * 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  if (!system) return null

  const minutesNow = (now.getHours() * 60) + now.getMinutes()
  const activeBlockId = system.routineTemplate.find((block) => {
    const start = toMinutes(block.startTime)
    const end = toMinutes(block.endTime)
    return start !== null && end !== null && minutesNow >= start && minutesNow < end
  })?.id ?? null

  const todayKey = getDayKey()
  const completedBlockIds = system.dailyStructure?.completedBlockIds ?? []
  const completedSet = new Set(completedBlockIds)
  const blockCount = system.routineTemplate.length
  const completedCount = system.routineTemplate.filter((block) => completedSet.has(block.id)).length
  const activeBlock = system.routineTemplate.find((block) => block.id === activeBlockId)
  const routineTags = system.routineTags?.length ? system.routineTags : ["skill", "financial", "physical", "free"]

  function saveTemplate(nextTemplate) {
    const sortedTemplate = [...nextTemplate].sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime))
    const validIds = new Set(sortedTemplate.map((block) => block.id))
    const nextCompleted = completedBlockIds.filter((id) => validIds.has(id))

    setSystem({
      ...system,
      routineTemplate: sortedTemplate,
      dailyStructure: {
        dayKey: todayKey,
        completedBlockIds: nextCompleted
      }
    })
  }

  function toggleBlockCompletion(blockId) {
    const hasCompleted = completedSet.has(blockId)
    const nextCompleted = hasCompleted
      ? completedBlockIds.filter((id) => id !== blockId)
      : [...completedBlockIds, blockId]

    setSystem({
      ...system,
      dailyStructure: {
        dayKey: todayKey,
        completedBlockIds: nextCompleted
      }
    })
  }

  function resetForm() {
    setForm({
      ...createEmptyForm(),
      type: routineTags[0] ?? "free"
    })
    setError("")
  }

  function addTag() {
    const normalizedTag = normalizeTag(newTag)

    if (!normalizedTag) {
      setError("Tag cannot be empty.")
      return
    }

    if (routineTags.includes(normalizedTag)) {
      setError("Tag already exists.")
      return
    }

    setSystem({
      ...system,
      routineTags: [...routineTags, normalizedTag]
    })
    setForm((current) => ({ ...current, type: normalizedTag }))
    setNewTag("")
    setError("")
  }

  function saveBlock() {
    const label = form.label.trim()
    const start = form.startTime.trim()
    const end = form.endTime.trim()

    if (!label) {
      setError("Label is required.")
      return
    }

    if (!isValidTime(start) || !isValidTime(end)) {
      setError("Times must be valid in HH:MM format.")
      return
    }

    if (toMinutes(start) >= toMinutes(end)) {
      setError("End time must be after start time.")
      return
    }

    const nextBlock = {
      id: form.id ?? createBlockId(start, end, label, new Set(system.routineTemplate.map((block) => block.id))),
      startTime: start,
      endTime: end,
      label,
      type: normalizeTag(form.type) || "free"
    }

    const templateWithoutCurrent = system.routineTemplate.filter((block) => block.id !== form.id)
    const shouldAddTag = !routineTags.includes(nextBlock.type)
    setSystem({
      ...system,
      routineTags: shouldAddTag ? [...routineTags, nextBlock.type] : routineTags,
      routineTemplate: [...templateWithoutCurrent, nextBlock].sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime)),
      dailyStructure: {
        dayKey: todayKey,
        completedBlockIds: completedBlockIds.filter((id) => id !== nextBlock.id || templateWithoutCurrent.some((block) => block.id === id))
      }
    })
    resetForm()
  }

  function startEditing(block) {
    setForm({
      id: block.id,
      startTime: block.startTime,
      endTime: block.endTime,
      label: block.label,
      type: block.type
    })
    setError("")
  }

  function deleteBlock(blockId) {
    saveTemplate(system.routineTemplate.filter((block) => block.id !== blockId))
    if (form.id === blockId) {
      resetForm()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mb-4 w-full border border-red-200/60 bg-gradient-to-br from-red-950 via-neutral-950 to-slate-950 px-4 py-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
      >
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-200">
          Daily Structure
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-white">
              {activeBlock ? activeBlock.label : "Off-Structure Window"}
            </div>

            <div className="mt-1 text-sm text-red-100/85">
              {activeBlock
                ? `${formatTime(activeBlock.startTime)} - ${formatTime(activeBlock.endTime)} - You should be doing this right now, get to it.`
                : "No active block right now. Open to view your full flow."}
            </div>
          </div>

          <div className="text-sm text-red-100 underline underline-offset-4">
            Open
          </div>
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-red-200/20 bg-neutral-950 px-5 py-5 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-200">
                  Daily Structure
                </div>

                <div className="text-sm text-neutral-300">
                  {activeBlock
                    ? `Active now: ${activeBlock.label} (${formatTime(activeBlock.startTime)} - ${formatTime(activeBlock.endTime)})`
                    : "No active block right now"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="border border-white/15 px-3 py-1 text-sm text-neutral-200"
              >
                Close
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="border border-red-300/20 bg-red-400/10 px-2 py-1 text-red-100">
                Completion: {completedCount}/{blockCount}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsEditing((current) => !current)
                  resetForm()
                  setNewTag("")
                }}
                className="border border-white/20 bg-white/10 px-2 py-1 text-neutral-100 hover:bg-white/15"
              >
                {isEditing ? "View Flow" : "Edit Blocks"}
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-3">
                {system.routineTemplate.map((block) => {
                  const isActive = block.id === activeBlockId
                  const isCompleted = completedSet.has(block.id)

                  return (
                    <div
                      key={block.id}
                      className={`border px-4 py-3 ${
                        isActive
                          ? "border-red-300/30 bg-red-400/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-neutral-200">
                          {formatTime(block.startTime)} - {formatTime(block.endTime)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`border px-2 py-0.5 text-xs uppercase tracking-[0.12em] ${getTypeStyle(block.type)}`}>
                            {formatType(block.type)}
                          </span>
                          {isActive && (
                            <span className="border border-red-300/30 bg-red-500/20 px-2 py-0.5 text-xs text-red-100">
                              Active Now
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-1 text-base text-white">
                        {block.label}
                      </div>

                      <label className="mt-2 inline-flex items-center gap-2 text-sm text-neutral-200">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => toggleBlockCompletion(block.id)}
                          className="h-4 w-4 accent-red-400"
                        />
                        {isCompleted ? "Completed" : "Mark Completed"}
                      </label>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div>
                <div className="mb-3 space-y-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-red-300/30 bg-red-500/20 px-3 py-1 text-sm text-red-100 hover:bg-red-500/25"
                  >
                    Add New Block
                  </button>

                  {system.routineTemplate.map((block) => (
                    <div key={block.id} className="flex flex-wrap items-center justify-between gap-2 border border-white/10 bg-white/5 px-3 py-2">
                      <div className="text-sm text-neutral-100">
                        {formatTime(block.startTime)} - {formatTime(block.endTime)} {block.label}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`border px-2 py-0.5 text-xs uppercase tracking-[0.12em] ${getTypeStyle(block.type)}`}>
                          {formatType(block.type)}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditing(block)}
                          className="border border-white/20 px-2 py-1 text-xs text-neutral-100 hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(block.id)}
                          className="border border-red-200/30 px-2 py-1 text-xs text-red-100 hover:bg-red-500/15"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 text-sm font-semibold text-neutral-100">
                    {form.id ? "Edit Block" : "Add Block"}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                      className="border border-white/20 bg-neutral-900 px-2 py-1 text-sm text-white"
                    />
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                      className="border border-white/20 bg-neutral-900 px-2 py-1 text-sm text-white"
                    />
                    <input
                      value={form.label}
                      onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                      placeholder="Label"
                      className="border border-white/20 bg-neutral-900 px-2 py-1 text-sm text-white sm:col-span-2"
                    />
                    <select
                      value={form.type}
                      onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                      className="border border-white/20 bg-neutral-900 px-2 py-1 text-sm text-white"
                    >
                      {routineTags.map((type) => (
                        <option key={type} value={type}>
                          {formatType(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <input
                      value={newTag}
                      onChange={(event) => setNewTag(event.target.value)}
                      placeholder="New tag (e.g. admin)"
                      className="flex-1 border border-white/20 bg-neutral-900 px-2 py-1 text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="border border-white/20 px-3 py-1 text-sm text-neutral-100 hover:bg-white/10"
                    >
                      Add Tag
                    </button>
                  </div>

                  {error && (
                    <div className="mt-2 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={saveBlock}
                      className="border border-red-300/30 bg-red-500/20 px-3 py-1 text-sm text-red-100 hover:bg-red-500/25"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="border border-white/20 px-3 py-1 text-sm text-neutral-100 hover:bg-white/10"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
