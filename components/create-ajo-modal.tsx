"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateAjoModalProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAjoModal({ userId, onClose, onSuccess }: CreateAjoModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    contribution_amount: "",
    frequency: "weekly",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleCreate = async () => {
    if (!formData.title || !formData.contribution_amount) {
      setError("All fields are required")
      return
    }

    const amount = Number.parseFloat(formData.contribution_amount)
    if (isNaN(amount) || amount <= 0) {
      setError("Contribution amount must be a positive number")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: groupData, error: groupError } = await supabase
        .from("ajo_groups")
        .insert({
          owner_id: userId,
          title: formData.title,
          contribution_amount: amount,
          frequency: formData.frequency,
          status: "planning",
        })
        .select()
        .single()

      if (groupError) throw groupError

      const { error: memberError } = await supabase.from("ajo_members").insert({
        group_id: groupData.id,
        user_id: userId,
        position: 1,
      })

      if (memberError) throw memberError

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Ajo Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Group Name</Label>
            <Input
              id="title"
              placeholder="e.g., Work Friends Savings"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contribution">Contribution Amount (NGN)</Label>
            <Input
              id="contribution"
              type="number"
              placeholder="5000"
              value={formData.contribution_amount}
              onChange={(e) => setFormData({ ...formData, contribution_amount: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
