"use client"

import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function DashboardNav({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold text-primary">
          Remittra
        </Link>
        <div className="flex items-center gap-1 md:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-sm md:text-base">
              Dashboard
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="text-sm md:text-base">
              Profile
            </Button>
          </Link>
          <Link href="/wallet">
            <Button variant="ghost" className="text-sm md:text-base">
              Wallet
            </Button>
          </Link>
          <Link href="/ajo">
            <Button variant="ghost" className="text-sm md:text-base">
              Ajo
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleLogout} disabled={isLoading} className="text-sm md:text-base">
            {isLoading ? "Signing out..." : "Logout"}
          </Button>
        </div>
      </div>
    </nav>
  )
}
