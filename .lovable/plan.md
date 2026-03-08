

## Plan: Unread Marker Visibility + Bug Fixes

### 1. Make Unread Messages Divider Brighter

**File:** `src/components/ChatArea.tsx` (lines 312-317)

Current: uses `bg-destructive/40` and `text-destructive/60` — in this monochrome theme, destructive is a dim gray (`0 0% 35%`), making the divider nearly invisible.

Change to bright white styling:
- Line dividers: `bg-foreground/70` (bright white lines)
- Text: `text-foreground font-semibold` (bold white "new messages" label)

### 2. Fix: ImageAttachment ref warning

**Console error:** `Function components cannot be given refs` on `ImageAttachment` inside the Tooltip/ContextMenu tree. Radix passes refs to trigger children.

**File:** `src/components/chat/ImageAttachment.tsx`
- Wrap with `forwardRef` so Radix can attach its ref without warnings.

### 3. Fix: Reaction `users.includes(msg.username)` check is wrong

**File:** `src/components/chat/MessageBubble.tsx` (line 256)

The highlight check `users.includes(msg.username)` checks if the **message author** reacted, not the **current user**. This means your own reactions won't highlight correctly on other people's messages.

Fix: Pass `currentUser` into `MessageBubble` props (it's already available as `isOwn` derives from it, but we need the actual string). Actually — looking at the props, `isOwn` is passed but `currentUser` is not. Need to either:
- Add `currentUser` prop to MessageBubble, or
- Use a different approach: check `isOwn ? msg.username : ...` — wait, we need the current username regardless.

**Files:** 
- `src/components/ChatArea.tsx` — pass `currentUser` to MessageBubble
- `src/components/chat/MessageBubble.tsx` — accept `currentUser` prop, use it in reaction highlight check

### Summary

| File | Change |
|---|---|
| `src/components/ChatArea.tsx` | Brighten unread divider; pass `currentUser` to MessageBubble |
| `src/components/chat/MessageBubble.tsx` | Add `currentUser` prop; fix reaction highlight to check current user not msg author |
| `src/components/chat/ImageAttachment.tsx` | Wrap with `forwardRef` to fix console warning |

