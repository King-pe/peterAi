// ============================================
// /balance - Check user balance and subscription
// ============================================

import { isSubscriptionActive, getSettings } from "../storage"
import type { User } from "../types"

export async function handleBalanceCommand(
  user: User
): Promise<{ response: string }> {
  const settings = await getSettings()
  const subActive = isSubscriptionActive(user)

  let subStatus = "Huna subscription"
  if (subActive && user.subscription.expiresAt) {
    const expiry = new Date(user.subscription.expiresAt)
    const daysLeft = Math.ceil(
      (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    subStatus = `Active (siku ${daysLeft} zimebaki)\nInaisha: ${expiry.toLocaleDateString("sw-TZ")}`
  }

  return {
    response: `*Salio Lako - ${settings.botName}*\n\n*Credits:* ${user.credits}\n*Subscription:* ${subStatus}\n*Jumla ya ujumbe:* ${user.totalMessages}\n*Jumla ya matumizi:* ${settings.currency} ${user.totalSpent.toLocaleString()}\n\n*Kununua zaidi:*\n/pay ${settings.creditPrice} - Credits ${settings.creditsPerPack}\n/pay ${settings.subscriptionPrice} - Subscription ya mwezi`,
  }
}
