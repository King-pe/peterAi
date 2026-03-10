import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Create admin client for webhook (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify PeterPay webhook signature
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.PETERPAY_SECRET_KEY
  if (!secret) {
    // Skip verification if no secret configured
    return true
  }
  
  try {
    const calculated = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(calculated),
      Buffer.from(signature)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('X-PeterPay-Signature') || ''
    
    // Verify signature
    if (!verifySignature(rawBody, signature)) {
      console.error('[v0] Invalid webhook signature')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    const body = JSON.parse(rawBody)
    
    // PeterPay webhook format
    const {
      event,
      order_id,
      amount,
      currency,
      status,
      customer_phone,
      timestamp,
    } = body

    console.log('[v0] PeterPay Webhook received:', { event, order_id, status, amount })

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'Missing order_id' },
        { status: 400 }
      )
    }

    // Determine payment status from event or status field
    let paymentStatus = 'PENDING'
    if (event === 'payment.completed' || status === 'COMPLETED') {
      paymentStatus = 'COMPLETED'
    } else if (event === 'payment.failed' || status === 'FAILED') {
      paymentStatus = 'FAILED'
    }

    // Update payment status
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        completed_at: paymentStatus === 'COMPLETED' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', order_id)
      .select()
      .single()

    if (paymentError) {
      console.error('[v0] Payment update error:', paymentError)
      // Payment might not exist in our DB yet, that's okay
      return NextResponse.json({ success: true, message: 'Webhook received' })
    }

    // If payment successful, add credits to user
    if (paymentStatus === 'COMPLETED' && payment) {
      const phone = customer_phone || payment.phone
      const creditsToAdd = payment.credits_added || calculateCredits(Number(amount || payment.amount))

      console.log('[v0] Adding credits:', { phone, creditsToAdd })

      // Get current bot_user
      const { data: botUser, error: userFetchError } = await supabase
        .from('bot_users')
        .select('id, credits, total_spent')
        .eq('phone', phone)
        .single()

      if (botUser && !userFetchError) {
        // Update credits and total_spent
        const { error: updateError } = await supabase
          .from('bot_users')
          .update({ 
            credits: (botUser.credits || 0) + creditsToAdd,
            total_spent: Number(botUser.total_spent || 0) + Number(amount || payment.amount),
            last_active: new Date().toISOString(),
          })
          .eq('id', botUser.id)

        if (updateError) {
          console.error('[v0] Error updating user credits:', updateError)
        } else {
          console.log('[v0] Credits updated successfully for:', phone)
        }

        // Log the transaction
        await supabase.from('logs').insert({
          id: `payment-${order_id}-${Date.now()}`,
          phone,
          type: 'payment',
          command: 'payment_callback',
          message: `Payment completed: ${currency || 'TZS'} ${amount || payment.amount}`,
          response: `Credits added: ${creditsToAdd}`,
          bot_user_id: botUser.id,
        })
      } else {
        console.error('[v0] Bot user not found for phone:', phone)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Callback error:', error)
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
