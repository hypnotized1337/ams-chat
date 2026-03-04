

## Plan: Admin Authentication, GIF Integration & Cleanup

### 1. Secure Admin Authentication

**Current state:** Admin access is gated by `isRoomCreator` (first joiner). The request requires a master password system with server-side verification.

**Changes:**

- **Store `ADMIN_MASTER_KEY` as a backend secret** using the secrets tool. This is a private key, never exposed to the client.
- **Create `verify-admin` edge function** (`supabase/functions/verify-admin/index.ts`):
  - Accepts `{ password: string }` via POST.
  - Compares against `ADMIN_MASTER_KEY` secret (constant-time comparison).
  - Returns `{ valid: true/false }`.
  - No JWT required (unauthenticated users need to prove admin status).
- **New `AdminAuthOverlay` component** — terminal-style password prompt (black bg, white monospace input, blinking cursor aesthetic). Shown when `/admin` is typed and user is not yet authenticated.
- **`sessionStorage`** stores `is_admin = true` on successful auth. Checked before opening the admin panel; persists across rooms within the same browser session.
- **Update `Index.tsx`**: Remove the `isRoomCreator` gate. Instead: `/admin` → check `sessionStorage` → if not authed, show `AdminAuthOverlay` → on success, open `AdminPanel`.
- **Remove `isRoomCreator`** from `ChatState`, `use-chat.ts`, and `types/chat.ts` (no longer needed).

**Security note:** The master key is verified server-side. `sessionStorage` is a UI convenience only — destructive actions (nuke/freeze) already broadcast via Realtime which has no persistence, so frontend-only gating is acceptable for this ephemeral architecture.

### 2. GIF Integration (Giphy API)

**Requires:** `GIPHY_API_KEY` stored as a backend secret.

- **Create `giphy-search` edge function** (`supabase/functions/giphy-search/index.ts`):
  - Accepts `{ q: string, limit?: number }` via POST.
  - Proxies to Giphy Search API using the server-side key.
  - Returns array of `{ id, url, preview_url, width, height }`.
  - No JWT required (public feature).
- **New `GifPicker` component**: Monochromatic modal/popover triggered by a GIF icon button next to the `+` (image upload) button in the chat input area.
  - Search input at top, grid of results below.
  - All GIF thumbnails rendered with `grayscale(100%)` filter, full color on hover, 1px `border-white/20`.
  - Clicking a GIF sends it as a message with `imageUrl` pointing to the Giphy URL and `imageExpiry` set to 12 hours from now (same purge logic as uploaded images).
- **Update `ChatArea.tsx`**: Add GIF button in the input row. Wire `GifPicker` selection to `onSend` or a new `onSendGif` handler that creates a message with the GIF URL.
- **Update `use-chat.ts`**: Add `sendGif(url)` that creates a `ChatMessage` with `imageUrl` and `imageExpiry`, broadcasts it.

### 3. Cleanup

- **Remove `exportHistory`** from `use-chat.ts` (dead code, "Download Chat" already removed from UI).
- **Remove unused `ChatMessage` import** from `JoinScreen.tsx` and clean up the `onJoin` signature (remove `importedMessages` param if unused elsewhere).

### Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/verify-admin/index.ts` | Create |
| `supabase/functions/giphy-search/index.ts` | Create |
| `src/components/AdminAuthOverlay.tsx` | Create |
| `src/components/GifPicker.tsx` | Create |
| `src/components/ChatArea.tsx` | Add GIF button, wire GifPicker |
| `src/hooks/use-chat.ts` | Add `sendGif`, remove `exportHistory`, remove `isRoomCreator` |
| `src/types/chat.ts` | Remove `isRoomCreator` from `ChatState` |
| `src/pages/Index.tsx` | Replace creator gate with sessionStorage admin auth flow |
| `src/components/JoinScreen.tsx` | Remove unused `ChatMessage` import |
| `supabase/config.toml` | Add `verify_jwt = false` for both new functions |

### Secret Setup Order

Two secrets need to be configured before implementation:
1. **`ADMIN_MASTER_KEY`** — the master admin password
2. **`GIPHY_API_KEY`** — obtained from [developers.giphy.com](https://developers.giphy.com)

