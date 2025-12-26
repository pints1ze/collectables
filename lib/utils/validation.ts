export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}

export function validateYear(year: number | null | undefined): boolean {
  if (year === null || year === undefined) return true
  const currentYear = new Date().getFullYear()
  return year >= 1000 && year <= currentYear + 10
}

