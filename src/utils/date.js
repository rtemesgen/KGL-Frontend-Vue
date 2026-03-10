export const inDateRange = (date, from, to) => {
  if (!date) return false
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

export const todayIso = () => new Date().toISOString().slice(0, 10)

export const startOfMonthIso = (value = new Date()) => {
  const date = new Date(value)
  date.setDate(1)
  return date.toISOString().slice(0, 10)
}

export const startOfWeekIso = (value = new Date()) => {
  const date = new Date(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().slice(0, 10)
}
