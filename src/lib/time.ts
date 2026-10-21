function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

// 65000 -> "1:05", 3725000 -> "1:02:05"
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${twoDigits(minutes)}:${twoDigits(seconds)}`
  }
  return `${minutes}:${twoDigits(seconds)}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}
