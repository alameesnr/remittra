import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">Remittra</div>
          <div className="space-x-2">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold text-balance">Digital Wallet & Group Savings Made Simple</h1>
          <p className="text-xl text-muted-foreground text-balance">
            Manage your money, verify your identity, and join community savings groups with Remittra
          </p>

          <div className="grid md:grid-cols-3 gap-4 py-8">
            <div className="bg-card border border-border rounded-lg p-6 space-y-2">
              <div className="text-3xl">💰</div>
              <h3 className="font-semibold">Wallet</h3>
              <p className="text-sm text-muted-foreground">Fund and withdraw money securely</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-2">
              <div className="text-3xl">✓</div>
              <h3 className="font-semibold">KYC</h3>
              <p className="text-sm text-muted-foreground">Quick identity verification</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-2">
              <div className="text-3xl">👥</div>
              <h3 className="font-semibold">Ajo Groups</h3>
              <p className="text-sm text-muted-foreground">Join rotating savings circles</p>
            </div>
          </div>

          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
