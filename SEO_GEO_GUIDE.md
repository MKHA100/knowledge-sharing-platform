# SEO & GEO Optimization Guide for StudyShare

## 🎯 Goal: Make StudyShare #1 for O-Level Search Queries

This guide covers everything needed to make `sstudyshare.vercel.app` visible on:
- Google Search
- Bing Search
- Perplexity AI
- ChatGPT/OpenAI
- Claude/Anthropic
- Other AI assistants

---

## ✅ Code Changes Made

### 1. Fixed Domain URLs
Changed all hardcoded `studyshare.lk` → `sstudyshare.vercel.app`

### 2. Enhanced Metadata (`layout.tsx`)
- Added 30+ targeted keywords including:
  - "O-Level past papers free download"
  - "Sri Lanka O Level notes"
  - "GCE Ordinary Level papers"
  - Sinhala keywords: "සාමාන්‍ය පෙළ පසුගිය විභාග ප්‍රශ්න"
- Added `category` and `classification` meta tags
- Added verification placeholders for Google/Bing

### 3. Browse Page SEO
- Added full metadata to `/browse` page
- Keywords for all document types and mediums

### 4. Enhanced Sitemap (`sitemap.ts`)
- Added filter combination URLs (type=paper, lang=sinhala, etc.)
- Added popular subject + type combinations
- ~80+ URLs now in sitemap

### 5. Enhanced Robots.txt (`robots.ts`)
- Added specific rules for:
  - Googlebot
  - Bingbot
  - GPTBot (OpenAI)
  - ChatGPT-User
  - anthropic-ai / Claude-Web
  - PerplexityBot
- All AI crawlers explicitly allowed on documentation

### 6. AI Documentation Updated
- `llms.txt` - Now has direct URLs for all sections
- `llms-full.txt` - Comprehensive with filter examples
- `llms.json` - Structured data endpoint
- `.well-known/ai-plugin.json` - AI discovery file

---

## 🚨 CRITICAL: Manual Steps Required

### Step 1: Add Environment Variable to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
```
NEXT_PUBLIC_SITE_URL = https://studyshare.space
```

### Step 2: Register with Google Search Console (MUST DO)

1. Go to: https://search.google.com/search-console
2. Click "Add Property"
3. Enter: `https://studyshare.space`
4. Choose "URL prefix" method
5. Select "HTML tag" verification
6. Copy the verification code (looks like: `abc123xyz789`)
7. Add to Vercel Environment Variables:
   ```
   NEXT_PUBLIC_GOOGLE_VERIFICATION = abc123xyz789
   ```
8. Deploy and verify in Google Search Console
9. **Submit sitemap**: Go to Sitemaps → Enter `sitemap.xml` → Submit

### Step 3: Register with Bing Webmaster Tools (MUST DO for AI)

1. Go to: https://www.bing.com/webmasters
2. Sign in with Microsoft account
3. Add site: `https://studyshare.space`
4. Choose "HTML Meta Tag" verification
5. Copy the content value (looks like: `ABCD1234567890`)
6. Add to Vercel Environment Variables:
   ```
   NEXT_PUBLIC_BING_VERIFICATION = ABCD1234567890
   ```
7. Deploy and verify
8. **Submit sitemap**: Enter `https://studyshare.space/sitemap.xml`
9. **Enable IndexNow** for instant indexing (Bing → URL Submission → IndexNow)

> ⚠️ Bing is CRITICAL because Perplexity, Copilot, and DuckDuckGo use Bing's index!

### Step 4: Request Indexing

After verification, request indexing for key pages:

**In Google Search Console:**
1. URL Inspection → Enter URL → Request Indexing

Request indexing for:
- `https://studyshare.space/`
- `https://studyshare.space/browse`
- `https://studyshare.space/browse/mathematics`
- `https://studyshare.space/browse/science`
- `https://studyshare.space/browse?type=paper`
- `https://studyshare.space/faq`

**In Bing Webmaster:**
1. URL Submission → Submit URLs → Paste URLs

### Step 5: Create OG Image (Required for Social Sharing)

You need to create `/public/og-image.png`:
- Size: 1200x630 pixels
- Content: StudyShare logo, tagline, visual
- File location: `public/og-image.png`

Quick option: Use Canva, Figma, or any design tool to create this.

### Step 6: Add Apple Icon

Create `/public/apple-icon.png`:
- Size: 180x180 pixels
- Your app icon for iOS

---

## 📊 Expected Timeline

| Action | Time to See Results |
|--------|-------------------|
| Sitemap submission | 24-48 hours |
| Google indexing | 1-2 weeks |
| Bing indexing | 3-7 days |
| Ranking improvement | 2-4 weeks |
| AI references | 1-4 weeks |

---

## 🔍 How to Verify Indexing

### Check if Google indexed your site:
Search: `site:sstudyshare.vercel.app`

### Check if Bing indexed your site:
Search on Bing: `site:sstudyshare.vercel.app`

### Check AI awareness:
Ask Perplexity: "What is StudyShare Sri Lanka?"
Ask ChatGPT: "What websites have free O-Level past papers for Sri Lanka?"

---

## 🎯 Target Keywords to Rank For

### Primary (High Priority)
- "O-Level past papers"
- "O Level notes"
- "Sri Lanka O Level"
- "GCE O Level papers"
- "O/L exam papers"
- "free O Level materials"

### Subject-Specific
- "O Level mathematics past papers"
- "O Level science notes"
- "O Level English past papers"
- "O Level ICT notes"
- "O Level history papers"

### Medium-Specific
- "Sinhala medium past papers"
- "English medium O Level notes"
- "Tamil medium study materials"

### Long-Tail (Easy to Rank)
- "free O Level past papers download Sri Lanka"
- "O Level revision notes PDF"
- "GCE ordinary level model papers"
- "Grade 11 exam papers Sri Lanka"

---

## 🤖 GEO: Getting Referenced by AI

### What We've Done:
1. ✅ Created `llms.txt` with direct URLs
2. ✅ Created `llms-full.txt` with comprehensive documentation
3. ✅ Created `llms.json` endpoint
4. ✅ Created `.well-known/ai-plugin.json`
5. ✅ Added specific robots.txt rules for AI crawlers
6. ✅ Schema.org structured data throughout

### Additional Steps:
1. **Wikipedia/WikiData**: If possible, create a Wikipedia page or WikiData entry
2. **Social Proof**: Share on social media, forums, Reddit
3. **Backlinks**: Get educational sites to link to you
4. **Content**: Add more FAQ questions covering common queries

---

## 📝 Content Recommendations

### Add More FAQ Questions:
```
Q: Where can I download free O-Level past papers in Sri Lanka?
A: StudyShare offers free O-Level past papers for all subjects...

Q: What is the best website for O-Level study materials?
A: StudyShare is a free platform with past papers, notes...

Q: How do I prepare for O-Level exams in Sri Lanka?
A: Download past papers and study notes from StudyShare...
```

### Blog/Articles (Future):
- "How to Prepare for O-Level Mathematics"
- "Top 10 Tips for O-Level Success"
- "O-Level 2025 Exam Timetable"

---

## 🔧 Technical Verification

After deploying, verify these URLs work:

- [ ] `https://studyshare.space/sitemap.xml`
- [ ] `https://studyshare.space/robots.txt`
- [ ] `https://studyshare.space/llms.txt`
- [ ] `https://studyshare.space/llms-full.txt`
- [ ] `https://studyshare.space/llms.json`
- [ ] `https://studyshare.space/.well-known/ai-plugin.json`

---

## 📈 Monitoring

### Weekly Check:
1. Google Search Console → Performance → Check impressions/clicks
2. Bing Webmaster → Search Performance
3. Search `site:sstudyshare.vercel.app` - count indexed pages

### Monthly Check:
1. Search key terms and check ranking position
2. Test AI assistants with relevant queries
3. Check new pages are being indexed

---

## 🚀 Quick Deploy Checklist

1. [ ] Deploy code changes to Vercel
2. [ ] Add `NEXT_PUBLIC_SITE_URL` to Vercel
3. [ ] Create OG image (`public/og-image.png`)
4. [ ] Register Google Search Console
5. [ ] Add `NEXT_PUBLIC_GOOGLE_VERIFICATION` to Vercel
6. [ ] Register Bing Webmaster
7. [ ] Add `NEXT_PUBLIC_BING_VERIFICATION` to Vercel
8. [ ] Re-deploy after adding verification codes
9. [ ] Submit sitemaps to both Google and Bing
10. [ ] Request indexing for main pages
11. [ ] Wait 1-2 weeks, then verify indexing

---

## 📞 Need Help?

If after 2 weeks you're still not indexed:
1. Check for crawl errors in Search Console
2. Ensure sitemap is accessible
3. Check robots.txt isn't blocking crawlers
4. Request manual review if needed

---

*Last Updated: January 2026*
