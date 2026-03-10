import { NextResponse } from 'next/server'
import { getConnectionStatus } from '@/lib/whatsapp/connection'

export async function GET() {
  try {
    const status = await getConnectionStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting WhatsApp status:', error)
    return NextResponse.json({ connected: false, error: 'Failed to get status' })
  }
}
