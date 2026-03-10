import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orderPay, detectProvider, calculateCredits } from '@/lib/peterpay'

export async function POST(request: Request) {
  try {
    const { amount, phone } = await request.json()

    if (!amount || amount < 500) {
      return NextResponse.json({ error: 'Kiasi cha chini ni TZS 500' }, { status: 400 })
    }

    if (!phone) {
      return NextResponse.json({ error: 'Nambari ya simu inahitajika' }, { status: 400 })
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Detect network provider
    const network = detectProvider(cleanPhone)

    // Get user info
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get bot user if exists
    let botUserId = null
    if (user) {
      const { data: botUser } = await supabase
        .from('bot_users')
        .select('id, name')
        .eq('linked_profile_id', user.id)
        .single()
      
      if (botUser) {
        botUserId = botUser.id
      }
    }

    // Create payment request via PeterPay
    const payResponse = await orderPay(
      amount,
      cleanPhone,
      user?.user_metadata?.full_name || 'PeterAi User',
      network
    )

    if (payResponse.status !== 'success' || !payResponse.data) {
      return NextResponse.json({ 
        error: payResponse.message || 'Imeshindikana kutuma ombi la malipo' 
      }, { status: 500 })
    }

    const credits = calculateCredits(amount)

    // Save payment record
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        order_id: payResponse.data.order_id,
        phone: cleanPhone,
        amount: amount,
        currency: 'TZS',
        status: 'PENDING',
        type: 'credits',
        credits_added: credits,
        bot_user_id: botUserId,
      })

    if (dbError) {
      console.error('Error saving payment:', dbError)
    }

    return NextResponse.json({
      success: true,
      orderId: payResponse.data.order_id,
      network: payResponse.data.network,
      amount: payResponse.data.gross_amount,
      credits,
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Kuna tatizo. Tafadhali jaribu tena.' }, { status: 500 })
  }
}
