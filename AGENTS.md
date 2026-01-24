# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A knowledge-sharing platform for Sri Lankan O-Level students to share educational documents (books, notes, papers). Features user authentication, document upload/approval workflows, AI-moderated thank-you messages, and admin management.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Cloudflare R2 (S3-compatible)
- **AI**: Google Gemini (`@google/generative-ai`) for content moderation
- **Image Processing**: `canvas` (server-side PDF rendering), `sharp` (image compression)
- **UI**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Data Fetching**: TanStack Query
- **Validation**: Zod
- **Analytics**: PostHog

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server (requires build first)
```

**Note**: No test framework is configured. TypeScript type-checking can be run via `npx tsc --noEmit`.

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # API endpoints (admin, documents, users, webhooks, etc.)
│   ├── admin/             # Admin dashboard pages
│   ├── browse/            # Document browsing
│   ├── dashboard/         # User dashboard
│   ├── upload/            # Document upload flow
│   └── (home)/            # Landing page
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities
│   ├── ai/               # AI: categorize.ts (document classification), moderate-message.ts (thank-you moderation)
│   ├── r2/               # Cloudflare R2 file operations (client.ts)
│   ├── supabase/         # Supabase clients (server.ts, client.ts, admin.ts)
│   ├── validations/      # Zod schemas
│   ├── constants/        # App constants
│   ├── posthog/          # Analytics setup
│   ├── utils/            # Helper utilities (thumbnail-generator.ts, pdf-converter.ts, etc.)
│   └── app-context.tsx   # Global React context (useApp hook)
├── types/                 # TypeScript type definitions
└── middleware.ts          # Clerk auth middleware
database/
├── schema.sql             # Full database schema (run in Supabase SQL Editor)
└── migrations/            # Database migrations
```

### Data Flow

1. **Authentication**: Clerk handles sign-in/sign-up → Webhook syncs user to Supabase → `AppContext` provides user state
2. **Document Upload**: Upload to R2 `documents/` folder → Generate thumbnail → Save to database → Approved (user-verified)
3. **Thumbnail Generation**: PDF first page rendered server-side → Compressed JPEG (400px, 80%) → Uploaded to R2 `thumbnails/` folder
4. **AI Moderation**: Thank-you messages analyzed by Gemini → Auto-approve positive/neutral, admin reviews negative/inappropriate

### Supabase Client Usage

```typescript
// Server-side (API routes, Server Components)
import { createServerSupabaseClient } from "@/lib/supabase/server";
const supabase = await createServerSupabaseClient();

// Client-side (Client Components)
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Admin operations (bypasses RLS)
import { createAdminClient } from "@/lib/supabase/admin";
const supabase = createAdminClient();
```

### R2 File Operations

```typescript
import { uploadToR2, deleteFromR2, moveFile, getPresignedDownloadUrl } from "@/lib/r2/client";

// Folders: "documents" (approved), "pending" (awaiting review), "thumbnails"
await uploadToR2(buffer, filename, contentType, "pending");
await moveFile(oldKey, "documents");  // On approval
```

### Protected Routes (middleware.ts)

Protected routes requiring authentication:
- `/dashboard`, `/upload`, `/admin`
- `/api/documents/upload`, `/api/comments`, `/api/notifications`, `/api/admin`

Public routes:
- `/`, `/doc/[id]`, `/api/documents`, `/api/search`, `/api/webhooks`

## Database

Schema defined in `database/schema.sql`. Key tables:
- `users` - Clerk-synced user accounts (role: 'user' | 'admin')
- `documents` - Uploaded files with status, categorization, metrics, thumbnail_url
- `comments` - User feedback with happiness levels
- `notifications` - User notification system
- `thank_you_messages` - AI-moderated appreciation messages

Key enums: `document_status`, `document_type`, `subject_type`, `medium_type`, `sentiment_category`

Database functions (defined in schema.sql):
- `search_documents()` - Fuzzy search with filters using pg_trgm
- `toggle_upvote()` / `toggle_downvote()` - Vote management with mutual exclusion
- `increment_view_count()` / `increment_download_count()` - Metrics tracking (downloads track unique users)

Migrations (in `database/migrations/`):
- `001_add_thank_you_messages.sql` - Thank-you message system
- `002_approve_pending_messages.sql` - Approve pending thank-you messages
- `003_add_thank_you_notification_type.sql` - Add thank-you notification type
- `004_add_thumbnail_url.sql` - Add thumbnail_url column for PDF previews

## Environment Variables

Required in `.env.local`:
```bash
# Clerk Authentication
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2 Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# AI Moderation (OpenRouter)
# Text moderation uses: google/gemma-3-27b-it:free (free tier)
# Document categorization uses: google/gemini-2.0-flash-exp (paid - uses your credits for dedicated rate limits)
OPENROUTER_API_KEY=
```

## API Route Conventions

API routes follow Next.js App Router patterns:
- `route.ts` for endpoint handlers
- Dynamic segments: `[id]`, catch-all: `[[...slug]]`
- Use `auth()` from Clerk for protected routes
- Return `NextResponse.json()` for responses

Example API route:
```typescript
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const supabase = await createServerSupabaseClient();
  // ... query supabase
}
```

## Key Patterns

1. **Type definitions** mirror database schema exactly - see `src/types/index.ts`
2. **AppContext** (`useApp()`) provides global state for auth, notifications, modals
3. **Document approval workflow**: pending → admin review → approved/rejected
4. **AI moderation** fails safe (auto-approves if Gemini unavailable)
5. **File uploads** have 50MB limit configured in `next.config.ts`

## Code Style

- Prefer functional components with hooks
- Use Server Components by default, Client Components (`"use client"`) when needed
- TypeScript strict mode enabled
- Follow existing patterns in codebase for consistency

## Testing Notes

No test framework is currently set up. When adding tests, consider:
- Jest + React Testing Library for component tests
- Playwright or Cypress for E2E tests
