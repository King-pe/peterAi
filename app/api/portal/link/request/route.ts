import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMessage } from '@/lib/whatsapp/connection'

// Simple OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number }>()

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Check if this phone exists in bot_users
    const { data: botUser } = await supabase
      .from('bot_users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (!botUser) {
      return NextResponse.json({ 
        error: 'Nambari hii haijasajiliwa na bot. Tafadhali tumia bot kwanza kupitia WhatsApp.' 
      }, { status: 404 })
    }

    if (botUser.linked_profile_id) {
      return NextResponse.json({ 
        error: 'Nambari hii tayari imeunganishwa na akaunti nyingine' 
      }, { status: 400 })
    }

    // Generate and store OTP
    const otp = generateOTP()
    otpStore.set(phone, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    })

    // Send OTP via WhatsApp
    const message = `🔐 *PeterAi - Nambari ya Uthibitisho*\n\nNambari yako ya uthibitisho ni:\n\n*${otp}*\n\nNambari hii itaisha baada ya dakika 10.\n\nUsishiriki nambari hii na mtu yeyote.`
    
    const sent = await sendMessage(phone, message)

    if (!sent) {
      return NextResponse.json({ 
        error: 'Imeshindikana kutuma nambari. Hakikisha bot imeunganishwa na WhatsApp.' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error requesting OTP:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}

// Export for verification route
export { otpStore }
