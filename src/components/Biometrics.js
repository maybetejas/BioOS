"use client"

import { useState } from "react"
import { useTeesha } from "@/context/TeeshaContext"

export default function Biometrics() {

  const { system, setSystem } = useTeesha()

  const [sleep, setSleep] = useState("")
  const [energy, setEnergy] = useState("")
  const [focus, setFocus] = useState("")

  if (!system) return null

  function submit() {

    const entry = {
      date: new Date().toISOString(),
      sleep,
      energy,
      focus
    }

    setSystem({
      ...system,
      biometrics: [...system.biometrics, entry]
    })

    setSleep("")
    setEnergy("")
    setFocus("")
  }

  return (
    <div>

      <h2 className="text-xl font-bold mb-3">
        Biological State
      </h2>

      <input
        placeholder="Sleep Hours"
        value={sleep}
        onChange={(e) => setSleep(e.target.value)}
        className="border px-2 mr-2"
      />

      <input
        placeholder="Energy 1-10"
        value={energy}
        onChange={(e) => setEnergy(e.target.value)}
        className="border px-2 mr-2"
      />

      <input
        placeholder="Focus 1-10"
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        className="border px-2 mr-2"
      />

      <button onClick={submit} className="border px-3">
        Save
      </button>

    </div>
  )
}