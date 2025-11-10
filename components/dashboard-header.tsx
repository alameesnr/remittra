"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Profile {
  kyc_status: string
  full_name: string
}

export default function DashboardHeader({ user }: { user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [user.id, supabase])

  if (loading) return <div>Loading...</div>

  const kyStatus = {
    unverified: "🔴 Unverified",
    pending: "🟡 Pending",
    verified: "🟢 Verified",
  }[profile?.kyc_status || "unverified"]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}!</h1>
        <p className="text-muted-foreground mt-2">KYC Status: {kyStatus}</p>
      </div>
    </div>
  )
}
