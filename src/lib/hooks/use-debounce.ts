"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook that debounces any fast-changing value
 * @param value The state value to debounce
 * @param delay Delay in milliseconds (defaults to 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
