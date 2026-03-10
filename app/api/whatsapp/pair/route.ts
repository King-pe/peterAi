import { NextResponse } from 'next/server'
import { requestPairingCode, initializeConnection } from '@/lib/whatsapp/connection'

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Clean phone number - remove any non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    // Initialize connection if not already done
    await initializeConnection()

    const pairingCode = await requestPairingCode(cleanPhone)
    
    if (pairingCode) {
      return NextResponse.json({ pairingCode })
    } else {
      return NextResponse.json({ error: 'Failed to generate pairing code' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error requesting pairing code:', error)
    return NextResponse.json({ error: 'Failed to request pairing code' }, { status: 500 })
  }
}
