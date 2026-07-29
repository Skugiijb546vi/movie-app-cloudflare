export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    
    // Do not proxy if it's embed or stream
    if (url.pathname.startsWith('/api/embed') || url.pathname.startsWith('/api/stream')) {
        return next();
    }

    const targetUrl = `https://vidlink.pro${url.pathname}${url.search}`;
    
    const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
            'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0'
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });

    return new Response(response.body, {
        status: response.status,
        headers: response.headers
    });
}
