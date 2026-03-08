

## Plan: Brighten Changelog Button + AI Commit Summarization

### 1. Make Changelog Link More Visible on Join Screen

**File:** `src/components/JoinScreen.tsx` (line 193)

Current: `text-[9px] text-muted-foreground/50` — nearly invisible.

Change to: `text-[10px] text-muted-foreground/80 hover:text-foreground` with a small `GitCommit` icon prefix. Keep same location (bottom of form).

### 2. Create Edge Function for AI Summarization

**File:** `supabase/functions/summarize-changelog/index.ts`

- Accepts an array of commit messages
- Calls Lovable AI gateway with `google/gemini-2.5-flash-lite` (cheapest model)
- System prompt: "Summarize these git commits into a concise, grouped changelog. Use categories like Added, Fixed, Changed, Improved. Be brief."
- Returns the summary text (non-streaming, simple invoke)

### 3. Add "Summarize with AI" Button to `/changelog` Page

**File:** `src/pages/Changelog.tsx`

- Add a "summarize with ai" button next to the title
- On click, send all commit messages to the edge function
- Show loading state, then render the AI summary in a styled card above the commit list
- Summary can be dismissed/collapsed

### Files

| File | Change |
|---|---|
| `src/components/JoinScreen.tsx` | Brighten changelog link text + add icon |
| `supabase/functions/summarize-changelog/index.ts` | New edge function using Lovable AI (gemini-2.5-flash-lite) |
| `src/pages/Changelog.tsx` | Add "summarize with ai" button + summary display |

