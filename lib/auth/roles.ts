import type { UserRole } from "@/lib/types"

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  citoyen: "/citoyen",
  operateur: "/operateur",
  admin: "/admin",
}

export function isRoleAllowed(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role)
}

export function normalizeRoleLabel(role: string): UserRole | null {
  if (role === "citoyen" || role === "operateur" || role === "admin") {
    return role
  }

  return null
}
