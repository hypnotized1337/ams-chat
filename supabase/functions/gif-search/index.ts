const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { q, limit } = await req.json();
    if (!q || typeof q !== 'string' || q.length > 200) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('KLIPY_API_KEY');
    if (!apiKey) {
      console.error('KLIPY_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Not configured', results: [] }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const perPage = Math.min(Math.max(limit || 20, 8), 50);
    const url = `https://api.klipy.com/api/v1/${apiKey}/gifs/search?q=${encodeURIComponent(q)}&per_page=${perPage}&customer_id=anon&content_filter=high`;

    console.log('Fetching from Klipy:', url.replace(apiKey, 'REDACTED'));

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Klipy API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Response body:', errorText);
      return new Response(JSON.stringify({ results: [], error: `API error: ${response.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Klipy response structure:', JSON.stringify(data).substring(0, 500));

    if (!data || typeof data !== 'object') {
      console.error('Invalid response format from Klipy');
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let items = [];

    if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.data?.items && Array.isArray(data.data.items)) {
      items = data.data.items;
    } else if (data.results && Array.isArray(data.results)) {
      items = data.results;
    } else if (Array.isArray(data)) {
      items = data;
    }

    console.log('Found items count:', items.length);

    const results = items.map((item: any) => ({
      id: item.id || item.slug || Math.random().toString(36).substr(2, 9),
      url: item.formats?.md?.gif?.url || item.formats?.sm?.gif?.url || item.url || '',
      preview_url: item.formats?.xs?.gif?.url || item.formats?.sm?.gif?.url || item.preview_url || item.url || '',
      width: item.formats?.sm?.gif?.width || item.width || 200,
      height: item.formats?.sm?.gif?.height || item.height || 200,
    })).filter((r: any) => r.url);

    console.log('Returning results count:', results.length);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GIF search error:', err);
    return new Response(JSON.stringify({ error: 'Search failed', results: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
