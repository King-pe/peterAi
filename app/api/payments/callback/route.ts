import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client for webhook (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      order_id,
      status,
      reference,
      amount,
      phone,
    } = body

    if (!order_id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update payment status
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: status === 'SUCCESS' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'PENDING',
        reference: reference || null,
        completed_at: status === 'SUCCESS' ? new Date().toISOString() : null,
      })
      .eq('order_id', order_id)
      .select()
      .single()

    if (paymentError) {
      console.error('Payment update error:', paymentError)
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If payment successful, add credits to user
    if (status === 'SUCCESS' && payment) {
      const creditsToAdd = payment.credits_added || calculateCredits(Number(amount))

      // Update bot_user credits
      const { error: userError } = await supabase
        .from('bot_users')
        .update({
          credits: supabase.rpc('increment_credits', { 
            user_phone: phone, 
            credits_to_add: creditsToAdd 
          }),
        })
        .eq('phone', phone)

      if (userError) {
        // Try direct update
        const { data: botUser } = await supabase
          .from('bot_users')
          .select('credits')
          .eq('phone', phone)
          .single()

        if (botUser) {
          await supabase
            .from('bot_users')
            .update({ 
              credits: (botUser.credits || 0) + creditsToAdd,
              total_spent: supabase.sql`total_spent + ${Number(amount)}`
            })
            .eq('phone', phone)
        }
      }

      // Log the transaction
      await supabase.from('logs').insert({
        id: `payment-${order_id}-${Date.now()}`,
        phone,
        type: 'payment',
        command: 'payment_callback',
        message: `Payment completed: TZS ${amount}`,
        response: `Credits added: ${creditsToAdd}`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateCredits(amount: number): number {
  if (amount >= 6000) return 100
  if (amount >= 3500) return 50
  if (amount >= 2000) return 25
  if (amount >= 1000) return 10
  return Math.floor(amount / 100)
}
