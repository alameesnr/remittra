"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AjoGroup {
  id: string
  title: string
  contribution_amount: number
  frequency: string
  status: string
  owner_id: string
}

interface Member {
  user_id: string
  position: number
  profiles: {
    full_name: string
  }
}

interface Cycle {
  id: string
  cycle_number: number
  payout_user_id: string | null
  paid_out: boolean
  pool_amount: number
}

interface AjoGroupDetailProps {
  groupId: string
  userId: string
  onBack: () => void
}

export default function AjoGroupDetail({ groupId, userId, onBack }: AjoGroupDetailProps) {
  const [group, setGroup] = useState<AjoGroup | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [contributing, setContributing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, membersRes, cyclesRes] = await Promise.all([
          supabase.from("ajo_groups").select("*").eq("id", groupId).single(),
          supabase
            .from("ajo_members")
            .select("user_id, position, profiles(full_name)")
            .eq("group_id", groupId)
            .order("position", { ascending: true }),
          supabase.from("ajo_cycles").select("*").eq("group_id", groupId).order("cycle_number", { ascending: false }),
        ])

        setGroup(groupRes.data)
        setMembers(membersRes.data || [])
        setCycles(cyclesRes.data || [])
      } catch (err) {
        console.error("Error fetching group data:", err)
        setError("Failed to load group details")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [groupId, supabase])

  const handleContribute = async () => {
    if (!group) return

    setContributing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Get user wallet
      const { data: walletRes, error: walletErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (walletErr || !walletRes) throw new Error("Wallet not found")
      if (walletRes.balance < group.contribution_amount) {
        throw new Error("Insufficient wallet balance")
      }

      // Get or create current cycle
      let currentCycle = cycles.find((c) => !c.paid_out)

      if (!currentCycle) {
        const { data: newCycle, error: cycleErr } = await supabase
          .from("ajo_cycles")
          .insert({
            group_id: groupId,
            cycle_number: (cycles[0]?.cycle_number || 0) + 1,
            payout_user_id: members[0]?.user_id,
            pool_amount: 0,
          })
          .select()
          .single()

        if (cycleErr) throw cycleErr
        currentCycle = newCycle
      }

      // Deduct from wallet
      const newBalance = walletRes.balance - group.contribution_amount
      await supabase.from("wallets").update({ balance: newBalance }).eq("id", walletRes.id)

      // Record contribution in ledger
      await supabase.from("ajo_ledger").insert({
        group_id: groupId,
        user_id: userId,
        cycle_number: currentCycle.cycle_number,
        movement: "contribution",
        amount: group.contribution_amount,
      })

      // Update cycle pool
      const newPoolAmount = (currentCycle.pool_amount || 0) + group.contribution_amount
      await supabase.from("ajo_cycles").update({ pool_amount: newPoolAmount }).eq("id", currentCycle.id)

      setSuccessMessage(
        `Contributed NGN ${group.contribution_amount.toLocaleString()} to cycle ${currentCycle.cycle_number}`,
      )
      setTimeout(() => setSuccessMessage(null), 3000)

      // Refresh data
      const { data: updatedCycles } = await supabase
        .from("ajo_cycles")
        .select("*")
        .eq("group_id", groupId)
        .order("cycle_number", { ascending: false })

      setCycles(updatedCycles || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to contribute")
    } finally {
      setContributing(false)
    }
  }

  if (loading)
    return (
      <Card>
        <CardContent className="pt-6">Loading...</CardContent>
      </Card>
    )
  if (!group)
    return (
      <Card>
        <CardContent className="pt-6">Group not found</CardContent>
      </Card>
    )

  const isOwner = group.owner_id === userId
  const currentCycle = cycles.find((c) => !c.paid_out)
  const nextPayoutMember = members.find((m) => m.user_id === currentCycle?.payout_user_id)

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        Back to Groups
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{group.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {successMessage}
            </div>
          )}
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Contribution</p>
              <p className="font-semibold">NGN {group.contribution_amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frequency</p>
              <p className="font-semibold capitalize">{group.frequency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">{group.status}</p>
            </div>
          </div>

          {group.status === "planning" && isOwner && (
            <div className="pt-4 border-t">
              <Button className="w-full">Start Group</Button>
            </div>
          )}

          {group.status === "active" && (
            <div className="pt-4 border-t">
              <Button onClick={handleContribute} disabled={contributing} className="w-full">
                {contributing ? "Contributing..." : "Contribute Now"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {currentCycle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cycle #</p>
                <p className="font-semibold">{currentCycle.cycle_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pool</p>
                <p className="font-semibold">NGN {currentCycle.pool_amount?.toLocaleString()}</p>
              </div>
            </div>
            {nextPayoutMember && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  Next payout goes to: <span className="font-semibold">{nextPayoutMember.profiles.full_name}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member, idx) => (
              <div key={member.user_id} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">
                  <span className="font-medium">{member.profiles.full_name}</span>
                  {member.user_id === userId && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
                </span>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  Position {member.position}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {cycles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cycle History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cycles.map((cycle) => (
                <div key={cycle.id} className="p-3 border rounded bg-muted text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Cycle {cycle.cycle_number}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        cycle.paid_out ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {cycle.paid_out ? "Completed" : "Active"}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">Pool: NGN {cycle.pool_amount?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
