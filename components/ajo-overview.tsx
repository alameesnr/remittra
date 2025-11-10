"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AjoGroup {
  id: string
  title: string
  contribution_amount: number
}

export default function AjoOverview({ userId }: { userId: string }) {
  const [groups, setGroups] = useState<AjoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await supabase
        .from("ajo_members")
        .select("ajo_groups(id, title, contribution_amount)")
        .eq("user_id", userId)
        .limit(3)

      setGroups(data?.map((m: any) => m.ajo_groups) || [])
      setLoading(false)
    }

    fetchGroups()
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
        <CardTitle>Ajo Groups ({groups.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.length > 0 ? (
          <>
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="p-2 border rounded bg-muted text-sm">
                  <p className="font-medium">{group.title}</p>
                  <p className="text-muted-foreground">NGN {group.contribution_amount}</p>
                </div>
              ))}
            </div>
            <Link href="/ajo">
              <Button className="w-full">View All Groups</Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">No groups yet</p>
            <Link href="/ajo">
              <Button className="w-full">Create or Join a Group</Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
