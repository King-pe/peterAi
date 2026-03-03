// ============================================
// /pay <amount> - Initiate payment via PeterPay
// ============================================

import { createOrder, directPay, detectProvider } from "../peterpay"
import { getSettings, savePayment } from "../storage"
import type { User, Payment } from "../types"

export async function handlePayCommand(
  user: User,
  amountStr: string,
  webhookBaseUrl: string
): Promise<{ response: string; user: User }> {
  const settings = await getSettings()

  if (!amountStr.trim()) {
    return {
      response: `*Jinsi ya kulipa:*\n\n/pay ${settings.creditPrice} - Nunua credits ${settings.creditsPerPack}\n/pay ${settings.subscriptionPrice} - Subscription ya mwezi\n\n*Bei:*\n${settings.currency} ${settings.creditPrice.toLocaleString()} = ${settings.creditsPerPack} credits\n${settings.currency} ${settings.subscriptionPrice.toLocaleString()} = Subscription (unlimited/mwezi)`,
      user,
    }
  }

  const amount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10)
  if (isNaN(amount) || amount < 100) {
    return {
      response: "Kiasi si sahihi. Tafadhali ingiza kiasi sahihi (angalau 100 TZS).\n\nMfano: /pay 1000",
      user,
    }
  }

  // Determine payment type
  let paymentType: "credits" | "subscription" = "credits"
  let creditsToAdd = 0
  let description = ""

  if (amount >= settings.subscriptionPrice) {
    paymentType = "subscription"
    description = `${settings.botName} Monthly Subscription`
  } else {
    paymentType = "credits"
    creditsToAdd = Math.floor(
      (amount / settings.creditPrice) * settings.creditsPerPack
    )
    description = `${settings.botName} Credits x${creditsToAdd}`
  }

  try {
    const webhookUrl = `${webhookBaseUrl}/api/webhook/peterpay`

    const orderResult = await createOrder(
      amount,
      user.phone,
      user.name,
      description,
      webhookUrl
    )

    if (!orderResult.status) {
      return {
        response: "Samahani, kuna tatizo la kutengeneza order. Tafadhali jaribu tena.",
        user,
      }
    }

    // Save payment record
    const payment: Payment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      orderId: orderResult.order_id,
      phone: user.phone,
      amount,
      currency: settings.currency,
      status: "PENDING",
      type: paymentType,
      creditsAdded: creditsToAdd,
      createdAt: new Date().toISOString(),
      completedAt: null,
      reference: null,
    }
    await savePayment(payment)

    // Try direct pay (USSD push)
    const provider = detectProvider(user.phone)
    try {
      await directPay(orderResult.order_id, user.phone, provider)
    } catch {
      // USSD push may fail, user can still pay via link
    }

    const typeLabel =
      paymentType === "subscription"
        ? "Subscription ya mwezi"
        : `Credits ${creditsToAdd}`

    return {
      response: `*Ombi la malipo limetengenezwa!*\n\n*Aina:* ${typeLabel}\n*Kiasi:* ${settings.currency} ${amount.toLocaleString()}\n*Order ID:* ${orderResult.order_id}\n*Provider:* ${provider}\n\nUtapokea USSD push kwenye simu yako. Kama hujapokea, lipa kupitia link:\n${orderResult.payment_url}\n\n_Baada ya kulipa, utapokea ujumbe wa uthibitisho._`,
      user,
    }
  } catch (error) {
    console.error("Payment error:", error)
    return {
      response: "Samahani, kuna tatizo la malipo. Tafadhali jaribu tena baadaye.",
      user,
    }
  }
}
