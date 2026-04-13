# SEO/GEO Optimization - Deployment Guide

## 🚀 What Was Added

This PR adds comprehensive SEO and GEO (Generative Engine Optimization) features to make StudyShare visible on Google, Bing, and AI assistants.

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/indexnow/route.ts` | IndexNow API for instant search engine indexing |
| `src/app/api/indexnow-batch/route.ts` | Batch URL submission to IndexNow |
| `src/lib/faqs-enhanced.ts` | 20+ GEO-optimized FAQ entries |
| `src/lib/upload-indexnow.ts` | Auto-index on document upload |
| `src/lib/browse-metadata.ts` | Dynamic metadata for subject/filter pages |

## 📋 Pre-Deployment Checklist

Before merging this PR, complete these steps:

### 1. Add Environment Variables to Vercel

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Select StudyShare project → Settings → Environment Variables

Add these variables:

```
NEXT_PUBLIC_SITE_URL=https://studyshare.space
```

```
INDEXNOW_KEY=studyshare-indexnow-key
```
(You can use any random string, or generate one with: `openssl rand -hex 16`)

### 2. Verify in Google Search Console (MUST DO)

1. Go to https://search.google.com/search-console
2. Click "Add Property" → "URL prefix" → `https://studyshare.space`
3. Choose "HTML tag" verification
4. Copy the verification code (e.g., `abc123xyz`)
5. Add to Vercel:
   ```
   NEXT_PUBLIC_GOOGLE_VERIFICATION=abc123xyz
   ```
6. Redeploy and click "Verify" in GSC

### 3. Verify in Bing Webmaster Tools (CRITICAL for AI visibility)

1. Go to https://www.bing.com/webmasters
2. Add site: `https://studyshare.space`
3. Choose "HTML Meta Tag" verification
4. Copy the verification code (e.g., `A1B2C3D4`)
5. Add to Vercel:
   ```
   NEXT_PUBLIC_BING_VERIFICATION=A1B2C3D4
   ```
6. Redeploy and verify

### 4. Create Required Assets

Create these files in `/public/` folder:

- `og-image.png` (1200×630 pixels) - Social sharing image
- `apple-icon.png` (180×180 pixels) - iOS home screen icon

Quick options:
- Use [Canva](https://canva.com) → Search "Open Graph" templates
- Or hire on Fiverr (~$10-20)

## 🔄 Post-Deployment Steps

### 1. Submit Sitemaps

**Google Search Console:**
- Go to Sitemaps → Enter `sitemap.xml` → Submit

**Bing Webmaster:**
- Go to Sitemap → Submit `https://studyshare.space/sitemap.xml`

### 2. Request Indexing for Priority Pages

**Google (one-by-one in URL Inspection):**
```
https://studyshare.space/
https://studyshare.space/browse
https://studyshare.space/faq
https://studyshare.space/browse/mathematics
https://studyshare.space/browse/science
https://studyshare.space/browse/english
```

**Bing (batch submission allowed):**
Submit all 78 URLs from the attached `urls-to-index.txt` file.

### 3. Integrate Enhanced FAQs

Update your FAQ page to use the new enhanced FAQs:

```typescript
import { enhancedFAQs, generateFAQSchema } from "@/lib/faqs-enhanced";

// In your FAQ page component
const faqs = enhancedFAQs;

// Add structured data
<JsonLd data={generateFAQSchema(faqs)} />
```

### 4. Integrate Upload Indexing

Add to your upload success handler:

```typescript
import { handleUploadSuccess } from "@/lib/upload-indexnow";

// After successful upload
await handleUploadSuccess({
  id: document.id,
  subject: document.subject,
  subjectSlug: subjectSlug,
  type: document.type,
  medium: document.medium,
});
```

### 5. Use Dynamic Metadata

For subject/filter pages, use the metadata generator:

```typescript
import { generateBrowseMetadata } from "@/lib/browse-metadata";

export async function generateMetadata({ searchParams }): Promise<Metadata> {
  return generateBrowseMetadata({
    subject: searchParams.subject,
    subjectName: getSubjectDisplayName(searchParams.subject),
    type: searchParams.type,
    medium: searchParams.lang,
  });
}
```

## 📈 Expected Timeline

| Milestone | Time |
|-----------|------|
| Deploy code changes | Immediate |
| Google verification | 5 minutes |
| Bing verification | 5 minutes |
| Sitemap processing | 24-48 hours |
| Google starts indexing | 1-2 weeks |
| Bing indexing | 3-7 days |
| Ranking for brand | 2-3 weeks |
| AI assistant references | 2-6 weeks |

## ✅ Verification Steps

### Check if indexed:
- **Google:** Search `site:studyshare.space`
- **Bing:** Search on Bing: `site:studyshare.space`

### Test AI awareness:
- Ask Perplexity: "What is StudyShare Sri Lanka?"
- Ask ChatGPT: "Where can I find free O-Level past papers in Sri Lanka?"

### Check Search Console:
- Go to Performance tab
- Look for impressions growing
- Check Coverage for any errors

## 🆘 Troubleshooting

### "Not indexed after 2 weeks"
- Check for crawl errors in GSC Coverage report
- Ensure sitemap is accessible at `/sitemap.xml`
- Verify robots.txt isn't blocking pages
- Build some backlinks (share on social media)

### "IndexNow not working"
- Check that `INDEXNOW_KEY` is set in Vercel
- Verify the key file exists at `public/studyshare-indexnow-key.txt`
- Check API logs in Vercel dashboard

### "Metadata not showing"
- Ensure `NEXT_PUBLIC_SITE_URL` is set correctly
- Hard refresh browser (Ctrl+Shift+R)
- Check page source (Ctrl+U) for meta tags

## 📝 Additional Resources

- [IndexNow Documentation](https://www.indexnow.org/documentation)
- [Google Search Central](https://developers.google.com/search)
- [Bing Webmaster Guidelines](https://www.bing.com/webmaster/help/guidelines-30d23f7a)

---

**Questions?** Check the full analysis in `studyshare-seo-analysis.md`
