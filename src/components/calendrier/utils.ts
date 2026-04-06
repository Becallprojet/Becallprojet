/**
 * Returns ISO date bounds for a given period (month or week).
 */
export function getPeriode(
  vue: 'mois' | 'semaine',
  date: Date
): { from: string; to: string } {
  if (vue === 'mois') {
    const from = new Date(date.getFullYear(), date.getMonth(), 1)
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    return { from: from.toISOString(), to: to.toISOString() }
  } else {
    // week: Monday to Sunday
    const dayOfWeek = date.getDay() // 0=Sun, 1=Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(date)
    monday.setDate(date.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return { from: monday.toISOString(), to: sunday.toISOString() }
  }
}

/**
 * Returns "14:30" from a Date or ISO string.
 */
export function formatHeure(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Returns "2026-04-06T14:30" for a datetime-local input (local time, not UTC).
 */
export function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Returns all days of the month plus padding days from prev/next month to fill a 7x6 grid.
 * Week starts on Monday.
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Day of week for first day (convert so Mon=0, Sun=6)
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  // Day of week for last day
  const endDow = lastDay.getDay() === 0 ? 6 : lastDay.getDay() - 1

  const days: Date[] = []

  // Padding from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push(d)
  }

  // Days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  // Padding from next month to fill to 42 cells (6 rows × 7 cols)
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d))
  }

  return days
}

/**
 * Returns the 7 days of the week (Mon-Sun) containing the given date.
 */
export function getDaysInWeek(date: Date): Date[] {
  const dow = date.getDay() === 0 ? 6 : date.getDay() - 1 // Mon=0, Sun=6
  const monday = new Date(date)
  monday.setDate(date.getDate() - dow)
  monday.setHours(0, 0, 0, 0)

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}
