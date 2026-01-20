# Unnamed - Video Virality Analyzer

AI-powered video analysis to help creators go viral. Upload videos, get scored on hook/body/ending, and receive actionable suggestions.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js (Google + Facebook)
- **AI**: Google Gemini 2.0 Flash (video understanding)
- **Storage**: Uploadthing (video upload, thumbnails)
- **Payments**: Stripe (subscriptions)
- **Styling**: Tailwind CSS v4 + shadcn/ui (dark mode)
- **State**: Zustand + TanStack React Query

## Project Structure

```
src/
├── app/
│   ├── (marketing)/          # Landing, pricing pages
│   ├── (onboarding)/         # 4-step onboarding flow
│   ├── (dashboard)/          # Protected dashboard pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── upload/           # Video upload
│   │   ├── analysis/[id]/    # Analysis results
│   │   ├── history/          # Video history
│   │   ├── settings/         # User settings
│   │   └── affiliate/        # Affiliate dashboard
│   └── api/
│       ├── auth/             # NextAuth
│       ├── videos/           # Video CRUD
│       ├── analysis/         # Trigger/get analysis
│       ├── user/             # User profile/onboarding
│       ├── stripe/           # Checkout, webhooks
│       ├── affiliate/        # Affiliate stats
│       └── uploadthing/      # File uploads
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── providers.tsx         # App providers
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── db.ts                 # Prisma client
│   ├── uploadthing.ts        # Uploadthing config
│   └── onboarding-store.ts   # Zustand store
└── services/
    ├── video-analyzer.ts     # Gemini AI integration
    ├── user-score.ts         # Weighted score calculation
    ├── potential-calculator.ts # Onboarding potential
    └── stripe.ts             # Stripe helpers
```

## Key Features

1. **Onboarding Flow**: 4-step flow (followers → goals → challenges → potential) before auth
2. **Video Analysis**: Upload → Gemini AI analysis → scores (hook/body/ending) + suggestions
3. **User Scoring**: Weighted average (40% recent, 30% previous, 20% older, 10% rest)
4. **Subscriptions**: Free (3/mo), Pro $9 (30/mo), Unlimited $29
5. **Affiliate Program**: 50% lifetime recurring commission

## Pricing Tiers

| Tier | Price | Analyses/Month |
|------|-------|----------------|
| Free | $0 | 3 |
| Pro | $9/mo | 30 |
| Unlimited | $29/mo | Unlimited |

## Key Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push schema to database
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio
```

## Environment Variables

See `.env.example` for all required variables:
- DATABASE_URL
- NEXTAUTH_URL, NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
- UPLOADTHING_SECRET, UPLOADTHING_APP_ID
- GOOGLE_AI_API_KEY
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, STRIPE_PRICE_UNLIMITED

## Getting Started

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run db:push
npm run dev
```

## User Flows

### Onboarding
Landing → Followers → Goals → Challenges → Potential → Sign Up → Dashboard

### Video Analysis
Upload → Select Platform/Mode → Processing → Results (scores + suggestions)

### Affiliate
Create referral code → Share link → Earn 50% of referred payments forever
