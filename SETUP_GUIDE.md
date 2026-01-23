# Quick Setup Guide

## Required Database Migration

### Step 1: Create Pending Images Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Pending images table for admin review
CREATE TABLE IF NOT EXISTS pending_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_paths TEXT[] NOT NULL,
  submission_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_images_uploader ON pending_images(uploader_id);
CREATE INDEX IF NOT EXISTS idx_pending_images_status ON pending_images(status);
CREATE INDEX IF NOT EXISTS idx_pending_images_created_at ON pending_images(created_at DESC);

-- Enable RLS
ALTER TABLE pending_images ENABLE ROW LEVEL SECURITY;

-- Admins can see all pending images
CREATE POLICY "Admins can view all pending images"
  ON pending_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

-- Users can see their own pending images
CREATE POLICY "Users can view their own pending images"
  ON pending_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = pending_images.uploader_id
      AND users.clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Users can insert their own pending images
CREATE POLICY "Users can insert their own pending images"
  ON pending_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = pending_images.uploader_id
      AND users.clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Admins can update pending images
CREATE POLICY "Admins can update pending images"
  ON pending_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

-- Admins can delete pending images
CREATE POLICY "Admins can delete pending images"
  ON pending_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );
```

### Step 2: Verify Table Creation
```sql
-- Check if table exists
SELECT * FROM pending_images LIMIT 1;

-- Should return empty result (no rows) but no error
```

---

## Optional: Word to PDF Conversion Setup

### Option 1: Cloudmersive (Recommended)
1. Sign up at https://cloudmersive.com/
2. Get your API key
3. Add to `.env.local`:
   ```env
   CLOUDMERSIVE_API_KEY=your_api_key_here
   ```

### Option 2: ConvertAPI
1. Sign up at https://www.convertapi.com/
2. Get your secret
3. Update `src/app/api/documents/convert-word/route.ts` to use ConvertAPI

### Option 3: Skip Conversion
- Word documents won't be converted
- Users will see error message
- Can still upload PDFs and images normally

---

## Environment Variables Checklist

Add these to your `.env.local`:

```env
# Required - Already configured
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
R2_BUCKET_NAME=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Optional - PostHog Analytics (gracefully degrades if missing)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Optional - Word Conversion (feature disabled if missing)
CLOUDMERSIVE_API_KEY=your_cloudmersive_key
```

---

## Testing the Implementation

### Test 1: Share Button
1. Go to Dashboard
2. Click share button on any document
3. ✅ Should see "Link copied to clipboard!" toast
4. Paste in browser - URL should be `/browse?doc={id}`

### Test 2: Image Upload
1. Go to /upload
2. Select upload type (any)
3. Choose only image files (JPG, PNG, etc.)
4. Click Continue
5. ✅ Should see "X image(s) sent for admin review!" message

### Test 3: Mixed Upload
1. Go to /upload
2. Select "Jumbled" or any type
3. Choose mix of Word docs, PDFs, and images
4. Click Continue
5. ✅ Should see toast about images sent to admin
6. ✅ Should proceed to details page with PDFs
7. ✅ Word docs should be converted to PDF (if API configured)

### Test 4: Admin Dashboard
1. Login as admin
2. Go to /admin
3. Click "Pending Images" tab
4. ✅ Should see list of image batches
5. Click "Download" on a batch
6. ✅ Should download ZIP file with images
7. Click "Delete" on a batch
8. ✅ Should remove batch from list

---

## Troubleshooting

### "Link copied" toast doesn't appear
- **Cause:** Clipboard API blocked by browser
- **Solution:** Try different browser or disable strict privacy settings
- **Note:** Fallback method should still work

### Word conversion fails
- **Cause:** CLOUDMERSIVE_API_KEY not configured
- **Solution:** Add API key or skip Word uploads
- **Note:** Users can convert to PDF manually before upload

### Pending images not showing in admin
- **Cause:** Database migration not run
- **Solution:** Run the SQL from Step 1 above
- **Check:** Verify table exists with `\dt pending_images` in psql

### ZIP download fails
- **Cause:** Missing `archiver` package
- **Solution:** Run `npm install archiver`
- **Check:** Verify package.json includes archiver

### Images not uploading to R2
- **Cause:** R2 permissions or bucket configuration
- **Solution:** Check R2_BUCKET_NAME and credentials
- **Test:** Try manual R2 upload via AWS CLI

---

## Production Deployment Checklist

- [ ] Run database migration in Supabase
- [ ] Add CLOUDMERSIVE_API_KEY (optional)
- [ ] Test all upload scenarios
- [ ] Test admin image management
- [ ] Test share button on different browsers
- [ ] Verify PostHog tracking (optional)
- [ ] Check R2 storage quotas
- [ ] Test with ad-blocker enabled
- [ ] Verify error handling for failed uploads
- [ ] Test with slow network connection

---

## Need Help?

1. Check `/IMPLEMENTATION_SUMMARY.md` for detailed information
2. Review error logs in browser console (F12)
3. Check Supabase logs for database errors
4. Verify R2 bucket access in Cloudflare dashboard
5. Test API endpoints directly with curl/Postman

---

## Quick Commands

```bash
# Install missing packages
npm install archiver

# Run development server
npm run dev

# Check for TypeScript errors
npm run build

# Test database connection
# Run this SQL in Supabase:
SELECT * FROM pending_images LIMIT 1;

# Check R2 connection
# Test upload endpoint:
curl -X POST http://localhost:3000/api/documents/submit-images \
  -H "Authorization: Bearer your_token" \
  -F "files=@test-image.jpg"
```

---

That's it! Your system is now ready to handle:
✅ Mixed document uploads
✅ Automatic Word→PDF conversion  
✅ Image submissions to admin review
✅ Reliable share functionality
✅ Graceful PostHog error handling
