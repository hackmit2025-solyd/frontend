"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type HipaaContextValue = {
  hipaaEnabled: boolean
  setHipaaEnabled: (value: boolean) => void
}

const HipaaContext = createContext<HipaaContextValue | undefined>(undefined)

export function HipaaProvider({ children }: { children: ReactNode }) {
  const [hipaaEnabled, setHipaaEnabled] = useState<boolean>(false)
  return (
    <HipaaContext.Provider value={{ hipaaEnabled, setHipaaEnabled }}>
      {children}
    </HipaaContext.Provider>
  )
}

export function useHipaa() {
  const ctx = useContext(HipaaContext)
  if (!ctx) throw new Error("useHipaa must be used within a HipaaProvider")
  return ctx
}

