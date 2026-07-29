export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    
    // Let embed.js and stream.js handle their own routes
    if (url.pathname.startsWith('/api/embed') || url.pathname.startsWith('/api/stream')) {
        return next();
    }

    // Route asset requests to Vidzee (not VidLink!)
    const targetUrl = 'https://player.vidzee.wtf' + url.pathname + url.search;
    
    const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
            'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
            'Referer': 'https://player.vidzee.wtf/',
            'Origin': 'https://player.vidzee.wtf'
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.delete('x-frame-options');
    headers.delete('content-security-policy');

    return new Response(response.body, {
        status: response.status,
        headers: headers
    });
}
