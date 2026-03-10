'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Settings, Save, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    botName: 'PeterAi',
    welcomeMessage: 'Habari! Mimi ni PeterAi, msaidizi wako wa AI. Nawezaje kukusaidia leo?',
    freeCredits: '5',
    creditPrice: '100',
  })

  const handleSave = async () => {
    setLoading(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Mipangilio imehifadhiwa!')
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mipangilio</h1>
        <p className="text-muted-foreground">Simamia mipangilio ya bot</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Mipangilio ya Bot
            </CardTitle>
            <CardDescription>
              Badilisha mipangilio ya msingi ya bot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botName">Jina la Bot</Label>
              <Input
                id="botName"
                value={settings.botName}
                onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Ujumbe wa Kukaribisha</Label>
              <Textarea
                id="welcomeMessage"
                rows={3}
                value={settings.welcomeMessage}
                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Ujumbe huu utatumwa kwa watumiaji wapya
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mipangilio ya Credits</CardTitle>
            <CardDescription>
              Simamia bei na idadi ya credits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="freeCredits">Credits za Bure (Mtumiaji Mpya)</Label>
                <Input
                  id="freeCredits"
                  type="number"
                  value={settings.freeCredits}
                  onChange={(e) => setSettings({ ...settings, freeCredits: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditPrice">Bei ya Credit 1 (TZS)</Label>
                <Input
                  id="creditPrice"
                  type="number"
                  value={settings.creditPrice}
                  onChange={(e) => setSettings({ ...settings, creditPrice: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Inahifadhi...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Hifadhi Mipangilio
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
