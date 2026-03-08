

## Plan: Add `isGif` flag for accurate GIF notification detection

### Problem
GIF messages use `imageUrl` but the URL-based heuristic (`tenor.com`, `giphy.com`) fails because the URLs are likely proxied or transformed. So the notification falls through to "sent a photo".

### Solution
Add an `isGif: boolean` property to `ChatMessage` and set it `true` in `sendGif`. Use this flag in the notification logic instead of URL sniffing.

### Changes

| File | Change |
|---|---|
| `src/types/chat.ts` | Add `isGif?: boolean` to `ChatMessage` interface |
| `src/hooks/use-chat.ts` | Set `isGif: true` in `sendGif()` message object. Simplify notification logic: check `msg.isGif` instead of URL heuristic |

### Notification logic becomes:
```
if (msg.isGif) → "sent a GIF"
else if (msg.imageUrl) → "sent a photo"
else if (msg.fileUrl) → "sent a file"
...
```

