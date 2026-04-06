export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function calculateAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function formatGender(gender: string | null | undefined): string {
  if (gender === "M") return "남"
  if (gender === "F") return "여"
  return ""
}

export function maskSsnBack(ssn: string | null | undefined): string {
  if (!ssn) return ""
  return ssn.charAt(0) + "******"
}
