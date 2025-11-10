"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import DashboardNav from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"

interface Profile {
  id: string
  full_name: string
  phone: string
  country: string
  kyc_status: string
}

export default function ProfilePage() {
  const user = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({ full_name: "", phone: "", country: "NG" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submittingKyc, setSubmittingKyc] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) throw error

        setProfile(data)
        setFormData({
          full_name: data?.full_name || "",
          phone: data?.phone || "",
          country: data?.country || "NG",
        })
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  const handleUpdateProfile = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error: updateError } = await supabase.from("profiles").update(formData).eq("id", user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, ...formData } as Profile)
      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating profile")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitKyc = async () => {
    if (!user) return
    setSubmittingKyc(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Validate phone is set
      if (!formData.phone) {
        throw new Error("Please add your phone number before submitting KYC")
      }

      const { error: kycError } = await supabase.from("profiles").update({ kyc_status: "pending" }).eq("id", user.id)

      if (kycError) throw kycError

      setProfile({ ...profile, kyc_status: "pending" } as Profile)
      setSuccessMessage("KYC submitted for verification. Please wait for admin approval.")
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error submitting KYC")
    } finally {
      setSubmittingKyc(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav user={user!} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">Loading...</CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return router.push("/auth/login")

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  {successMessage}
                </div>
              )}
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 XXX XXXX XXX"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NG">Nigeria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdateProfile} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KYC Section */}
          <Card>
            <CardHeader>
              <CardTitle>KYC Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  {successMessage}
                </div>
              )}
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

              <div className="bg-muted p-4 rounded space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                <div className="flex items-center gap-2">
                  {profile?.kyc_status === "verified" && (
                    <>
                      <span className="text-2xl">✅</span>
                      <span className="text-lg font-semibold text-green-600">Verified</span>
                    </>
                  )}
                  {profile?.kyc_status === "pending" && (
                    <>
                      <span className="text-2xl">⏳</span>
                      <span className="text-lg font-semibold text-amber-600">Pending Review</span>
                    </>
                  )}
                  {profile?.kyc_status === "unverified" && (
                    <>
                      <span className="text-2xl">❌</span>
                      <span className="text-lg font-semibold text-red-600">Unverified</span>
                    </>
                  )}
                </div>
              </div>

              {profile?.kyc_status === "unverified" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Verify your identity to unlock wallet and Ajo features. This process is quick and secure.
                  </p>
                  <Button onClick={handleSubmitKyc} disabled={submittingKyc} className="w-full">
                    {submittingKyc ? "Submitting..." : "Submit for Verification"}
                  </Button>
                </>
              )}

              {profile?.kyc_status === "pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-sm text-amber-800">
                    Your KYC is under review. You'll be notified once verification is complete.
                  </p>
                </div>
              )}

              {profile?.kyc_status === "verified" && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">You're verified! You can now use all Remittra features.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
