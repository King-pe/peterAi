'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Phone, Loader2, CheckCircle, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LinkPhonePage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) {
      toast.error('Tafadhali ingiza nambari ya simu')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/portal/link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
      })

      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success('Nambari ya uthibitisho imetumwa!')
        setStep('verify')
      }
    } catch {
      toast.error('Imeshindikana kutuma nambari')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      toast.error('Tafadhali ingiza nambari ya uthibitisho')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/portal/link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phone.replace(/\D/g, ''), 
          otp 
        }),
      })

      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success('Nambari imeunganishwa vizuri!')
        router.push('/portal')
        router.refresh()
      }
    } catch {
      toast.error('Imeshindikana kuthibitisha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Unganisha Nambari ya Simu</h1>
        <p className="text-muted-foreground">
          Unganisha nambari yako ya WhatsApp na akaunti hii ili kuona mazungumzo na salio lako
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 'phone' ? (
              <>
                <Phone className="size-5" />
                Ingiza Nambari
              </>
            ) : (
              <>
                <CheckCircle className="size-5" />
                Thibitisha
              </>
            )}
          </CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Ingiza nambari ya WhatsApp unayotumia na bot'
              : 'Ingiza nambari ya uthibitisho iliyotumwa kwenye WhatsApp yako'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Nambari ya Simu</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="255712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Tumia format: 255712345678 (na country code)
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !phone}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Inatuma...
                  </>
                ) : (
                  <>
                    <LinkIcon className="size-4" />
                    Tuma Nambari ya Uthibitisho
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Nambari ya Uthibitisho</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Angalia WhatsApp yako kwa nambari ya uthibitisho
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setStep('phone')}
                  disabled={loading}
                >
                  Rudi Nyuma
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !otp}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Inathibitisha...
                    </>
                  ) : (
                    'Thibitisha'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
