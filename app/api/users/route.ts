import { NextResponse } from "next/server"
import { getUsers, updateUser } from "@/lib/storage"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
    const { phone, ...updates } = await request.json()
    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 })
    }
    const user = await updateUser(phone, updates)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
