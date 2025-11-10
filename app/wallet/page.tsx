"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import DashboardNav from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

interface Wallet {
  id: string
  balance: number
  currency: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
}

interface Profile {
  kyc_status: string
}

export default function WalletPage() {
  const user = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<"fund" | "withdraw" | null>(null)
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const [walletRes, profileRes, transRes] = await Promise.all([
          supabase.from("wallets").select("*").eq("user_id", user.id).single(),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(15),
        ])

        setWallet(walletRes.data)
        setProfile(profileRes.data)
        setTransactions(transRes.data || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load wallet data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, supabase])

  const handleTransaction = async () => {
    if (!wallet || !amount || !user) return

    setProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const numAmount = Number.parseFloat(amount)

      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Amount must be a positive number")
      }

      if (action === "withdraw" && wallet.balance < numAmount) {
        throw new Error("Insufficient balance")
      }

      const newBalance = action === "fund" ? wallet.balance + numAmount : wallet.balance - numAmount

      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id)

      if (updateError) throw updateError

      const { error: transError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: action === "fund" ? "credit" : "debit",
        amount: numAmount,
        description: `Wallet ${action === "fund" ? "funding" : "withdrawal"}`,
      })

      if (transError) throw transError

      setWallet({ ...wallet, balance: newBalance })
      setAmount("")
      setAction(null)
      setSuccessMessage(`Successfully ${action === "fund" ? "funded" : "withdrew"} NGN ${numAmount.toLocaleString()}`)
      setTimeout(() => setSuccessMessage(null), 3000)

      const { data: transData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15)

      setTransactions(transData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setProcessing(false)
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

  if (!user) return router.push("/auth/login")

  const isVerified = profile?.kyc_status === "verified"

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <div className="container mx-auto px-4 py-8">
        {!isVerified && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              You must complete KYC verification to use wallet features.{" "}
              <a href="/profile" className="underline font-medium">
                Go to profile
              </a>
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {wallet?.currency} {wallet?.balance?.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Available balance</p>
                </div>

                {isVerified && (
                  <div className="space-y-2">
                    <Button
                      variant={action === "fund" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => {
                        setAction("fund")
                        setAmount("")
                        setError(null)
                      }}
                    >
                      Add Money
                    </Button>
                    <Button
                      variant={action === "withdraw" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => {
                        setAction("withdraw")
                        setAmount("")
                        setError(null)
                      }}
                    >
                      Withdraw
                    </Button>
                  </div>
                )}

                {action && isVerified && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium text-sm">{action === "fund" ? "Add Money" : "Withdraw Money"}</h4>
                    <div>
                      <Label htmlFor="amount" className="text-xs">
                        Amount (NGN)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={processing}
                      />
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    {successMessage && <p className="text-xs text-green-600">{successMessage}</p>}
                    <Button className="w-full text-sm" onClick={handleTransaction} disabled={processing || !amount}>
                      {processing ? "Processing..." : `Confirm ${action}`}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-sm bg-transparent"
                      onClick={() => {
                        setAction(null)
                        setAmount("")
                        setError(null)
                      }}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 border rounded bg-muted hover:bg-muted/70 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString()}{" "}
                            {new Date(tx.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <p
                          className={`font-semibold text-sm ml-4 whitespace-nowrap ${
                            tx.type === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}NGN {tx.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No transactions yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
