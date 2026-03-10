import { NextResponse } from 'next/server'
import { requestPairingCode, resetConnection } from '@/lib/whatsapp/connection'

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Nambari ya simu inahitajika' }, { status: 400 })
    }

    // Clean phone number - remove any non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Nambari ya simu si sahihi' }, { status: 400 })
    }

    // Request pairing code
    const pairingCode = await requestPairingCode(cleanPhone)
    
    if (pairingCode) {
      // Format pairing code with dash for readability (e.g., "1234-5678")
      const formattedCode = pairingCode.length === 8 
        ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}` 
        : pairingCode

      return NextResponse.json({ 
        pairingCode: formattedCode,
        message: 'Nambari ya kuunganisha imeundwa. Fungua WhatsApp > Settings > Linked Devices > Link a Device > Link with phone number' 
      })
    } else {
      return NextResponse.json({ 
        error: 'Imeshindikana kuunda nambari ya kuunganisha. Tafadhali jaribu kutumia QR code badala yake.' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] Error requesting pairing code:', error)
    return NextResponse.json({ 
      error: 'Kuna tatizo. Tafadhali jaribu tena baadaye.' 
    }, { status: 500 })
  }
}
