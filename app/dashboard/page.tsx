import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardNav from "@/components/dashboard-nav"
import DashboardHeader from "@/components/dashboard-header"
import WalletOverview from "@/components/wallet-overview"
import AjoOverview from "@/components/ajo-overview"
import { Card, CardContent } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  try {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav user={user} />
        <div className="container mx-auto px-4 py-8">
          <DashboardHeader user={user} />
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <WalletOverview userId={user.id} />
            <AjoOverview userId={user.id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav user={user} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center text-destructive">
              Error loading dashboard. Please refresh.
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}
