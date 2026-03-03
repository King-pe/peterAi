import { NextResponse } from "next/server"
import type { PeterPayWebhookPayload } from "@/lib/types"
import { getPayment, updatePayment, getUser, saveUser } from "@/lib/storage"
import { saveLog, createLogEntry, getSettings } from "@/lib/storage"
import { sendText, formatChatId } from "@/lib/whapi"
import { verifyWebhookSignature } from "@/lib/peterpay"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-peterpay-signature") || ""

    // Verify signature if secret is configured
    if (process.env.PETERPAY_API_SECRET && signature) {
      if (!verifyWebhookSignature(rawBody, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload: PeterPayWebhookPayload = JSON.parse(rawBody)

    // Find matching payment
    const payment = await getPayment(payload.order_id)
    if (!payment) {
      console.error("Payment not found for order:", payload.order_id)
      return NextResponse.json({ status: "ok" })
    }

    // Update payment status
    const isCompleted = payload.status === "COMPLETED" || payload.status === "completed"
    await updatePayment(payload.order_id, {
      status: isCompleted ? "COMPLETED" : "FAILED",
      reference: payload.reference,
      completedAt: payload.paid_at || new Date().toISOString(),
    })

    if (isCompleted) {
      // Credit user
      const user = await getUser(payment.phone)
      if (user) {
        if (payment.type === "credits") {
          user.credits += payment.creditsAdded
          user.totalSpent += payment.amount
        } else if (payment.type === "subscription") {
          const settings = await getSettings()
          user.subscription = {
            active: true,
            plan: "monthly",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
          user.totalSpent += payment.amount
        }
        await saveUser(user)

        // Notify user on WhatsApp
        const chatId = formatChatId(payment.phone)
        const message =
          payment.type === "credits"
            ? `Malipo yamekamilika! Credits ${payment.creditsAdded} zimeongezwa kwenye akaunti yako.\nSalio: ${user.credits} credits`
            : `Malipo yamekamilika! Subscription yako imeactivishwa kwa siku 30.\nEnjoy unlimited access!`
        await sendText(chatId, message)

        await saveLog(
          createLogEntry(
            payment.phone,
            user.name,
            "payment",
            `Payment ${payload.order_id} completed`,
            message,
            "payment"
          )
        )
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch (err) {
    console.error("PeterPay webhook error:", err)
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}
