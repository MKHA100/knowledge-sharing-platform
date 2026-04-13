# Technology Stack - Knowledge Sharing Platform

**Complete overview of all technologies, frameworks, libraries, and services used in the Knowledge Sharing Platform for Sri Lankan O-Level students.**

---

## Table of Contents

1. [Frontend Stack](#frontend-stack)
2. [Backend Stack](#backend-stack)
3. [Database](#database)
4. [External Services & APIs](#external-services--apis)
5. [File Storage & Media](#file-storage--media)
6. [Authentication & Security](#authentication--security)
7. [UI/UX Libraries](#uiux-libraries)
8. [Development Tools](#development-tools)
9. [Key Features Implementation](#key-features-implementation)

---

## Frontend Stack

### Core Framework

- **Next.js 16** (App Router)
  - Server Components by default
  - Built-in API Routes
  - Image optimization
  - File upload support (50MB limit configured)

### Language & Type System

- **TypeScript 5**
  - Strict mode enabled
  - ES2017 target
  - JSX support (react-jsx)
  - Path aliases configured (`@/*` → `./src/*`)

### React Ecosystem

- **React 19.2.3**
- **React DOM 19.2.3**
- **React Hook Form 7.71.1**
  - Form validation and management
  - Lightweight form handling
- **TanStack Query (React Query) 5.90.19**
  - Server state management
  - Data fetching and caching
  - Background synchronization

### UI Component Libraries

- **shadcn/ui** (Radix UI primitives + Tailwind CSS)
  - **Radix UI Components** (30+ components):
    - `@radix-ui/react-dialog` - Modal dialogs
    - `@radix-ui/react-dropdown-menu` - Dropdown menus
    - `@radix-ui/react-select` - Select dropdowns
    - `@radix-ui/react-alert-dialog` - Confirmation dialogs
    - `@radix-ui/react-accordion` - Accordion
    - `@radix-ui/react-tabs` - Tabbed interfaces
    - `@radix-ui/react-tooltip` - Tooltips
    - `@radix-ui/react-avatar` - User avatars
    - `@radix-ui/react-badge` - Status badges
    - `@radix-ui/react-checkbox` - Checkboxes
    - `@radix-ui/react-radio-group` - Radio buttons
    - `@radix-ui/react-scroll-area` - Scrollable areas
    - `@radix-ui/react-slider` - Range sliders
    - `@radix-ui/react-toggle` - Toggle buttons
    - `@radix-ui/react-switch` - Switch toggles
    - `@radix-ui/react-popover` - Popovers
    - `@radix-ui/react-progress` - Progress bars
    - And more...

### Styling & CSS

- **Tailwind CSS 4.1.9**
  - PostCSS 4.1.9
  - Autoprefixer 10.4.20
  - Mobile-first responsive design
  - Dark mode support (via next-themes)
- **Tailwind CSS Animate 1.0.7**
  - CSS animations
- **Tailwind Merge 3.3.1**
  - Utility class merging
- **next-themes 0.4.6**
  - Dark/light theme switching

### Form & Input

- **Zod 3.25.76**
  - Schema validation (TypeScript-first)
  - Runtime type checking
- **@hookform/resolvers 3.10.0**
  - Integration with Zod for form validation
- **input-otp 1.4.1**
  - One-time password input

### Data & Charts

- **Recharts 2.15.4**
  - Responsive data visualizations
  - Charts, graphs, analytics dashboards
- **date-fns 4.1.0**
  - Date manipulation and formatting
- **react-day-picker 9.8.0**
  - Calendar date picker component

### File & Document Handling

- **react-dropzone 14.3.8**
  - Drag-and-drop file uploads
- **pdf-lib 1.17.1**
  - PDF manipulation (client-side)
- **mammoth 1.11.0**
  - DOCX to HTML conversion
- **unpdf 1.4.0**
  - PDF text extraction
- **mupdf 1.27.0**
  - PDF processing and rendering
- **canvas 3.2.1**
  - Server-side canvas for PDF thumbnail generation
- **@napi-rs/canvas 0.1.88**
  - Native canvas bindings
- **sharp 0.34.5**
  - Image processing and compression
  - Thumbnail creation
- **archiver 7.0.1**
  - ZIP file creation for batch downloads

### UI Utilities

- **cmdk 1.0.4**
  - Command palette/search interface
- **lucide-react 0.454.0**
  - Icon library (450+ icons)
- **clsx 2.1.1**
  - Conditional className utility
- **class-variance-authority 0.7.1**
  - Component style composition
- **embla-carousel-react 8.5.1**
  - Carousel/slider component
- **vaul 1.1.2**
  - Drawer component
- **react-resizable-panels 2.1.7**
  - Resizable panel layouts
- **sonner 1.7.4**
  - Toast notifications

### Analytics

- **PostHog 1.334.1** (posthog-js)
  - Product analytics
  - User behavior tracking
  - Feature flags
- **@vercel/analytics 1.3.1**
  - Web Vitals tracking
- **@vercel/speed-insights 1.3.1**
  - Performance monitoring

### Utilities

- **uuid 13.0.0**
  - Unique ID generation
- **svix 1.84.1**
  - Webhook handling (Clerk webhooks)

---

## Backend Stack

### Runtime & Server

- **Node.js** (via Next.js)
- **Next.js 16 API Routes**
  - REST API endpoints
  - Server-side processing
  - Middleware support

### Server-Side Libraries

- **PostHog Node 5.24.1** (posthog-node)
  - Server-side analytics
  - Event tracking
- **@supabase/ssr 0.8.0**
  - Server-side Supabase client
  - Session management

### API Architecture

All API routes follow Next.js conventions:

- `/api/*` directory structure
- Dynamic route segments `[id]`
- Server Actions support (50MB body limit)

**Key API Endpoints:**

- `/api/admin/*` - Admin operations
- `/api/documents/*` - Document management (upload, fetch, search)
- `/api/comments/*` - User feedback & comments
- `/api/notifications/*` - Notification system
- `/api/users/*` - User management
- `/api/webhooks/*` - Webhook receivers (Clerk)
- `/api/thank-you/*` - Thank-you message handling
- `/api/search/*` - Search functionality

---

## Database

### Database System

- **Supabase** (PostgreSQL 15+)
  - Managed relational database
  - Real-time subscriptions support
  - Built-in Row-Level Security (RLS)

### Database Clients

- **@supabase/supabase-js 2.90.1**
  - JavaScript/TypeScript client
  - Real-time capabilities
- **@supabase/ssr 0.8.0**
  - Server-side rendering support

### Database Schema

**Core Tables:**

1. **users**
   - UUID primary key
   - Synced from Clerk authentication
   - Roles: 'user' | 'admin'
   - Profile information (name, email, avatar)

2. **documents**
   - Approved educational materials
   - Fields:
     - title, subject, type (book/note/paper/jumbled)
     - medium (sinhala/english/tamil)
     - document_status (pending/approved/rejected)
     - Categorization (AI-generated)
     - Metrics: view_count, download_count, upvote_count, downvote_count
     - thumbnail_url (for PDF previews)
     - file_path (R2 storage reference)
     - uploaded_by (user reference)
   - Full-text search with pg_trgm fuzzy matching

3. **comments**
   - User feedback on documents
   - Happiness levels: 'helpful' | 'very_helpful' | 'life_saver'
   - User-document relationships
   - Timestamp tracking

4. **thank_you_messages**
   - AI-moderated appreciation messages
   - Status: 'pending_review' | 'approved' | 'rejected'
   - Sentiment analysis: 'positive' | 'neutral' | 'negative' | 'inappropriate'
   - Linked to documents and commenters
   - Notification triggers

5. **notifications**
   - User notification system
   - Types:
     - 'comment_received' - Someone commented on user's document
     - 'download_milestone' - Document reached milestone download count
     - 'upload_processed' - Upload completed
     - 'document_rejected' - Admin rejected document
     - 'system_message' - System notifications
     - 'complement' - Received praise
     - 'thank_you' - Thank you message received
   - Read status tracking

6. **system_settings** (new)
   - Admin configuration
   - Feature flags
   - Global settings

**Enums:**

```sql
document_status: 'pending', 'approved', 'rejected'
document_type: 'book', 'short_note', 'paper', 'jumbled'
medium_type: 'sinhala', 'english', 'tamil'
thank_you_status: 'pending_review', 'approved', 'rejected'
sentiment_category: 'positive', 'neutral', 'negative', 'inappropriate'
subject_type: O-Level subjects (40+ values)
happiness_level: 'helpful', 'very_helpful', 'life_saver'
notification_type: As listed above
user_role: 'user', 'admin'
```

**Database Functions:**

1. **search_documents()**
   - Fuzzy search using pg_trgm
   - Filter by subject, type, medium, status
   - Ranking algorithm

2. **toggle_upvote()** / **toggle_downvote()**
   - Vote management
   - Mutual exclusion (can't upvote and downvote same document)

3. **increment_view_count()** / **increment_download_count()**
   - Metrics tracking
   - Unique user tracking for downloads

**Extensions Used:**

- `pg_trgm` - Trigram-based full-text search for fuzzy matching
- `pgcrypto` - Cryptographic functions (UUID generation)

**Migrations:**

- `001_add_thank_you_messages.sql` - Thank-you message system
- `002_approve_pending_messages.sql` - Message approval workflow
- `003_add_thank_you_notification_type.sql` - Notification type addition
- `004_add_thumbnail_url.sql` - PDF thumbnail storage
- `004_add_admin_upload_tracking.sql` - Admin upload attribution
- `004_add_system_settings_and_recommendations.sql` - System config table
- `006_add_user_anonymization.sql` - Privacy-related features

---

## External Services & APIs

### Authentication

- **Clerk 6.36.8** (@clerk/nextjs)
  - User sign-up/sign-in
  - OAuth providers (Google, GitHub, etc.)
  - Session management
  - Webhook integration for user sync
  - Managed user profiles

### AI & Content Moderation

- **Google Generative AI 0.24.1** (@google/generative-ai)
  - Document categorization
    - Automatic subject/type classification
    - Uses: google/gemini-2.0-flash-exp
  - Thank-you message moderation
    - Sentiment analysis
    - Appropriateness checking
    - Uses: google/gemma-3-27b-it:free (free tier via OpenRouter)
  - Fallback: Auto-approves if service unavailable

### Webhook Services

- **Svix 1.84.1**
  - Webhook event handling
  - Manages Clerk webhook verification
  - User sync events from Clerk

---

## File Storage & Media

### Cloud Storage

- **Cloudflare R2**
  - S3-compatible object storage
  - File structure:
    - `documents/` - Approved documents
    - `pending/` - Awaiting review
    - `thumbnails/` - PDF previews
  - Access via presigned URLs (time-limited downloads)

### AWS SDK

- **@aws-sdk/client-s3 3.971.0**
  - S3 API client for R2
- **@aws-sdk/s3-request-presigner 3.971.0**
  - Generate presigned download URLs
  - Secure, expiring file access

### Image Processing Pipeline

- **Input**: User upload (PDF, DOCX, images)
- **Processing**:
  1. PDF rendering: Canvas → PNG
  2. Compression: Sharp (400px width, 80% quality)
  3. Format: JPEG (modern formats: AVIF, WebP)
- **Storage**: Thumbnail uploaded to R2
- **Caching**: 60-second minimum TTL in CDN

---

## Authentication & Security

### Authentication Flow

1. User signs up/logs in via Clerk
2. Clerk webhook triggers (`POST /api/webhooks/clerk`)
3. New user synced to Supabase `users` table
4. AppContext provides authenticated user state
5. Protected routes enforced via middleware

### Protected Routes

- `/dashboard`, `/upload`, `/admin`
- `/api/documents/upload`, `/api/comments`, `/api/notifications`, `/api/admin`

### Public Routes

- `/`, `/doc/[id]`, `/api/documents`, `/api/search`, `/api/webhooks`

### Security Features

- **Middleware.ts** - Clerk auth middleware
- **Row-Level Security (RLS)** - PostgreSQL RLS policies
- **Input Validation** - Zod schemas on all inputs
- **CSRF Protection** - Built-in Next.js protection
- **Security Headers** - `poweredByHeader: false`
- **Content Security** - AI moderation
- **Rate Limiting** - Implicit via Cloudflare
- **Data Privacy** - User anonymization support

---

## UI/UX Libraries

### Component Runtime

- **React 19 Concurrent Features**
- **Suspense** - Loading states
- **Error Boundaries** - Error handling

### Icons & Graphics

- **Lucide React** - 450+ icons
- **Recharts** - Data visualizations

### Interactive Components

- **Embla Carousel** - Image/content carousels
- **React Resizable Panels** - Draggable layouts
- **Vaul** - Drawer modals
- **Sonner** - Toast notifications
- **React Day Picker** - Date selection

### Accessibility

- Radix UI provides ARIA labels and keyboard navigation
- Color contrast compliance
- Screen reader support

---

## Development Tools

### Build & Runtime

- **Next.js 16** - Build system
- **TypeScript 5** - Type checking
  - `npx tsc --noEmit` - Type validation

### Linting & Code Quality

- **ESLint 9.39.2**
  - Code quality rules
  - TypeScript support
- **Prettier** (via ESLint config)
  - Code formatting

### Package Manager

- **npm** (preferred)
  - Dependency management
  - Script execution

### Development Server

- **Next.js Dev Server** (`npm run dev`)
  - Hot module replacement
  - Fast refresh
  - Runs on `localhost:3000`

### Build Optimization

- **Tailwind CSS 4** - PostCSS plugin
- **Autoprefixer** - CSS vendor prefixes
- **Image Optimization** - AVIF/WebP formats
- **Package Import Optimization**
  - Optimized loading for `lucide-react`, `@radix-ui/*`

### Environment Variables

Required configuration in `.env.local`:

**Authentication:**

```
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_WEBHOOK_SECRET
```

**Database:**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**File Storage:**

```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
```

**AI Services:**

```
OPENROUTER_API_KEY (for Google Gemini & Gemma models)
```

**Analytics:**

```
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

---

## Key Features Implementation

### 1. Document Upload & Processing

- **Frontend**: React Dropzone + Form validation (Zod)
- **Backend**: Next.js API route with multipart parsing
- **Processing**:
  - PDF → Thumbnail generation (Canvas + Sharp)
  - File optimization
  - Virus scanning (pending R2 integration)
- **Storage**: Cloudflare R2
- **Database**: Document metadata in Supabase
- **AI**: Google Gemini categorization (subject/type)

### 2. Document Approval Workflow

- **Status Flow**: pending → approved/rejected
- **Admin Dashboard**: Review list with thumbnails
- **Notifications**: User notified on approval/rejection
- **Bulk Operations**: Admin can approve/reject multiple documents

### 3. Full-Text Search

- **Technology**: PostgreSQL pg_trgm extension
- **Query Function**: `search_documents()`
- **Filters**:
  - Subject (40+ O-Level subjects)
  - Type (book, note, paper, jumbled)
  - Medium (Sinhala, English, Tamil)
  - Date range
  - Status
- **Features**: Fuzzy matching, ranking, pagination

### 4. Thank-You Messages & AI Moderation

- **Flow**:
  1. Commenter writes thank-you message
  2. Google Gemini analyzes sentiment & appropriateness
  3. Auto-approval for positive/neutral messages
  4. Admin review for negative/inappropriate messages
  5. Notification sent on approval
- **Sentiment Categories**: positive, neutral, negative, inappropriate
- **Database**: `thank_you_messages` table

### 5. Notification System

- **Type**: In-app notifications
- **Triggers**:
  - Comment received
  - Document download milestone
  - Upload processed
  - Document rejected
  - Thank-you message approved
  - System messages
- **Real-time**: TanStack Query polling
- **Database**: `notifications` table

### 6. User Dashboard

- **Sections**:
  - My Uploads (with status)
  - My Downloads
  - Statistics (views, downloads, upvotes)
  - Notifications
  - Profile management
- **Metrics**: Real-time view/download counts

### 7. Analytics & Metrics

- **Tool**: PostHog (client & server-side)
- **Tracking**:
  - User behavior flows
  - Document interactions
  - Search queries
  - Download patterns
- **Dashboard**: Admin analytics view

### 8. Admin Management

- **Features**:
  - User role management (promote to admin)
  - Document review & approval
  - Content moderation
  - System settings configuration
  - Analytics dashboard
  - Download CSV of statistics
- **Access Control**: Role-based via RLS

### 9. Mobile Optimization

- **Responsive Design**: Tailwind CSS mobile-first
- **Touch-Friendly**: Large buttons, optimized spacing
- **Performance**: Code splitting, lazy loading
- **Image Optimization**: Modern formats (AVIF, WebP)

### 10. SEO & Social Sharing

- **Metadata**: Next.js metadata API
- **Structured Data**: JSON-LD schemas
- **Sitemap**: Dynamic `sitemap.ts`
- **Robots**: `robots.ts` configuration
- **Open Graph**: Social media preview cards

---

## Technology Decision Rationale

| Component | Technology            | Reason                                        |
| --------- | --------------------- | --------------------------------------------- |
| Framework | Next.js 16            | SSR + SSG, API routes, excellent DX           |
| Language  | TypeScript            | Type safety, IDE support, maintainability     |
| Auth      | Clerk                 | Easy OAuth, webhooks, managed sessions        |
| Database  | Supabase              | PostgreSQL power, RLS, real-time support      |
| Storage   | Cloudflare R2         | S3-compatible, cost-effective CDN             |
| UI        | shadcn/ui + Radix     | Accessible, customizable, headless components |
| Styling   | Tailwind CSS          | Utility-first, responsive, performance        |
| Forms     | React Hook Form + Zod | Lightweight, type-safe validation             |
| State     | TanStack Query        | Server state management, caching              |
| AI        | Google Gemini         | State-of-art, fast inference, affordable      |
| Analytics | PostHog               | Open-source alternative, privacy-focused      |

---

## Deployment & Performance

### Deployment Target

- **Platform**: Vercel (recommended for Next.js)
- **Database**: Supabase hosted
- **Storage**: Cloudflare R2
- **Analytics**: PostHog Cloud

### Performance Optimizations

- Image optimization (AVIF, WebP, lazy loading)
- CSS-in-JS minimization (Tailwind)
- Code splitting (Next.js automatic)
- API response compression (`compress: true`)
- Minimum image cache TTL: 60 seconds
- Package import optimization (Lucide, Radix)

### Monitoring

- Vercel Analytics (Web Vitals)
- PostHog (user behavior)
- Supabase monitoring (database)
- Error tracking (via PostHog)

---

## Summary by Layer

| Layer                  | Primary Technologies                             |
| ---------------------- | ------------------------------------------------ |
| **Frontend UI**        | React 19, Next.js 16, TypeScript, Tailwind CSS 4 |
| **Component Library**  | shadcn/ui (Radix UI + Tailwind)                  |
| **Forms & Validation** | React Hook Form, Zod                             |
| **State Management**   | TanStack Query, React Context                    |
| **Backend**            | Next.js API Routes, Node.js                      |
| **Database**           | Supabase (PostgreSQL 15+)                        |
| **File Storage**       | Cloudflare R2 (S3-compatible)                    |
| **Authentication**     | Clerk                                            |
| **AI/ML**              | Google Generative AI (Gemini 2.0, Gemma 3)       |
| **Media Processing**   | Canvas, Sharp, PDF-lib, Mammoth                  |
| **Analytics**          | PostHog, Vercel Analytics                        |
| **Webhooks**           | Svix, Clerk Webhooks                             |
| **Icons**              | Lucide React                                     |
| **Charts**             | Recharts                                         |
| **Notifications**      | Sonner (client-side)                             |

---

**Last Updated**: March 28, 2026
**Project**: Knowledge Sharing Platform for Sri Lankan O-Level Students
**Status**: Active Development
