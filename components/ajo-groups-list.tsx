"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AjoGroup {
  id: string
  title: string
  contribution_amount: number
  frequency: string
  status: string
  member_count?: number
}

export default function AjoGroupsList({
  groups,
  userId,
}: {
  groups: AjoGroup[]
  userId: string
}) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No groups yet. Create one to get started!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="text-lg">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Contribution: NGN {group.contribution_amount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Frequency: {group.frequency}</p>
            <p className="text-sm text-muted-foreground">Status: {group.status}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
