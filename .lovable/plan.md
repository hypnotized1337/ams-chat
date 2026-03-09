

## Two Features: Link Previews + Page Transitions

### 1. Smooth Page Transitions (Join Screen → Chat)

Currently `Index.tsx` uses a hard conditional (`if (!state.isJoined) return <JoinScreen />`). Wrap both views in `AnimatePresence` with `mode="wait"` so the join screen fades/scales out before the chat view fades in.

**File: `src/pages/Index.tsx`**
- Import `motion, AnimatePresence` from framer-motion
- Replace the early return pattern with a single return containing `AnimatePresence mode="wait"`
- JoinScreen exit: fade out + slight scale down + blur (0.3s)
- Chat view enter: fade in + slight scale up from 0.98 (0.4s)
- Use a `key` prop (`"join"` vs `"chat"`) so AnimatePresence detects the swap

### 2. Link Previews (Open Graph Cards)

When a message contains a URL, render a small preview card below the message text showing the page title, description, and optional image.

**New edge function: `supabase/functions/og-metadata/index.ts`**
- Accepts `{ url: string }` in the body
- Fetches the URL HTML (with a 3s timeout), parses `<meta property="og:title">`, `og:description`, `og:image` using regex (no DOM parser needed in Deno)
- Returns `{ title, description, image }` or `{ error }`
- CORS headers included

**New component: `src/components/chat/LinkPreview.tsx`**
- Takes a `url` string prop
- On mount, calls the edge function via `supabase.functions.invoke('og-metadata', { body: { url } })`
- Shows a skeleton loader while fetching, then renders a compact card (thumbnail left, title + description right, clickable)
- Caches results in a module-level `Map<string, OGData>` to avoid re-fetching
- Styling: `bg-muted/30 border border-border/20 rounded-lg` — fits the monochrome void aesthetic
- If fetch fails or no OG data, renders nothing (graceful fallback)

**Modified: `src/components/chat/MessageBubble.tsx`**
- Import `LinkPreview`
- In `renderMessageText`, collect the first URL found
- After rendering the text, if a URL exists and it's not a GIF/image, render `<LinkPreview url={firstUrl} />` below the text inside the bubble

### Files Changed
- `src/pages/Index.tsx` — AnimatePresence wrapper
- `src/components/chat/MessageBubble.tsx` — render LinkPreview for first URL
- `src/components/chat/LinkPreview.tsx` — new component
- `supabase/functions/og-metadata/index.ts` — new edge function

