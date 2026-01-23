# Pending Images Feature - Complete Implementation

## Overview
Admin workflow for processing user-submitted images into published documents.

## User Journey

### 1. User Uploads Images
- User goes to `/upload?type=paper` (or any type)
- Selects multiple images
- System detects all files are images
- Shows confirmation: "These look like scanned images"
- User submits → stored in `pending_images` table
- User redirected to `/upload/images-submitted?count=X`

### 2. Admin Reviews Pending Images
- Admin navigates to Admin Panel → "Pending Images" section
- Sees table with:
  - User info (name, email, avatar)
  - Number of images in batch
  - Upload timestamp
  - Submission notes (if any)
- **Actions available:**
  - **Download ZIP** - Downloads all images as a zip file
  - **Upload PDF** - Opens upload dialog (main workflow)
  - **Delete** - Removes batch and images from storage

### 3. Admin Compiles Images (External)
- Admin downloads images as ZIP
- Opens images in external tool (Adobe Acrobat, PDF converter, etc.)
- Compiles/merges images into single PDF
- Saves PDF file

### 4. Admin Uploads Compiled PDF
- Clicks "Upload PDF" button
- Dialog opens showing:
  - **Original uploader info** (name, email, avatar)
  - **User's submission notes**
  - **Form fields:**
    - PDF file upload (required)
    - Document type: Book/Short Note/Paper/Jumbled (pre-filled: Paper)
    - Subject: dropdown of 52 subjects (required)
    - Title: text input (pre-filled with user's name)
    - Description: textarea (pre-filled with user notes)
    - Medium: Sinhala/English/Tamil (pre-filled: English)
- Clicks "Upload & Publish"

### 5. System Processing
- Uploads PDF to R2 storage
- Creates document record with:
  - `uploader_id` = original user (not admin!)
  - `status` = "approved" (auto-approved)
  - `uploaded_by_admin` = true
  - `admin_uploaded_by` = admin's user ID
  - `original_image_batch_id` = batch ID reference
- Deletes original images from R2
- Marks batch as "processed" in database
- Sends notification to original uploader

### 6. User Receives Notification
- User gets notification: "Your images have been published!"
- Document appears in their uploads
- Document shows original user as uploader (admin is transparent)
- Users can download, share, and get credit for the document

## Technical Implementation

### Files Created/Modified

#### 1. Admin Component (UI)
**File:** `src/app/admin/_components/pending-images-section.tsx`
- Complete redesign of pending images UI
- Removed non-functional "Mark Processed" button
- Added "Upload PDF" button with full upload dialog
- Dialog includes:
  - File upload for PDF
  - Pre-filled form with user context
  - All required metadata fields
  - Validation and error handling

#### 2. API Endpoint
**File:** `src/app/api/admin/pending-images/[id]/upload/route.ts`
- `POST /api/admin/pending-images/[id]/upload`
- Handles PDF upload and document creation
- Validates:
  - Admin permissions
  - Batch exists and is pending
  - PDF file type
  - Required fields
- Creates document as original user
- Cleans up original images
- Marks batch as processed
- Sends notification

#### 3. Admin Page Handler
**File:** `src/app/admin/page.tsx`
- Added `handleUploadCompiled()` function
- Added `handleRefreshPendingImages()` function
- Updated `PendingImagesSection` props

#### 4. Database Migration
**File:** `database/migrations/004_add_admin_upload_tracking.sql`
- Added columns to `documents` table:
  - `uploaded_by_admin` (boolean)
  - `admin_uploaded_by` (UUID reference)
  - `original_image_batch_id` (UUID reference)
- Enables tracking and attribution

## Database Schema Changes

```sql
ALTER TABLE documents 
ADD COLUMN uploaded_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_uploaded_by UUID REFERENCES users(id),
ADD COLUMN original_image_batch_id UUID REFERENCES pending_images(id);
```

**Run this migration in Supabase:**
Execute `database/migrations/004_add_admin_upload_tracking.sql`

## API Endpoints

### Upload Compiled PDF
```
POST /api/admin/pending-images/[id]/upload
Content-Type: multipart/form-data

Body (FormData):
- file: PDF file (required)
- type: "book" | "short_note" | "paper" | "jumbled" (required)
- subject: subject ID (required)
- title: document title (required)
- description: document description (optional)
- medium: "sinhala" | "english" | "tamil" (required)

Response:
{
  "success": true,
  "data": { "documentId": "uuid" },
  "message": "Document published successfully"
}
```

### Download Images (Existing)
```
GET /api/admin/pending-images/[id]
→ Returns ZIP file with all images
```

### Delete Batch (Existing)
```
DELETE /api/admin/pending-images/[id]
→ Deletes images and database record
```

## Key Features

### 1. Transparent Attribution
- Document appears as uploaded by original user
- User gets full credit and notifications
- User sees it in their "My Uploads"
- Admin involvement is tracked but not publicly visible

### 2. Complete Metadata
- All document fields can be set by admin
- Pre-filled with user's submission notes
- Validates required fields before submission

### 3. Clean Workflow
- Download → Compile → Upload in one flow
- No orphaned images after processing
- Automatic cleanup of source files
- Batch removed from pending list

### 4. User Experience
- User gets notified when published
- Clear message explaining what happened
- Link to view the published document
- Maintains trust and transparency

## Testing Checklist

- [ ] User uploads 5 images → appears in pending queue
- [ ] Admin clicks Download → ZIP downloads with 5 files
- [ ] Admin compiles PDF externally
- [ ] Admin clicks "Upload PDF" → dialog opens
- [ ] Dialog shows correct user info and notes
- [ ] Admin fills form and uploads → success toast
- [ ] Document created with original user as uploader
- [ ] Original images deleted from R2
- [ ] Batch removed from pending list
- [ ] User receives notification
- [ ] Document appears in user's uploads
- [ ] Document visible in browse page
- [ ] Admin can see tracking fields in database

## Future Enhancements

1. **In-App PDF Compilation**
   - Add image-to-PDF conversion in the upload dialog
   - Use libraries like `jsPDF` or `pdf-lib`
   - Admin doesn't need external tools

2. **Batch Operations**
   - Select multiple batches
   - Download all as separate ZIPs
   - Bulk process

3. **Processing Status**
   - "In Progress" status when admin downloads
   - Timestamp of last download
   - Assigned admin tracking

4. **Image Preview**
   - Show thumbnail previews in admin panel
   - Quick view without downloading

5. **Rejection Workflow**
   - Reject with reason
   - Notify user of rejection
   - User can re-submit

## Removed Features

### ❌ "Mark Processed" Button (Old Implementation)
- **Problem:** Just deleted images without creating document
- **Why removed:** Not useful - admin has no way to upload the compiled PDF
- **Replaced with:** "Upload PDF" workflow that handles everything

## Notes for Developers

- Always use `createAdminClient()` for admin operations
- Validate admin role before any admin action
- Use original user's ID for document ownership
- Clean up files if operations fail
- Send notifications for user-facing actions
- Track admin actions for audit trail
