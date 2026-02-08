# Quick Testing Guide

## Prerequisites
1. Run database migration first:
   - Open Supabase Dashboard → SQL Editor
   - Execute `database/migrations/006_add_user_anonymization.sql`
   - Verify with: `SELECT anon_name, anon_avatar_seed FROM users LIMIT 5;`

2. Start development server:
   ```bash
   npm run dev
   ```

## Test Sequence (20 minutes)

### 1. Toast Notifications (2 min)
1. Navigate to `/upload`
2. Drop files onto upload area → See toast: "X file(s) added"
3. Click "Choose Files" button and select files → See toast again
4. ✅ **Pass:** Toast appears immediately with correct count

### 2. Duplicate Upload Prevention (3 min)
1. Upload any document completely
2. Click upload button rapidly 5 times → Only 1 upload proceeds
3. Check toast message: "Upload already in progress"
4. Refresh page and upload same file again → No 304 error
5. ✅ **Pass:** No duplicate uploads, no 304 errors

### 3. Document Type Locking (5 min)
1. Navigate to `/upload/books` → Type dropdown shows "Book (locked)"
2. Add file → AI categorization runs but doesn't change type
3. Navigate to `/upload/notes` → Type locked to "Short Note"
4. Navigate to `/upload/jumbled` → Type dropdown enabled, AI can suggest
5. ✅ **Pass:** Preselected types stay locked, jumbled allows AI suggestion

### 4. Like/Downvote Buttons (3 min)
1. Go to `/browse` (or home page)
2. Hover over any document card → See Heart and ThumbsDown buttons (NO bookmark)
3. Click Heart → Count increments
4. Click ThumbsDown → Downvote registers, like clears
5. Check stats at bottom of card → Shows Heart icon (not ThumbsUp)
6. ✅ **Pass:** Buttons work correctly, mutually exclusive, no bookmark

### 5. TXT File Upload (3 min)
1. Create test file: `echo "This is a test document.\n\nSecond paragraph.\n\nThird paragraph with more text to test wrapping capabilities." > test.txt`
2. Upload `test.txt` via `/upload/jumbled`
3. After approval, view document → Opens as PDF
4. Check PDF has proper text formatting and pagination
5. ✅ **Pass:** TXT converts to PDF successfully with readable text

### 6. English-Only Titles (2 min)
1. Upload document with non-English filename (e.g., "විද්‍යාව.pdf")
2. Check AI suggested title → Should be in English only
3. Upload multiple documents → All titles in English characters
4. ✅ **Pass:** No Sinhala/Tamil characters in titles

### 7. User Anonymization (2 min)
1. Go to `/browse` → Look at any document card
2. Check uploader name → Should be like "Clever Panda", "Wise Owl" (not real names)
3. Check avatar → Should be colorful bot/robot icon (not real photo)
4. Open single document view → Same anonymous name and avatar
5. Check multiple documents from same user → Consistent name/avatar
6. ✅ **Pass:** All users show anonymous, same user = same anonymous identity

## Quick Smoke Test (All Features in 5 min)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run TypeScript check
npx tsc --noEmit

# Browser Tests (in order):
1. Go to http://localhost:3000/upload
2. Drop 3 files (mix of PDF, image, TXT) → toast appears ✓
3. Go to /upload/books → type locked ✓
4. Fill form and click Upload 5 times fast → only 1 upload ✓
5. Go to /browse → see anonymous names ✓
6. Hover over card → see Heart + ThumbsDown (no bookmark) ✓
7. Click Heart → increments ✓
8. Stats show Heart icon ✓
```

## Regression Tests (Things that should still work)

- [ ] Search functionality still works
- [ ] Load more pagination works
- [ ] PDF preview/download works
- [ ] Comment system works
- [ ] Admin panel accessible (if you're admin)
- [ ] Notifications system works
- [ ] Thank you message system works

## If Something Fails

### Toast not appearing?
- Check browser console for errors
- Verify `toast` is imported from "sonner"
- Check if ToastProvider is in root layout

### Upload still creates duplicates?
- Check Network tab for 304 responses
- Verify cache headers in request
- Clear browser cache and retry

### Type not locked?
- Check URL: must be `/upload/books` not `/upload?type=book`
- Verify `isTypePreselected` flag logic
- Check uploadType from searchParams

### TXT file fails?
- Check file size (<2MB)
- Verify MIME type is "text/plain"
- Check `convertTxtToPdf` function for errors

### Anonymous names not showing?
- **CRITICAL:** Did you run the database migration?
- Check Supabase: `SELECT anon_name FROM users LIMIT 1;`
- If NULL, migration didn't run
- Verify API returns `anon_name` not `name`

### Buttons not working?
- Check if you're logged in (required for voting)
- Verify API endpoints: `/api/documents/upvote`, `/api/documents/downvote`
- Check browser console for errors

## Performance Benchmarks

After all tests, check:
- Browse page loads in <2 seconds
- Search returns results in <1 second
- Upload completes in <5 seconds for small files
- No console errors
- No memory leaks (check Dev Tools Memory tab)

## Done! 🎉

If all tests pass, deployment is ready. Create a pull request or deploy to production.

Report any issues with:
- Which test failed
- Browser and version
- Console errors (if any)
- Steps to reproduce
