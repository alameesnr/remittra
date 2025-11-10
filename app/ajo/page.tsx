"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import DashboardNav from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import AjoGroupDetail from "@/components/ajo-group-detail"
import CreateAjoModal from "@/components/create-ajo-modal"

interface AjoGroup {
  id: string
  title: string
  contribution_amount: number
  frequency: string
  status: string
  owner_id: string
  start_date: string
}

interface Profile {
  kyc_status: string
}

export default function AjoPage() {
  const user = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groups, setGroups] = useState<AjoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const [profileRes, groupsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("ajo_members").select("ajo_groups(*)").eq("user_id", user.id),
        ])

        setProfile(profileRes.data)
        setGroups(groupsRes.data?.map((m: any) => m.ajo_groups) || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load groups")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, supabase])

  const handleCreateSuccess = async () => {
    setShowCreateModal(false)
    if (!user) return

    const { data } = await supabase.from("ajo_members").select("ajo_groups(*)").eq("user_id", user.id)

    setGroups(data?.map((m: any) => m.ajo_groups) || [])
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

  if (!user) return router.push("/auth/login")

  const isVerified = profile?.kyc_status === "verified"

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <div className="container mx-auto px-4 py-8">
        {!isVerified && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              You must complete KYC verification to create or join Ajo groups.{" "}
              <a href="/profile" className="underline font-medium">
                Go to profile
              </a>
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Ajo Groups</h1>
          {isVerified && <Button onClick={() => setShowCreateModal(true)}>Create Group</Button>}
        </div>

        {selectedGroupId ? (
          <AjoGroupDetail groupId={selectedGroupId} userId={user.id} onBack={() => setSelectedGroupId(null)} />
        ) : groups.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:border-primary transition"
                onClick={() => setSelectedGroupId(group.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Contribution</p>
                      <p className="font-semibold">NGN {group.contribution_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-semibold capitalize">{group.frequency}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        group.status === "active"
                          ? "bg-green-100 text-green-800"
                          : group.status === "planning"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {group.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground">
                No groups yet. {isVerified ? "Create one to get started!" : "Verify your identity first."}
              </p>
              {isVerified && <Button onClick={() => setShowCreateModal(true)}>Create First Group</Button>}
            </CardContent>
          </Card>
        )}

        {showCreateModal && isVerified && (
          <CreateAjoModal userId={user.id} onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
        )}
      </div>
    </div>
  )
}
