import { useCallback, useEffect, useState } from 'react'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string }

// runs an async loader when deps change, with a reload for after saves
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    load()
      .then((data) => {
        if (active) {
          setState({ status: 'ready', data })
        }
      })
      .catch((err: unknown) => {
        let message = 'Something went wrong while loading.'
        if (err instanceof Error) {
          message = err.message
        }
        if (active) {
          setState({ status: 'error', message })
        }
      })
    return () => {
      active = false
    }
  }, [...deps, version])

  const reload = useCallback(() => {
    setVersion((value) => value + 1)
  }, [])

  return { state, reload }
}

// re-renders every interval so clocks stay current
export function useNow(intervalMs: number, active: boolean): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) {
      return
    }
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, intervalMs)
    return () => {
      window.clearInterval(timer)
    }
  }, [intervalMs, active])

  return now
}
