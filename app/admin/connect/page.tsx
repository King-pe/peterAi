'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { QrCode, Phone, Loader2, RefreshCw, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ConnectPage() {
  const [method, setMethod] = useState<'qr' | 'phone'>('qr')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch connection status - poll every 2 seconds for faster detection
  const { data: status, isLoading: statusLoading } = useSWR('/api/whatsapp/status', fetcher, {
    refreshInterval: 2000,
  })

  // Fetch QR code
  const { data: qrData, isLoading: qrLoading } = useSWR(
    method === 'qr' && !status?.connected ? '/api/whatsapp/qr' : null,
    fetcher,
    { refreshInterval: 15000 }
  )

  // Show toast when connected
  useEffect(() => {
    if (status?.connected) {
      toast.success('WhatsApp imeunganishwa! Angalia inbox yako kwa ujumbe wa kukaribisha.')
    }
  }, [status?.connected])

  const handlePhoneConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber) {
      toast.error('Tafadhali ingiza nambari ya simu')
      return
    }

    setLoading(true)
    setPairingCode(null)

    try {
      const res = await fetch('/api/whatsapp/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
      } else if (data.pairingCode) {
        setPairingCode(data.pairingCode)
        toast.success('Nambari ya kuunganisha imeundwa!')
      }
    } catch {
      toast.error('Imeshindikana kuunganisha')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        toast.success('Umeondolewa vizuri')
        mutate('/api/whatsapp/status')
        mutate('/api/whatsapp/qr')
      } else {
        toast.error(data.error || 'Imeshindikana kuondoa')
      }
    } catch {
      toast.error('Imeshindikana kuondoa')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshQR = async () => {
    toast.info('Inaonyesha upya QR code...')
    await fetch('/api/whatsapp/qr?refresh=true')
    mutate('/api/whatsapp/qr')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Unganisha WhatsApp</h1>
        <p className="text-muted-foreground">Unganisha nambari yako ya WhatsApp na bot</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {statusLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : status?.connected ? (
              <Wifi className="size-5 text-primary" />
            ) : (
              <WifiOff className="size-5 text-muted-foreground" />
            )}
            Hali ya Muunganisho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status?.connected ? (
                <>
                  <CheckCircle className="size-8 text-primary" />
                  <div>
                    <p className="font-medium">Umeunganishwa</p>
                    <p className="text-sm text-muted-foreground">
                      {status.phoneNumber || 'Nambari ya simu'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="size-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Haujaiunganishwa</p>
                    <p className="text-sm text-muted-foreground">
                      Tumia QR code au nambari ya simu kuunganisha
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {status?.connected && (
              <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Ondoa Muunganisho'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Methods */}
      {!status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Chagua Njia ya Kuunganisha</CardTitle>
            <CardDescription>
              Scan QR code au tumia nambari ya simu kuunganisha kifaa chako
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={method} onValueChange={(v) => setMethod(v as 'qr' | 'phone')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="size-4" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="size-4" />
                  Nambari ya Simu
                </TabsTrigger>
              </TabsList>

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
                    ) : qrData?.qr ? (
                      <div className="rounded-lg border-2 border-primary/20 bg-white p-4 shadow-lg">
                        <img
                          src={qrData.qr}
                          alt="WhatsApp QR Code"
                          className="size-56"
                        />
                      </div>
                    ) : (
                      <div className="flex size-64 flex-col items-center justify-center gap-2 rounded-lg border bg-muted p-4">
                        <QrCode className="size-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          {qrData?.message || 'QR Code inaandaliwa...'}
                        </p>
                        <p className="text-xs text-muted-foreground">Subiri sekunde 5-10</p>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" onClick={handleRefreshQR} disabled={qrLoading}>
                    <RefreshCw className={`size-4 ${qrLoading ? 'animate-spin' : ''}`} />
                    Onyesha Upya QR
                  </Button>
                  
                  <p className="text-xs text-amber-600 text-center max-w-xs">
                    QR code inaisha haraka (~20 sekunde). Kama scan haifanyi kazi, bonyeza "Onyesha Upya QR" kupata code mpya.
                  </p>

                  <div className="text-center text-sm text-muted-foreground max-w-sm rounded-lg bg-muted p-4">
                    <p className="font-medium mb-2">Jinsi ya kuunganisha:</p>
                    <ol className="list-decimal list-inside space-y-1 text-left">
                      <li>Fungua WhatsApp kwenye simu yako</li>
                      <li>Nenda Settings &gt; Linked Devices</li>
                      <li>Bonyeza "Link a Device"</li>
                      <li>Scan QR code hapo juu</li>
                    </ol>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="mt-6">
                <form onSubmit={handlePhoneConnect} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nambari ya Simu (na country code)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="255712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mfano: 255712345678 (Tanzania)
                    </p>
                  </div>

                  <Button type="submit" disabled={loading || !phoneNumber}>
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Inaunda nambari...
                      </>
                    ) : (
                      <>
                        <Phone className="size-4" />
                        Pata Nambari ya Kuunganisha
                      </>
                    )}
                  </Button>

                  {pairingCode && (
                    <div className="mt-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Nambari yako ya kuunganisha:
                      </p>
                      <Badge variant="secondary" className="text-4xl font-mono py-3 px-6 tracking-widest">
                        {pairingCode}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-3">
                        Nambari hii ni halali kwa dakika 2
                      </p>
                      <div className="mt-4 text-sm text-muted-foreground bg-background rounded-lg p-4">
                        <p className="font-medium mb-2">Jinsi ya kutumia:</p>
                        <ol className="list-decimal list-inside space-y-1 text-left max-w-sm mx-auto">
                          <li>Fungua WhatsApp kwenye simu yako</li>
                          <li>Nenda Settings &gt; Linked Devices</li>
                          <li>Bonyeza "Link a Device"</li>
                          <li>Chagua "Link with phone number instead"</li>
                          <li>Ingiza nambari hapo juu</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
