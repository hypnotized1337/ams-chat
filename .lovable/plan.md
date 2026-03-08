

## Plan: Improve Notification Content

Currently, notifications are bare-bones — just the username as title and raw `msg.text` as body. This is unhelpful for images, files, GIFs, replies, and empty text messages.

### Changes (single file: `src/hooks/use-chat.ts`)

Replace the simple `new Notification(msg.username, { body: msg.text })` with smarter content:

1. **Title**: `"msg.username in roomCode"` — so the user knows which room the message is from
2. **Body logic** based on message content:
   - Has `imageUrl` → `"Sent a photo"`
   - Has `fileUrl` → `"Sent a file: fileName"`
   - Has `text` starting with `https://media.tenor.com` or similar GIF URL → `"Sent a GIF"`
   - Has `replyTo` → `"Replying to replyTo.username: text"` (truncated)
   - Plain text → truncate to ~100 chars with ellipsis
   - Empty/deleted → `"Sent a message"`
3. **Tag**: Use `roomCode` as the notification tag so multiple messages from the same room replace each other instead of stacking
4. **Icon**: Use `/favicon.ico`

This is a small, single-location change with no structural impact.

