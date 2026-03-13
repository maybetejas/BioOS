"use client"

import { createContext, useContext, useEffect, useSyncExternalStore } from "react"
import {
  getSystemSnapshot,
  refreshStoredSystem,
  subscribeSystem,
  updateStoredSystem
} from "@/lib/storage"

const TeeshaContext = createContext()

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

  return (
    <TeeshaContext.Provider value={{ system, setSystem: updateStoredSystem }}>
      {children}
    </TeeshaContext.Provider>
  )
}

export function useTeesha() {
  return useContext(TeeshaContext)
}
