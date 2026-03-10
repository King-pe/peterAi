import { NextResponse } from 'next/server'
import { getQRCode, initializeConnection } from '@/lib/whatsapp/connection'

export async function GET() {
  try {
    // Initialize connection if not already done
    await initializeConnection()
    
    const qr = await getQRCode()
    return NextResponse.json({ qr })
  } catch (error) {
    console.error('Error getting QR code:', error)
    return NextResponse.json({ qr: null, error: 'Failed to generate QR code' })
  }
}
