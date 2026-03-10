import { NextResponse } from 'next/server'
import { disconnectWhatsApp } from '@/lib/whatsapp/connection'

export async function POST() {
  try {
    const success = await disconnectWhatsApp()
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: 'Failed to disconnect' })
    }
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error)
    return NextResponse.json({ success: false, error: 'Failed to disconnect' }, { status: 500 })
  }
}
