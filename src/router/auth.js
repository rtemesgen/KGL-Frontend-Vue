export const canAccessRoute = (requiredAccess, allowedCardKeys) => {
  if (!requiredAccess) return true
  return Array.isArray(allowedCardKeys) && allowedCardKeys.includes(String(requiredAccess))
}
