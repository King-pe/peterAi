import { NextRequest, NextResponse } from 'next/server'
import { getQRCode, refreshQRCode, initializeConnection, getConnectionStatus } from '@/lib/whatsapp/connection'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    const refresh = searchParams.get('refresh')

    // Check if already connected
    const status = await getConnectionStatus()
    if (status.connected) {
      if (format === 'image') {
        return new NextResponse('Already connected', { status: 200 })
      }
      return NextResponse.json({ 
        qr: null, 
        connected: true,
        phoneNumber: status.phoneNumber,
        message: 'Tayari umeunganishwa' 
      })
    }

    // Get or refresh QR code
    let qr: string | null
    if (refresh === 'true') {
      qr = await refreshQRCode()
    } else {
      await initializeConnection(false)
      qr = await getQRCode()
    }
    
    if (qr) {
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
        message: 'QR code inaandaliwa... Bonyeza "Onyesha Upya" kupata QR mpya.' 
      })
    }
  } catch (error) {
    console.error('Error getting QR code:', error)
    return NextResponse.json({ 
      qr: null, 
      error: 'Imeshindikana kuunda QR code. Jaribu tena.' 
    }, { status: 500 })
  }
}
