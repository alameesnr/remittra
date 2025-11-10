"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Wallet {
  balance: number
  currency: string
}

export default function WalletOverview({ userId }: { userId: string }) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchWallet = async () => {
      const { data } = await supabase.from("wallets").select("*").eq("user_id", userId).single()
      setWallet(data)
      setLoading(false)
    }

    fetchWallet()
  }, [userId, supabase])

  if (loading)
    return (
      <Card>
        <CardContent className="pt-6">Loading...</CardContent>
      </Card>
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="text-3xl font-bold text-primary">
            {wallet?.currency} {wallet?.balance?.toLocaleString()}
          </p>
        </div>
        <Link href="/wallet">
          <Button className="w-full">Manage Wallet</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
