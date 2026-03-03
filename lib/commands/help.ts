// ============================================
// /help - Show all available commands
// ============================================

import type { BotSettings, User } from "../types"

export function getHelpMessage(settings: BotSettings, user: User): string {
  const { currency, creditPrice, creditsPerPack, subscriptionPrice } = settings

  return `*${settings.botName} - Commands*

*AI & Chat:*
/ai <swali> - Uliza AI swali lolote
/image <maelezo> - Tengeneza picha kwa AI

*Media:*
/download - Jibu message yenye video/audio ili kupakua

*Status:*
/status like - Penda status
/status comment <maandishi> - Andika comment kwenye status

*Malipo & Akaunti:*
/pay <kiasi> - Lipa kupitia M-Pesa/TigoPesa
/balance - Angalia salio lako
/join - Jiunge na group ya premium

*Msaada:*
/help - Ona orodha hii

---
*Bei:*
Credit Pack: ${currency} ${creditPrice.toLocaleString()} = ${creditsPerPack} credits
Subscription: ${currency} ${subscriptionPrice.toLocaleString()}/mwezi (unlimited)

*Salio lako:* ${user.credits} credits
*Subscription:* ${user.subscription.active ? "Active" : "Inactive"}

_Tuma ujumbe wowote bila / ili kuzungumza na AI moja kwa moja!_`
}
