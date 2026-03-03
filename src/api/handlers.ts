import { http, HttpResponse } from 'msw';

const KLIPY_BASE_URL = 'https://api.klipy.com/api/v1/web';

export const handlers = [
  // Trending GIFs
  http.get('/api/gifs/trending', async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const perPage = url.searchParams.get('per_page') || '50';
    const locale = url.searchParams.get('locale') || 'en-US';

    try {
      const response = await fetch(
        `${KLIPY_BASE_URL}/common-trending?page=${page}&per_page=${perPage}&locale=${locale}`
      );
      const data = await response.json();
      return HttpResponse.json(data);
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to fetch trending GIFs' }, { status: 500 });
    }
  }),

  // Search GIFs
  http.get('/api/gifs/search', async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const page = url.searchParams.get('page') || '1';
    const perPage = url.searchParams.get('per_page') || '36';
    const locale = url.searchParams.get('locale') || 'en-US';

    try {
      const response = await fetch(
        `${KLIPY_BASE_URL}/gifs/search?q=${encodeURIComponent(query)}&locale=${locale}&page=${page}&per_page=${perPage}`
      );
      const data = await response.json();
      return HttpResponse.json(data);
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to search GIFs' }, { status: 500 });
    }
  }),
];