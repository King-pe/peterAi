// ============================================
// /download - Download audio/video from replied message
// Powered by Peter Joram
// ============================================

import type { BaileysMessage } from "../types"

export async function handleDownloadCommand(
  message: BaileysMessage
): Promise<{
  response: string
  mediaUrl?: string
  mediaType?: "audio" | "video" | "document"
  filename?: string
}> {
  const context = message.quotedMessage

  if (!context) {
    return {
      response:
        "Tafadhali jibu (reply) message yenye video au audio na uandike /download\n\n_Bonyeza na ushikilie message yenye media, kisha chagua Reply, na andika /download_",
    }
  }

  // For Baileys, media download is handled differently
  // The media URL is already available in the message object
  if (message.video?.url || message.audio?.url || message.document?.url) {
    const mediaUrl = message.video?.url || message.audio?.url || message.document?.url
    const mediaType = message.video?.url ? "video" : message.audio?.url ? "audio" : "document"

    if (mediaUrl) {
      const ext = mediaType === "video" ? "mp4" : mediaType === "audio" ? "mp3" : "file"
      return {
        response: `Media imepatikana! Inatumwa kama document...`,
        mediaUrl,
        mediaType: "document",
        filename: `peterai_${mediaType}_${Date.now()}.${ext}`,
      }
    }
  }

  return {
    response:
      "Sijaweza kupata media kwenye message hiyo. Tafadhali hakikisha unajibu message yenye video au audio.\n\n_Bonyeza na ushikilie message yenye media, chagua Reply, kisha andika /download_",
  }
}
