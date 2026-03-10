import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple OTP storage (shared with request route - in production, use Redis)
const otpStore = new Map<string, { otp: string; expires: number }>()

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
    }

    // Verify OTP
    const storedOtp = otpStore.get(phone)

    if (!storedOtp) {
      return NextResponse.json({ 
        error: 'Nambari ya uthibitisho haipo. Tafadhali omba mpya.' 
      }, { status: 400 })
    }

    if (Date.now() > storedOtp.expires) {
      otpStore.delete(phone)
      return NextResponse.json({ 
        error: 'Nambari ya uthibitisho imeisha muda wake. Tafadhali omba mpya.' 
      }, { status: 400 })
    }

    if (storedOtp.otp !== otp) {
      return NextResponse.json({ 
        error: 'Nambari ya uthibitisho si sahihi' 
      }, { status: 400 })
    }

    // OTP verified - link the account
    const { error: updateError } = await supabase
      .from('bot_users')
      .update({ linked_profile_id: user.id })
      .eq('phone', phone)

    if (updateError) {
      console.error('Error linking account:', updateError)
      return NextResponse.json({ error: 'Failed to link account' }, { status: 500 })
    }

    // Update profile phone if not set
    await supabase
      .from('profiles')
      .update({ phone })
      .eq('id', user.id)
      .is('phone', null)

    // Clean up OTP
    otpStore.delete(phone)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}
