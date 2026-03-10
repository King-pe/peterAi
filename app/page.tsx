import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, MessageCircle, Zap, Shield, CreditCard, Users, ArrowRight, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Bot className="size-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">PeterAi</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Ingia</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Jisajili</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="size-3.5" />
              Imeundwa na AI
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              WhatsApp Bot Yako Yenye Akili
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              PeterAi ni bot ya WhatsApp inayotumia AI kukujibu maswali yako, kusaidia kazi zako, 
              na kurahisisha mawasiliano yako. Anza leo na credit 5 za bure!
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">
                  Anza Sasa - Bure!
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">Jifunze Zaidi</Link>
              </Button>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="mt-16 flex justify-center">
            <div className="relative mx-auto w-72 rounded-3xl border-4 border-muted bg-card p-4 shadow-2xl">
              <div className="mb-4 flex items-center gap-3 border-b pb-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary">
                  <Bot className="size-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">PeterAi</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Habari! Nawezaje kusaidiwa?
                </div>
                <div className="mr-auto w-fit max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm">
                  Habari! Mimi ni PeterAi. Ninaweza kukusaidia na maswali yoyote. Uliza tu!
                </div>
                <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Nikusaidieni nini leo?
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold md:text-4xl">Kwa Nini PeterAi?</h2>
              <p className="mt-4 text-muted-foreground">
                Vipengele vinavyofanya PeterAi kuwa bot bora zaidi ya WhatsApp
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <MessageCircle className="size-10 text-primary" />
                  <CardTitle className="mt-4">AI Yenye Akili</CardTitle>
                  <CardDescription>
                    Inatumia Groq AI kukujibu maswali magumu kwa haraka na usahihi
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="size-10 text-primary" />
                  <CardTitle className="mt-4">Jibu la Haraka</CardTitle>
                  <CardDescription>
                    Inakujibu ndani ya sekunde chache bila kuchelewa
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="size-10 text-primary" />
                  <CardTitle className="mt-4">Salama na Siri</CardTitle>
                  <CardDescription>
                    Mazungumzo yako yamehifadhiwa kwa usalama mkubwa
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CreditCard className="size-10 text-primary" />
                  <CardTitle className="mt-4">Malipo Rahisi</CardTitle>
                  <CardDescription>
                    Lipa kwa M-Pesa, Tigo Pesa, au Airtel Money
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="size-10 text-primary" />
                  <CardTitle className="mt-4">Msaada 24/7</CardTitle>
                  <CardDescription>
                    Bot inapatikana saa 24 kila siku, bila kupumzika
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Star className="size-10 text-primary" />
                  <CardTitle className="mt-4">Credit 5 Bure</CardTitle>
                  <CardDescription>
                    Anza na credit 5 za bure bila kulipa chochote
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold md:text-4xl">Bei Nafuu</h2>
              <p className="mt-4 text-muted-foreground">
                Chagua mpango unaokufaa
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Bure</CardTitle>
                  <CardDescription>Anza bila kulipa</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">TZS 0</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="size-4 text-primary" />
                      Credit 5 za bure
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="size-4 text-primary" />
                      Msaada wa msingi
                    </li>
                  </ul>
                  <Button className="mt-6 w-full" variant="outline" asChild>
                    <Link href="/auth/sign-up">Anza Sasa</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Inashauriwa
                  </div>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>Kwa matumizi ya kawaida</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">TZS 5,000</span>
                    <span className="text-muted-foreground">/mwezi</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="size-4 text-primary" />
                      Jumbe 100 kwa mwezi
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="size-4 text-primary" />
                      Msaada wa haraka
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="size-4 text-primary" />
                      Historia ya mazungumzo
                    </li>
                  </ul>
                  <Button className="mt-6 w-full" asChild>
                    <Link href="/auth/sign-up">Chagua Mpango</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Premium</CardTitle>
                  <CardDescription>Kwa matumizi mengi</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">TZS 15,000</span>
                    <span className="text-muted-foreground">/mwezi</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="size-4 text-primary" />
                      Jumbe bila kikomo
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="size-4 text-primary" />
                      Msaada wa kipaumbele
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="size-4 text-primary" />
                      Vipengele vya ziada
                    </li>
                  </ul>
                  <Button className="mt-6 w-full" variant="outline" asChild>
                    <Link href="/auth/sign-up">Chagua Mpango</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary/5 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Tayari Kuanza?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Jisajili leo na upate credit 5 za bure kuanza mazungumzo na AI
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">
                  Jisajili Sasa
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/login">
                  Tayari Una Akaunti? Ingia
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Bot className="size-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PeterAi</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2026 PeterAi. Haki zote zimehifadhiwa.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
