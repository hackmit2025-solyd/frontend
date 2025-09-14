"use client"

import { createContext, useContext, useMemo, useState } from "react"

export type CohortPatient = {
  id: string
  displayName: string
  pcp?: string
  policy?: string
  notes?: string
  dob?: string
  sex?: string
  contactPhone?: string
  contactEmail?: string
  properties?: Record<string, any>
}

type CohortContextValue = {
  patients: CohortPatient[]
  addPatient: (patient: CohortPatient) => void
  removePatient: (id: string) => void
  clear: () => void
}

const CohortContext = createContext<CohortContextValue | undefined>(undefined)

export function CohortProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<CohortPatient[]>([])

  const addPatient = (patient: CohortPatient) => {
    setPatients((prev) => {
      // De-duplicate by id
      if (prev.some((p) => p.id === patient.id)) return prev
      return [...prev, patient]
    })
  }

  const removePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id))
  }

  const clear = () => setPatients([])

  const value = useMemo(() => ({ patients, addPatient, removePatient, clear }), [patients])

  return <CohortContext.Provider value={value}>{children}</CohortContext.Provider>
}

export function useCohort() {
  const ctx = useContext(CohortContext)
  if (!ctx) throw new Error("useCohort must be used within a CohortProvider")
  return ctx
}
