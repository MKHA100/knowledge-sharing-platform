# Database Migration Required - Fix "anon_name" Error

## ❌ Current Error

```
column users_1.anon_name does not exist
```

The API is trying to access `anon_name` and `anon_avatar_seed` columns in the `users` table, but these columns don't exist in your database yet.

## ✅ Solution

You need to run the migration file that adds these columns to your database.

### Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://supabase.com/dashboard
   - Navigate to SQL Editor (left sidebar)

2. **Run the Migration**
   - Click "New Query"
   - Copy and paste the entire content from this file:
     ```
     database/migrations/006_add_user_anonymization.sql
     ```
   - Click "Run" button

3. **Verify the Migration**
   - Run this query to check if columns were added:
     ```sql
     SELECT anon_name, anon_avatar_seed 
     FROM users 
     LIMIT 5;
     ```
   - You should see results with anonymous names like "Clever Panda", "Wise Owl", etc.

4. **Restart Your Development Server**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

## What This Migration Does

The migration adds user anonymization features:

- **`anon_name`** column: Stores anonymous display names (e.g., "Clever Panda")
- **`anon_avatar_seed`** column: Stores a number (1-100) for generating consistent avatars
- **`generate_anon_name()`** function: Randomly generates names from 20 adjectives + 20 animals
- **Trigger**: Automatically generates anonymous names for new users
- **Indexes**: Improves query performance

This allows users to remain anonymous when their documents are viewed publicly, showing "Clever Panda" instead of their real name.

## After Running the Migration

Your API should work correctly and the error will be resolved. The `/api/documents` endpoint will return anonymous names for uploaders instead of real names.

---

**Need help?** The migration file is located at:
`database/migrations/006_add_user_anonymization.sql`
