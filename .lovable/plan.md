

## Plan: Personalized Quick Reactions

Track which emojis each user selects and use the top 5 most-used as their quick reaction row, falling back to defaults for new users.

### Implementation

**1. Create `src/hooks/use-frequent-reactions.ts`**
- Read/write a `Record<string, number>` (emoji → use count) from `localStorage` keyed by `v0id-reaction-freq`
- Export `useFrequentReactions()` returning `{ quickReactions: string[], recordReaction: (emoji: string) => void }`
- `quickReactions` returns top 5 by count, falling back to `['✓', '✗', '⚡', '👁', '🔥']` when fewer than 5 have been used
- `recordReaction` increments the count and persists

**2. Update `src/components/chat/ReactionPicker.tsx`**
- Import and use `useFrequentReactions()`
- Replace hardcoded `QUICK_REACTIONS` with `quickReactions` from the hook
- Call `recordReaction(emoji)` in both the quick-pick handler and the `handlePick` (expanded picker) handler
- Also update the "Frequently Used" section in the popover to reflect user's personal history (top 12)

**3. Update `src/components/chat/MessageBubble.tsx`**
- The double-tap react (`onDoubleClick → '⚡'`) should also call `recordReaction('⚡')` — pass `recordReaction` down or have the hook used there too

### Files
| File | Change |
|---|---|
| `src/hooks/use-frequent-reactions.ts` | New hook — localStorage-backed emoji frequency tracker |
| `src/components/chat/ReactionPicker.tsx` | Use hook for quick row + frequently used section |
| `src/components/chat/MessageBubble.tsx` | Record double-tap reactions |

