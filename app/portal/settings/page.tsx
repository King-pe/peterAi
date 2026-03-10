'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PortalSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || '',
            email: profileData.email || user.email || '',
            phone: profileData.phone || '',
          })
        }
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Hujaingia')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq('id', user.id)

      if (error) {
        toast.error('Imeshindikana kuhifadhi')
      } else {
        toast.success('Mipangilio imehifadhiwa!')
      }
    } catch {
      toast.error('Kuna tatizo, jaribu tena')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mipangilio</h1>
        <p className="text-muted-foreground">Simamia akaunti yako</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Taarifa za Akaunti
          </CardTitle>
          <CardDescription>
            Badilisha taarifa zako za akaunti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Jina Kamili</Label>
            <Input
              id="fullName"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Jina lako kamili"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Barua Pepe</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Barua pepe haiwezi kubadilishwa
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nambari ya Simu</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="255712345678"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Inahifadhi...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Hifadhi
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
