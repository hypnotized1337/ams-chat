import { useState, useEffect } from 'react';
import { ArrowRight, Bookmark, X, Star } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

interface Bookmark {
  roomCode: string;
  username: string;
  savedAt: number;
}

interface JoinScreenProps {
  onJoin: (username: string, roomCode: string, importedMessages?: ChatMessage[]) => void;
}

const BOOKMARKS_KEY = 'chat_bookmarks';

function getBookmarks(): Bookmark[] {
  try {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: Bookmark[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomCode.trim()) {
      onJoin(username.trim(), roomCode.trim());
    }
  };

  const handleBookmarkJoin = (bookmark: Bookmark) => {
    setUsername(bookmark.username);
    setRoomCode(bookmark.roomCode);
    onJoin(bookmark.username, bookmark.roomCode);
  };

  const addBookmark = () => {
    if (!username.trim() || !roomCode.trim()) return;
    
    const exists = bookmarks.some(b => b.roomCode === roomCode.trim() && b.username === username.trim());
    if (exists) return;

    const newBookmark: Bookmark = {
      roomCode: roomCode.trim(),
      username: username.trim(),
      savedAt: Date.now(),
    };

    const updated = [newBookmark, ...bookmarks].slice(0, 10); // Keep max 10 bookmarks
    saveBookmarks(updated);
    setBookmarks(updated);
    setShowBookmarkInput(false);
  };

  const removeBookmark = (roomCode: string, username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarks.filter(b => !(b.roomCode === roomCode && b.username === username));
    saveBookmarks(updated);
    setBookmarks(updated);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        <form onSubmit={handleJoin} className="space-y-5">
          <div className="text-center mb-6">
            <h1 className="text-lg font-medium text-foreground tracking-tight">Join a room</h1>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="w-full bg-input rounded-md py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
              maxLength={20}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Room code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              className="w-full bg-input rounded-md py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
              maxLength={30}
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!username.trim() || !roomCode.trim()}
              className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Join
              <ArrowRight className="w-4 h-4" />
            </button>
            {username.trim() && roomCode.trim() && (
              <button
                type="button"
                onClick={addBookmark}
                className="px-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                title="Save as bookmark"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {bookmarks.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Saved Rooms</span>
            </div>
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <div
                  key={`${bookmark.roomCode}-${bookmark.username}`}
                  onClick={() => handleBookmarkJoin(bookmark)}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-md cursor-pointer hover:bg-secondary transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{bookmark.roomCode}</div>
                    <div className="text-xs text-muted-foreground truncate">as {bookmark.username}</div>
                  </div>
                  <button
                    onClick={(e) => removeBookmark(bookmark.roomCode, bookmark.username, e)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all"
                    title="Remove bookmark"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
