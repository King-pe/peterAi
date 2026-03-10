'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CreditCard, Loader2, CheckCircle, Smartphone, Coins } from 'lucide-react'

const creditPackages = [
  { credits: 10, amount: 1000, popular: false },
  { credits: 25, amount: 2000, popular: false },
  { credits: 50, amount: 3500, popular: true },
  { credits: 100, amount: 6000, popular: false },
]

export default function BuyCreditsPage() {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle')
  const [orderId, setOrderId] = useState<string | null>(null)

  const handleBuy = async () => {
    const amount = selectedPackage !== null 
      ? creditPackages[selectedPackage].amount 
      : Number(customAmount)

    if (!amount || amount < 500) {
      toast.error('Kiasi cha chini ni TZS 500')
      return
    }

    if (!phone || phone.length < 9) {
      toast.error('Tafadhali ingiza nambari ya simu sahihi')
      return
    }

    setLoading(true)
    setPaymentStatus('pending')

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phone }),
      })

      const data = await res.json()

      if (data.success && data.orderId) {
        setOrderId(data.orderId)
        toast.success('Ombi la malipo limetumwa! Angalia simu yako.')
        
        // Start polling for payment status
        pollPaymentStatus(data.orderId)
      } else {
        toast.error(data.error || 'Imeshindikana kutuma ombi la malipo')
        setPaymentStatus('failed')
      }
    } catch {
      toast.error('Kuna tatizo. Tafadhali jaribu tena.')
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const pollPaymentStatus = async (orderId: string) => {
    let attempts = 0
    const maxAttempts = 60 // 5 minutes (5s interval)

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/payments/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })

        const data = await res.json()

        if (data.status === 'COMPLETED') {
          setPaymentStatus('success')
          toast.success('Malipo yamekamilika! Credit zimeongezwa.')
          return
        } else if (data.status === 'FAILED') {
          setPaymentStatus('failed')
          toast.error('Malipo yameshindikana.')
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000)
        } else {
          setPaymentStatus('idle')
          toast.info('Muda wa kusubiri umepita. Angalia historia ya malipo.')
        }
      } catch {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000)
        }
      }
    }

    checkStatus()
  }

  const calculateCredits = (amount: number) => {
    if (amount >= 6000) return 100
    if (amount >= 3500) return 50
    if (amount >= 2000) return 25
    if (amount >= 1000) return 10
    return Math.floor(amount / 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nunua Credit</h1>
        <p className="text-muted-foreground">Chagua kifurushi au ingiza kiasi chako</p>
      </div>

      {/* Credit Packages */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {creditPackages.map((pkg, index) => (
          <Card 
            key={index}
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedPackage === index ? 'border-primary ring-2 ring-primary/20' : ''
            } ${pkg.popular ? 'border-primary/50' : ''}`}
            onClick={() => {
              setSelectedPackage(index)
              setCustomAmount('')
            }}
          >
            <CardHeader className="pb-2">
              {pkg.popular && (
                <Badge className="w-fit mb-2">Inashauriwa</Badge>
              )}
              <CardTitle className="flex items-center gap-2">
                <Coins className="size-5 text-primary" />
                Credit {pkg.credits}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                TZS {pkg.amount.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                TZS {(pkg.amount / pkg.credits).toFixed(0)} kwa credit
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Amount */}
      <Card>
        <CardHeader>
          <CardTitle>Au Ingiza Kiasi Chako</CardTitle>
          <CardDescription>Kiasi cha chini ni TZS 500</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Kiasi (TZS)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Mfano: 5000"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedPackage(null)
              }}
              min={500}
            />
            {customAmount && Number(customAmount) >= 500 && (
              <p className="text-sm text-muted-foreground">
                Utapata credit {calculateCredits(Number(customAmount))}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="size-5" />
            Lipa kwa Simu
          </CardTitle>
          <CardDescription>
            Malipo yatatumwa moja kwa moja kwenye simu yako (M-Pesa, Tigo Pesa, Airtel Money)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Nambari ya Simu</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="255712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ingiza nambari na country code (255)
            </p>
          </div>

          {paymentStatus === 'pending' && (
            <div className="rounded-lg bg-muted p-4 text-center">
              <Loader2 className="size-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="font-medium">Inasubiri malipo...</p>
              <p className="text-sm text-muted-foreground">
                Angalia simu yako na ingiza PIN yako
              </p>
              {orderId && (
                <p className="text-xs text-muted-foreground mt-2">
                  Order: {orderId}
                </p>
              )}
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <CheckCircle className="size-8 mx-auto mb-2 text-primary" />
              <p className="font-medium text-primary">Malipo Yamekamilika!</p>
              <p className="text-sm text-muted-foreground">
                Credit zimeongezwa kwenye akaunti yako
              </p>
            </div>
          )}

          {paymentStatus !== 'pending' && paymentStatus !== 'success' && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleBuy}
              disabled={loading || (!selectedPackage && !customAmount) || !phone}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Inatuma ombi...
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  Lipa TZS {(selectedPackage !== null 
                    ? creditPackages[selectedPackage].amount 
                    : Number(customAmount) || 0
                  ).toLocaleString()}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
