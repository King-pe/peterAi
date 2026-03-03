// ============================================
// /join - Join premium WhatsApp group
// Powered by Peter Joram
// ============================================

import { getGroupInviteLink, addParticipant } from "../baileys"
import { getSettings, isSubscriptionActive, canUseBot } from "../storage"
import type { User } from "../types"

export async function handleJoinCommand(
  user: User
): Promise<{ response: string }> {
  const settings = await getSettings()

  if (!settings.premiumGroupId) {
    return {
      response: "Premium group bado haijaundwa. Tafadhali wasiliana na admin.",
    }
  }

  if (!isSubscriptionActive(user) && !canUseBot(user, 10)) {
    return {
      response: `Unahitaji subscription au angalau credits 10 ili kujiunga na premium group.\n\nSalio lako: ${user.credits} credits\n\nTumia /pay ${settings.subscriptionPrice} kwa subscription ya mwezi.`,
    }
  }

  try {
    try {
      await addParticipant(settings.premiumGroupId, [user.phone])
      return {
        response: "Umefanikiwa kuongezwa kwenye premium group! Angalia groups zako.",
      }
    } catch {
      const link = await getGroupInviteLink(settings.premiumGroupId)
      if (link) {
        return {
          response: `*Karibu Premium Group!*\n\nBonyeza link hii kujiunga:\n${link}\n\n_Link hii ni ya siri, usishiriki na wengine._`,
        }
      }
      return {
        response: "Samahani, kuna tatizo la kupata link ya group. Tafadhali jaribu tena.",
      }
    }
  } catch (error) {
    console.error("Join command error:", error)
    return {
      response: "Samahani, kuna tatizo. Tafadhali jaribu tena baadaye.",
    }
  }
}
