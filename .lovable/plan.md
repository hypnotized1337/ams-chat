

## Plan: Upgrade AI Model & Show Model Name

### Changes

1. **`supabase/functions/summarize-changelog/index.ts`** — Change `model: 'google/gemini-2.5-flash-lite'` → `'google/gemini-2.5-flash'`

2. **`supabase/functions/summarize-features/index.ts`** — Change `model: 'google/gemini-2.5-flash-lite'` → `'google/gemini-2.5-flash'`

3. **`src/pages/Changelog.tsx`** (line 138) — Update the summary header text to include the model name: `ai summary · gemini-2.5-flash`

4. **`src/pages/Features.tsx`** (line 67) — Update the header text to: `ai-generated · gemini-2.5-flash`

5. **Clear cached summaries** — Delete rows from both `changelog_summaries` and `feature_summaries` tables so the new model regenerates them.

