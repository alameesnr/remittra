# Remittra - Digital Wallet & Ajo (Group Savings) Platform

A full-stack demo application built for the Remittra Stage 1 Developer Task. Demonstrates end-to-end skills in authentication, data modeling, business logic, and responsive UI.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Framework**: Next.js 16 (App Router)
- **Backend/Database**: Supabase (PostgreSQL with Row Level Security)
- **Auth**: Supabase Email/Password Auth
- **State Management**: React Hooks + Client-side Supabase
- **UI Components**: shadcn/ui

## Features

### Authentication
- Email/password signup with profile creation
- Persistent login sessions with middleware protection
- Automatic wallet & profile initialization on signup

### Profile & KYC
- User profile management (name, phone, country)
- KYC verification workflow (unverified → pending → verified)
- Admin approval system for KYC verification

### Wallet
- NGN currency balance display
- Fund wallet (credit) functionality
- Withdraw (debit) with balance validation
- Complete transaction history with timestamps
- Prevents negative balance operations

### Ajo Groups (Rotating Savings)
- Create/join group savings circles
- Member rotation with position tracking
- Contribution cycle management
- Group pool accumulation
- Payout recipient rotation (FIFO)
- Cycle history and ledger tracking
- KYC requirement enforced for group operations

### Admin Dashboard
- Approve/reject pending KYC verifications
- Start group cycles
- Monitor pending operations

## Database Schema

All tables use Row Level Security (RLS) to ensure users can only access their own data.

**Core Tables:**
- `profiles` - User info, KYC status, admin flag
- `wallets` - NGN balance per user
- `transactions` - Debit/credit history
- `ajo_groups` - Group metadata (title, contribution, frequency)
- `ajo_members` - Member positions in groups
- `ajo_cycles` - Cycle tracking with payout recipients
- `ajo_ledger` - Contribution/payout records per cycle

## Setup & Deployment

### Prerequisites
1. Supabase project with PostgreSQL database
2. Node.js 18+

### Local Development

1. **Clone and install:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Add environment variables** in `.env.local`:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
   \`\`\`

3. **Run migrations** in Supabase:
   - Copy SQL from `scripts/001_create_schema.sql`
   - Execute in Supabase SQL Editor
   - This creates all tables, RLS policies, and triggers

4. **Start dev server:**
   \`\`\`bash
   npm run dev
   \`\`\`

### Setting Admin User

1. After a user signs up, get their UUID
2. In Supabase, run:
   \`\`\`sql
   UPDATE profiles SET is_admin = TRUE WHERE id = 'user_uuid';
   \`\`\`

### Deployment to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables to Vercel project settings
4. Deploy - automatic on push to main

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

## Test Credentials

**Demo Admin:**
- Email: `admin@demo.com`
- Password: `DemoPass123!`
- Confirm email link in terminal/logs
- After signup, set `is_admin = TRUE` in database

**Test User:**
- Email: `user@demo.com`
- Password: `UserPass123!`

## Key Business Rules

1. **Wallet Protection**: Cannot withdraw more than balance
2. **KYC Requirement**: Must be verified to:
   - Create Ajo groups
   - Join groups
   - Make contributions
3. **Rotation Logic**: Members receive payout in FIFO order
4. **Balance Deduction**: Contributions immediately deduct from wallet
5. **Cycle Management**: Each cycle tracks contributions and designates payout recipient

## Project Structure

\`\`\`
app/
  ├── auth/              # Authentication pages
  │   ├── login/
  │   ├── sign-up/
  │   └── sign-up-success/
  ├── dashboard/         # Main dashboard
  ├── profile/           # Profile & KYC
  ├── wallet/            # Wallet management
  ├── ajo/               # Ajo groups
  ├── admin/             # Admin dashboard
  └── layout.tsx         # Root layout
components/
  ├── dashboard-nav.tsx  # Navigation bar
  ├── dashboard-header.tsx
  ├── ajo-group-detail.tsx
  ├── create-ajo-modal.tsx
  └── ui/                # shadcn components
lib/
  ├── supabase/
  │   ├── client.ts      # Browser client
  │   ├── server.ts      # Server client
  │   └── middleware.ts  # Auth middleware
hooks/
  ├── use-auth.tsx       # Auth hook
scripts/
  └── 001_create_schema.sql  # DB setup
\`\`\`

## Evaluation Checklist

- [x] Register/login with email/password
- [x] Edit profile and submit KYC
- [x] Verify account status updates
- [x] Fund and withdraw from wallet
- [x] View transaction history
- [x] Create and join Ajo groups
- [x] Contribute to group cycles
- [x] Track rotation and payout recipients
- [x] Prevent negative wallet balance
- [x] Enforce KYC for group features
- [x] Admin KYC verification
- [x] Group cycle management
- [x] Responsive mobile design
- [x] Error handling & loading states
- [x] RLS data security

## Notes

- Email confirmation is required before wallet/KYC operations
- Admin access controlled via `is_admin` flag in profiles table
- All sensitive operations use server-side Supabase clients
- Mock payment gateway - real implementation would use Stripe
- Cycles advance manually via admin dashboard in demo mode

---

Built with v0 for the Remittra Full-Stack Developer Stage 1 Task.
