import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkOrderStatus } from '@/lib/peterpay'

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID inahitajika' }, { status: 400 })
    }

    // Check status from PeterPay
    const statusResponse = await checkOrderStatus(orderId)

    if (statusResponse.status !== 'success' || !statusResponse.data) {
      return NextResponse.json({ 
        status: 'PENDING',
        message: 'Inasubiri malipo'
      })
    }

    const paymentStatus = statusResponse.data.payment_status

    // Update payment record in database
    const supabase = await createClient()
    
    if (paymentStatus === 'COMPLETED') {
      // Get payment record
      const { data: payment } = await supabase
        .from('payments')
        .select('*, bot_user_id')
        .eq('order_id', orderId)
        .single()

      if (payment) {
        // Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'COMPLETED',
            reference: statusResponse.data.reference,
            completed_at: new Date().toISOString(),
          })
          .eq('order_id', orderId)

        // Add credits to bot user
        if (payment.bot_user_id && payment.credits_added) {
          const { data: botUser } = await supabase
            .from('bot_users')
            .select('credits, total_spent')
            .eq('id', payment.bot_user_id)
            .single()

          if (botUser) {
            await supabase
              .from('bot_users')
              .update({
                credits: (botUser.credits || 0) + payment.credits_added,
                total_spent: (Number(botUser.total_spent) || 0) + Number(payment.amount),
              })
              .eq('id', payment.bot_user_id)
          }
        }
      }
    } else if (paymentStatus === 'FAILED') {
      await supabase
        .from('payments')
        .update({ status: 'FAILED' })
        .eq('order_id', orderId)
    }

    return NextResponse.json({
      status: paymentStatus,
      amount: statusResponse.data.amount,
      reference: statusResponse.data.reference,
    })

  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json({ error: 'Kuna tatizo' }, { status: 500 })
  }
}
