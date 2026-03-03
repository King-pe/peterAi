import { NextResponse } from "next/server"
import { getConnectionStatus } from "@/lib/whapi"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const result = await getConnectionStatus()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
