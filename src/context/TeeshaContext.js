"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { loadSystem, saveSystem } from "@/lib/storage"
import { ensureSeedData } from "@/lib/ensureSeedData"

const TeeshaContext = createContext()

export function TeeshaProvider({ children }) {

  const [system, setSystem] = useState(null)

  useEffect(() => {

    let data = loadSystem()

    // seed BEFORE state is set
    const raw = localStorage.getItem("teeshaOS")

    if (raw) {
      ensureSeedData()
      data = JSON.parse(localStorage.getItem("teeshaOS"))
    }

    setSystem(data)

  }, [])

  useEffect(() => {
    if (system) {
      saveSystem(system)
    }
  }, [system])

  return (
    <TeeshaContext.Provider value={{ system, setSystem }}>
      {children}
    </TeeshaContext.Provider>
  )
}

export function useTeesha() {
  return useContext(TeeshaContext)
}