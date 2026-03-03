// ============================================
// PeterAi - Admin Authentication
// ============================================

import { cookies } from "next/headers"
import crypto from "crypto"

const SESSION_COOKIE = "peterai_admin_session"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123"
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (password !== getAdminPassword()) return false

  const token = generateSessionToken()
  const expires = new Date(Date.now() + SESSION_DURATION)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  })

  return true
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return !!session?.value
}

export async function requireAdmin(): Promise<boolean> {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    throw new Error("Unauthorized")
  }
  return true
}
