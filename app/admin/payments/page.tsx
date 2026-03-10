import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard, Calendar, Phone } from 'lucide-react'

async function getPayments() {
  const supabase = await createClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    return []
  }

  return payments || []
}

export default async function PaymentsPage() {
  const payments = await getPayments()

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const pendingPayments = payments.filter(p => p.status === 'PENDING').length
  const completedPayments = payments.filter(p => p.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Malipo</h1>
        <p className="text-muted-foreground">Fuatilia malipo yote ya watumiaji</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mapato Yote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TZS {totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Yaliyokamilika</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Yanasubiri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Malipo ({payments.length})</CardTitle>
          <CardDescription>
            Orodha ya malipo yote
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Hakuna malipo bado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Nambari</TableHead>
                    <TableHead>Kiasi</TableHead>
                    <TableHead>Aina</TableHead>
                    <TableHead>Hali</TableHead>
                    <TableHead>Tarehe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.order_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="size-4 text-muted-foreground" />
                          {payment.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CreditCard className="size-4 text-primary" />
                          {payment.currency} {Number(payment.amount).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.type === 'subscription' ? 'Usajili' : 'Credit'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          payment.status === 'COMPLETED' ? 'default' :
                          payment.status === 'PENDING' ? 'secondary' : 'destructive'
                        }>
                          {payment.status === 'COMPLETED' ? 'Imekamilika' :
                           payment.status === 'PENDING' ? 'Inasubiri' : 
                           payment.status === 'FAILED' ? 'Imeshindikana' : 'Imefutwa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="size-4 text-muted-foreground" />
                          {new Date(payment.created_at).toLocaleDateString('sw-TZ')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
