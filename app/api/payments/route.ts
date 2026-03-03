import { NextResponse } from "next/server"
import { getPayments } from "@/lib/storage"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const payments = await getPayments()
    return NextResponse.json(payments)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
