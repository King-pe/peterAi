'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Phone, Loader2, CheckCircle, Link as LinkIcon, QrCode, RefreshCw, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LinkPhonePage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [loading, setLoading] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [linkMethod, setLinkMethod] = useState<'qr' | 'phone'>('qr')
  const router = useRouter()

  // Fetch QR code
  const fetchQrCode = useCallback(async () => {
    setQrLoading(true)
    try {
      const res = await fetch('/api/whatsapp/qr')
      const data = await res.json()
      
      if (data.connected) {
        setConnected(true)
        toast.success('WhatsApp tayari imeunganishwa!')
      } else if (data.qr) {
        setQrCode(data.qr)
      }
    } catch {
      toast.error('Imeshindikana kupata QR code')
    } finally {
      setQrLoading(false)
    }
  }, [])

  // Poll for connection status - faster polling for immediate feedback
  useEffect(() => {
    if (linkMethod === 'qr' && !connected) {
      fetchQrCode()
      
      // Poll every 2 seconds for faster connection detection
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/whatsapp/status')
          const data = await res.json()
          if (data.connected) {
            setConnected(true)
            setQrCode(null) // Clear QR code
            toast.success('WhatsApp imeunganishwa vizuri! Angalia inbox yako.')
            clearInterval(interval)
          }
        } catch {
          // Silent fail
        }
      }, 2000) // Poll every 2 seconds

      return () => clearInterval(interval)
    }
  }, [linkMethod, connected, fetchQrCode])

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

  if (connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Unganisha na WhatsApp</h1>
          <p className="text-muted-foreground">
            WhatsApp yako imeunganishwa vizuri
          </p>
        </div>

        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 p-4 mb-4 animate-pulse">
              <CheckCircle className="size-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Imeunganishwa!</h3>
            <p className="text-muted-foreground text-center mb-4">
              WhatsApp yako imeunganishwa na akaunti hii.
            </p>
            <p className="text-sm text-green-600 text-center mb-6 font-medium">
              Angalia WhatsApp yako - umepokea ujumbe wa kukaribisha kutoka PeterAi Bot!
            </p>
            <Button onClick={() => router.push('/portal')}>
              Rudi kwenye Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Unganisha na WhatsApp</h1>
        <p className="text-muted-foreground">
          Unganisha WhatsApp yako na akaunti hii ili kuona mazungumzo na salio lako
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="size-5" />
            Chagua Njia ya Kuunganisha
          </CardTitle>
          <CardDescription>
            Unaweza kutumia QR code au namba ya simu kuunganisha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={linkMethod} onValueChange={(v) => setLinkMethod(v as 'qr' | 'phone')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="gap-2">
                <QrCode className="size-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Smartphone className="size-4" />
                Namba ya Simu
              </TabsTrigger>
            </TabsList>

            {/* QR Code Method */}
            <TabsContent value="qr" className="mt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {qrLoading ? (
                    <div className="flex size-64 items-center justify-center rounded-lg border bg-muted">
                      <div className="text-center">
                        <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Inaandaa QR Code...</p>
                      </div>
                    </div>
                  ) : qrCode ? (
                    <div className="rounded-lg border-2 border-primary/20 bg-white p-4 shadow-lg">
                      <img
                        src={qrCode}
                        alt="WhatsApp QR Code"
                        className="size-56"
                      />
                    </div>
                  ) : (
                    <div className="flex size-64 flex-col items-center justify-center gap-2 rounded-lg border bg-muted p-4">
                      <QrCode className="size-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        QR Code inaandaliwa...
                      </p>
                      <p className="text-xs text-muted-foreground">Subiri sekunde 5-10</p>
                    </div>
                  )}
                </div>

                <Button variant="outline" onClick={fetchQrCode} disabled={qrLoading}>
                  <RefreshCw className={`size-4 ${qrLoading ? 'animate-spin' : ''}`} />
                  Onyesha Upya QR
                </Button>

                <div className="text-center text-sm text-muted-foreground max-w-sm rounded-lg bg-muted p-4">
                  <p className="font-medium mb-2">Jinsi ya kuunganisha:</p>
                  <ol className="list-decimal list-inside space-y-1 text-left">
                    <li>Fungua WhatsApp kwenye simu yako</li>
                    <li>Nenda Settings {'>'} Linked Devices</li>
                    <li>Bonyeza "Link a Device"</li>
                    <li>Scan QR code hapo juu</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            {/* Phone Number Method */}
            <TabsContent value="phone" className="mt-6">
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
                        <Phone className="size-4" />
                        Tuma Nambari ya Uthibitisho
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground rounded-lg bg-muted p-4 mt-4">
                    <p className="font-medium mb-2">Jinsi ya kutumia:</p>
                    <ol className="list-decimal list-inside space-y-1 text-left">
                      <li>Ingiza namba yako ya WhatsApp hapo juu</li>
                      <li>Utapokea nambari ya uthibitisho kwenye WhatsApp</li>
                      <li>Ingiza nambari hiyo kuthibitisha</li>
                    </ol>
                  </div>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
