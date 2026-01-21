# klippost

**Know if your video will go viral before you post it.**

## The Pitch

You spend 2 hours making a TikTok. You post it. 347 views. Pain.

klippost fixes this. Upload your video *before* posting and our AI tells you:
- Your viral potential score (0-100)
- Predicted view range (e.g., "50K-100K")
- Exactly what's wrong and how to fix it

We score three things that make or break short-form content:
1. **Hook** — Do the first 3 seconds stop the scroll?
2. **Body** — Does the middle keep people watching?
3. **Ending** — Is there a reason to follow/like/comment?

The magic isn't the scores. It's the suggestions. Not "improve your hook" garbage — actual fixes like "Add text overlay at 0:02 to create curiosity gap" or "Your ending is abrupt, add a question to spark comments."

Creators stop guessing. They fix weak spots before wasting a post.

## Tech

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL** + Prisma
- **Google Gemini 2.0 Flash** — watches videos, understands them
- **Stripe** — subscriptions (monthly/yearly)
- **Mailgun** — email magic links
- **Uploadthing** — video uploads
- **Tailwind + shadcn/ui**

## Pricing

| Plan | Price | Analyses |
|------|-------|----------|
| Free | $0 | 3/month |
| Pro | $9/mo or $90/yr | 30/month |
| Unlimited | $29/mo or $290/yr | Unlimited |

## Structure

```
src/
├── app/
│   ├── (marketing)/     # Landing, pricing
│   ├── (onboarding)/    # 4-step flow + auth
│   ├── (dashboard)/     # Upload, results, history, settings
│   └── api/             # Auth, videos, analysis, stripe, uploads
├── components/ui/       # shadcn components
├── lib/                 # Auth, db, stores
└── services/            # Gemini AI, Stripe, Mailgun
```

## Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run db:push    # Push schema
npm run db:studio  # Prisma Studio
```

## Env Vars

```
DATABASE_URL
NEXTAUTH_URL, NEXTAUTH_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION
UPLOADTHING_SECRET, UPLOADTHING_APP_ID
GOOGLE_AI_API_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO, STRIPE_PRICE_UNLIMITED
STRIPE_PRICE_PRO_YEARLY, STRIPE_PRICE_UNLIMITED_YEARLY
```

## Flow

1. Land on homepage
2. 4-step onboarding (followers → goals → challenges → see potential)
3. Sign up (Google or email)
4. Upload video
5. Get scores + suggestions
6. Fix weak spots, reupload or post with confidence
