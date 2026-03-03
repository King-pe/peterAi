// ============================================
// /download - Download audio/video from replied message
// ============================================

import { getMediaUrl } from "../whapi"
import type { WhapiMessage } from "../types"

export async function handleDownloadCommand(
  message: WhapiMessage
): Promise<{
  response: string
  mediaUrl?: string
  mediaType?: "audio" | "video" | "document"
  filename?: string
}> {
  // Check if this is a reply to a media message
  const context = message.context

  if (!context) {
    return {
      response:
        "Tafadhali jibu (reply) message yenye video au audio na uandike /download\n\n_Bonyeza na ushikilie message yenye media, kisha chagua Reply, na andika /download_",
    }
  }

  // Try to get media from the message being replied to
  // We need to check if the replied message has media
  if (message.video?.id || message.audio?.id || message.document?.id) {
    const mediaId =
      message.video?.id || message.audio?.id || message.document?.id
    const mediaType = message.video?.id
      ? "video"
      : message.audio?.id
        ? "audio"
        : "document"

    if (mediaId) {
      try {
        const url = await getMediaUrl(mediaId)
        if (url) {
          const ext = mediaType === "video" ? "mp4" : mediaType === "audio" ? "mp3" : "file"
          return {
            response: `Media imepatikana! Inatumwa kama document...`,
            mediaUrl: url,
            mediaType: "document",
            filename: `peterai_${mediaType}_${Date.now()}.${ext}`,
          }
        }
      } catch (error) {
        console.error("Download error:", error)
      }
    }
  }

  // If we can't find media in the context, provide instructions
  return {
    response:
      "Sijaweza kupata media kwenye message hiyo. Tafadhali hakikisha unajibu message yenye video au audio.\n\n_Bonyeza na ushikilie message yenye media, chagua Reply, kisha andika /download_",
  }
}
