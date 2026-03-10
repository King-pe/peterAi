import { NextRequest, NextResponse } from 'next/server'
import { getQRCode, initializeConnection, getConnectionStatus } from '@/lib/whatsapp/connection'

export async function GET(request: NextRequest) {
  try {
    // Check if image format requested
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    // Check if already connected
    const status = await getConnectionStatus()
    if (status.connected) {
      if (format === 'image') {
        return new NextResponse('Already connected', { status: 200 })
      }
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
      // If image format requested, return actual image
      if (format === 'image') {
        const base64Data = qr.replace(/^data:image\/png;base64,/, '')
        const imageBuffer = Buffer.from(base64Data, 'base64')
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
      }
      
      return NextResponse.json({ 
        qr, 
        connected: false,
        message: 'Scan QR code hii na WhatsApp yako' 
      })
    } else {
      if (format === 'image') {
        return new NextResponse('QR code not ready', { status: 202 })
      }
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
