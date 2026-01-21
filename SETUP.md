# Setup Instructions

## Database Setup

1. **Execute Schema in Supabase**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor
   - Copy the entire contents of `database/schema.sql`
   - Paste and execute in SQL Editor
   - This creates 7 tables, 6 functions, indexes, and triggers

## Webhook Setup

2. **Configure Clerk Webhook**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks
   - Click "Add Endpoint"
   - URL: `http://localhost:3000/api/webhooks/clerk` (for development)
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy the "Signing Secret"
   - Update `.env.local`: Replace `whsec_your_webhook_secret_here` with actual secret

## R2 Bucket Structure

3. **Organize R2 Bucket**
   - Go to [Cloudflare R2](https://dash.cloudflare.com/r2) → Your bucket (`kms`)
   - Create these folders:
     - `documents/` - For approved files
     - `pending/` - For files awaiting approval
     - `rejected/` - For rejected files (optional)

## Admin User Setup

4. **Create First Admin**
   - Start the dev server: `npm run dev`
   - Sign in with Google to create your user account
   - In Supabase → Table Editor → `users` table
   - Find your user record and change `role` from `'user'` to `'admin'`

## Development Server

5. **Start Development**
   ```bash
   npm run dev
   ```

   - Visit http://localhost:3000
   - Test authentication with Google
   - Check API endpoints at http://localhost:3000/api/\*

## Production Deployment

6. **For Production Webhook**
   - Deploy to Vercel/Netlify/Railway
   - Update Clerk webhook URL to: `https://your-domain.com/api/webhooks/clerk`
   - Update `NEXT_PUBLIC_APP_URL` in production environment

## Troubleshooting

- **Webhook 404**: Ensure `svix` package is installed (`npm install svix`)
- **Database errors**: Check if all enum types were created properly
- **R2 upload issues**: Verify bucket permissions and public access settings
- **Admin access**: Ensure your user role is set to `'admin'` in database
