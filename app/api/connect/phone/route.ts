import { NextResponse } from "next/server"
import { loginWithPhone } from "@/lib/whapi"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const { phone } = await request.json()
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }
    const result = await loginWithPhone(phone)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
