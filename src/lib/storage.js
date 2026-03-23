import { createDefaultSystem, getDayKey, normalizeSystem } from "@/lib/systemLogic"
import { calculateMomentum } from "@/lib/momentum"

const STORAGE_KEY = "teeshaOS.v2"
const LEGACY_STORAGE_KEYS = ["teeshaOS"]
const listeners = new Set()

let cachedSnapshot = null

function upsertMomentumSnapshot(history, snapshot) {
  const safeHistory = Array.isArray(history) ? history : []

  return [
    ...safeHistory.filter((entry) => entry.dateKey !== snapshot.dateKey),
    snapshot
  ].sort((left, right) => new Date(left.recordedAt) - new Date(right.recordedAt))
}

function clearLegacyStorage() {
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function readStoredSystem() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    const initial = createDefaultSystem()
    clearLegacyStorage()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }

  try {
    return normalizeSystem(JSON.parse(raw))
  } catch {
    const fallback = createDefaultSystem()
    clearLegacyStorage()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
    return fallback
  }
}

function writeStoredSystem(system) {
  const normalized = normalizeSystem(system)
  const now = new Date()
  const momentum = calculateMomentum(normalized)
  const snapshot = {
    dateKey: getDayKey(now),
    score: momentum,
    recordedAt: now.toISOString()
  }
  const withMomentumHistory = {
    ...normalized,
    momentumHistory: upsertMomentumSnapshot(normalized.momentumHistory, snapshot)
  }

  clearLegacyStorage()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withMomentumHistory))
  cachedSnapshot = withMomentumHistory

  return withMomentumHistory
}

export function loadSystem() {
  if (typeof window === "undefined") {
    return null
  }

  if (cachedSnapshot) {
    return cachedSnapshot
  }

  cachedSnapshot = readStoredSystem()
  return cachedSnapshot
}

export function saveSystem(system) {
  if (typeof window === "undefined") {
    return null
  }

  return writeStoredSystem(system)
}

export function refreshStoredSystem() {
  if (typeof window === "undefined") {
    return null
  }

  const previousSnapshot = cachedSnapshot
  const nextSnapshot = readStoredSystem()

  cachedSnapshot = nextSnapshot

  if (previousSnapshot !== nextSnapshot) {
    notifyListeners()
  }

  return nextSnapshot
}

export function subscribeSystem(listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getSystemSnapshot() {
  return loadSystem()
}

export function updateStoredSystem(updater) {
  if (typeof window === "undefined") {
    return null
  }

  const current = loadSystem()
  const next = typeof updater === "function" ? updater(current) : updater
  const normalized = writeStoredSystem(next)

  notifyListeners()

  return normalized
}
