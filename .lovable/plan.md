

## Plan: Code Cleanup, Optimizations & Message Link Sharing

### 1. New Feature: Message Link Previews
When a user pastes a URL in their message, render it as a clickable link with proper styling (underline, external icon) rather than plain text. Simple but impactful — currently URLs are just flat text in bubbles.

**File:** `src/components/chat/MessageBubble.tsx`
- Add a `renderMessageText` helper that detects URLs via regex and wraps them in `<a>` tags with `target="_blank"`, styled with underline + subtle external-link indicator
- Apply to the `{msg.text}` render in the bubble

### 2. Performance: Deduplicate `useFrequentReactions` instances
Every `MessageBubble` creates its own `useFrequentReactions` hook instance, each reading localStorage independently. This is wasteful with many messages on screen.

**Files:**
- `src/components/ChatArea.tsx` — call `useFrequentReactions()` once, pass `recordReaction` down to `MessageBubble`
- `src/components/chat/MessageBubble.tsx` — accept `recordReaction` as a prop, remove local `useFrequentReactions` import
- `src/components/chat/ReactionPicker.tsx` — already accepts `recordReaction` as optional prop; will always receive it now, remove its own `useFrequentReactions` call and make the prop required

### 3. Performance: Throttle `SelfDestructTimer` updates
Each `SelfDestructTimer` runs its own `setInterval(1000)`. With 50 messages visible, that's 50 timers. Instead, use a shared "tick" approach.

**Files:**
- Create `src/hooks/use-tick.ts` — a single shared interval that increments a counter every second, exported as `useTick()` returning `Date.now()` (rounded to second). Uses a module-level interval + listeners pattern so only one `setInterval` exists.
- `src/components/chat/SelfDestructTimer.tsx` — replace local `useState`/`useEffect` interval with `useTick()`

### 4. Cleanup: Remove dead/duplicate code
- `src/hooks/use-chat.ts` line 186: remove blank line
- `src/components/ChatArea.tsx` line 212: remove blank line  
- `src/components/chat/ReactionPicker.tsx` line 73: `FREQUENTLY_USED` constant is never used (replaced by `frequentlyUsed` from hook) — remove it
- `src/components/chat/ReactionPicker.tsx`: remove the optional `recordReaction` prop fallback logic — simplify to always receive it as required

### 5. Cleanup: Memoize message grouping computation
Currently `ChatArea` recomputes `isFirstInGroup`/`isLastInGroup` inline in the render loop on every render.

**File:** `src/components/ChatArea.tsx`
- Extract message grouping into a `useMemo` that produces an array of `{ msg, groupInfo }` keyed on `messages`

### Summary

| File | Change |
|---|---|
| `src/hooks/use-tick.ts` | New — shared 1s tick for all timers |
| `src/components/chat/SelfDestructTimer.tsx` | Use shared tick instead of per-instance interval |
| `src/components/chat/MessageBubble.tsx` | Accept `recordReaction` prop, add URL linkification |
| `src/components/chat/ReactionPicker.tsx` | Remove unused `FREQUENTLY_USED`, make `recordReaction` required, remove internal hook |
| `src/components/ChatArea.tsx` | Call `useFrequentReactions` once, memoize grouping, pass `recordReaction` down |
| `src/hooks/use-chat.ts` | Remove blank line |

