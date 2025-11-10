"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import DashboardNav from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

interface PendingKyc {
  id: string
  full_name: string
  phone: string
  kyc_status: string
  email: string
}

interface AjoGroup {
  id: string
  title: string
  owner_id: string
  status: string
  contribution_amount: number
}

export default function AdminPage() {
  const user = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingKycs, setPendingKycs] = useState<PendingKyc[]>([])
  const [ajoGroups, setAjoGroups] = useState<AjoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const checkAdmin = async () => {
      try {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

        if (!profile?.is_admin) {
          router.push("/dashboard")
          return
        }

        setIsAdmin(true)
        await fetchData()
      } catch (err) {
        console.error("Error checking admin status:", err)
        router.push("/dashboard")
      }
    }

    checkAdmin()
  }, [user, supabase, router])

  const fetchData = async () => {
    try {
      const [kycRes, groupsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, kyc_status").eq("kyc_status", "pending"),
        supabase.from("ajo_groups").select("id, title, owner_id, status, contribution_amount").eq("status", "planning"),
      ])

      // Fetch emails from auth
      const kycWithEmail = await Promise.all(
        (kycRes.data || []).map(async (kyc: any) => {
          const {
            data: { user: authUser },
          } = (await supabase.auth.admin?.getUser(kyc.id)) || { data: { user: null } }
          return { ...kyc, email: authUser?.email || "N/A" }
        }),
      )

      setPendingKycs(kycWithEmail)
      setAjoGroups(groupsRes.data || [])
    } catch (err) {
      console.error("Error fetching admin data:", err)
      setError("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyKyc = async (userId: string) => {
    setActionLoading(userId)
    try {
      const { error: updateError } = await supabase.from("profiles").update({ kyc_status: "verified" }).eq("id", userId)

      if (updateError) throw updateError

      setPendingKycs(pendingKycs.filter((k) => k.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify KYC")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectKyc = async (userId: string) => {
    setActionLoading(userId)
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ kyc_status: "unverified" })
        .eq("id", userId)

      if (updateError) throw updateError

      setPendingKycs(pendingKycs.filter((k) => k.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject KYC")
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartAjoGroup = async (groupId: string) => {
    setActionLoading(groupId)
    try {
      const { error: updateError } = await supabase
        .from("ajo_groups")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", groupId)

      if (updateError) throw updateError

      setAjoGroups(ajoGroups.filter((g) => g.id !== groupId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start group")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav user={user!} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">Loading...</CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAdmin || !user) {
    return router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending KYC Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending KYC Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingKycs.length > 0 ? (
                <div className="space-y-3">
                  {pendingKycs.map((kyc) => (
                    <div key={kyc.id} className="border rounded p-3 space-y-2">
                      <div>
                        <p className="font-medium">{kyc.full_name}</p>
                        <p className="text-xs text-muted-foreground">{kyc.email}</p>
                        <p className="text-xs text-muted-foreground">{kyc.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVerifyKyc(kyc.id)}
                          disabled={actionLoading === kyc.id}
                        >
                          {actionLoading === kyc.id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleRejectKyc(kyc.id)}
                          disabled={actionLoading === kyc.id}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No pending KYCs</p>
              )}
            </CardContent>
          </Card>

          {/* Planning Ajo Groups Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Groups Awaiting Start</CardTitle>
            </CardHeader>
            <CardContent>
              {ajoGroups.length > 0 ? (
                <div className="space-y-3">
                  {ajoGroups.map((group) => (
                    <div key={group.id} className="border rounded p-3 space-y-2">
                      <div>
                        <p className="font-medium">{group.title}</p>
                        <p className="text-xs text-muted-foreground">
                          NGN {group.contribution_amount.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleStartAjoGroup(group.id)}
                        disabled={actionLoading === group.id}
                      >
                        {actionLoading === group.id ? "Starting..." : "Start Group"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No groups to start</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
