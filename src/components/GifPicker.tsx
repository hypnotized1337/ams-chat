import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string, previewUrl: string) => void;
}

interface GifData {
  id: string;
  title: string;
  images: {
    original: { url: string };
    preview: { url: string };
  };
}

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchGifs = async (searchTerm: string, pageNum: number) => {
    setLoading(true);
    try {
      const endpoint = searchTerm 
        ? `/api/gifs/search?q=${encodeURIComponent(searchTerm)}&page=${pageNum}&per_page=36`
        : `/api/gifs/trending?page=${pageNum}&per_page=50`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const formatted = data.data.map((gif: any) => ({
          id: gif.id,
          title: gif.title || 'GIF',
          images: {
            original: { url: gif.images?.original?.url || gif.url },
            preview: { url: gif.images?.preview?.url || gif.images?.preview_gif?.url || gif.url },
          },
        }));
        
        if (pageNum === 1) {
          setGifs(formatted);
        } else {
          setGifs(prev => [...prev, ...formatted]);
        }
        setHasMore(formatted.length > 0);
      }
    } catch (error) {
      console.error('Failed to fetch GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGifs('', 1);
    }
  }, [open]);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchGifs(search, 1);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search]);

  const handleSelect = (gif: GifData) => {
    onSelect(gif.images.original.url, gif.images.preview.url);
    onClose();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100 && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGifs(search, nextPage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a GIF</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GIFs..."
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-80" onScroll={handleScroll}>
            <div className="grid grid-cols-2 gap-2 p-1">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif)}
                  className="aspect-video rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img
                    src={gif.images.preview.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && gifs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No GIFs found
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}