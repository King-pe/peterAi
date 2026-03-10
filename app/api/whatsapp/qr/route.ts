import { NextResponse } from 'next/server'
import { getQRCode, initializeConnection, getConnectionStatus } from '@/lib/whatsapp/connection'

export async function GET() {
  try {
    // Check if already connected
    const status = await getConnectionStatus()
    if (status.connected) {
      return NextResponse.json({ 
        qr: null, 
        connected: true,
        message: 'Tayari umeunganishwa' 
      })
    }

    // Initialize connection if not already done
    await initializeConnection(false)
    
    // Get QR code
    const qr = await getQRCode()
    
    if (qr) {
      return NextResponse.json({ 
        qr, 
        connected: false,
        message: 'Scan QR code hii na WhatsApp yako' 
      })
    } else {
      return NextResponse.json({ 
        qr: null, 
        connected: false,
        message: 'QR code inaandaliwa... Subiri sekunde chache.' 
      })
    }
  } catch (error) {
    console.error('[v0] Error getting QR code:', error)
    return NextResponse.json({ 
      qr: null, 
      error: 'Imeshindikana kuunda QR code' 
    })
  }
}
