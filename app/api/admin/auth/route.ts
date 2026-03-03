import { NextResponse } from "next/server"
import { loginAdmin, logoutAdmin } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 })
    }
    const success = await loginAdmin(password)
    if (!success) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await logoutAdmin()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
