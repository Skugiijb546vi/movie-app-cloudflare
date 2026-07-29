export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const targetUrl = `https://vidlink.pro/_next${url.pathname.replace('/_next', '')}${url.search}`;
    
    const response = await fetch(targetUrl, {
        headers: {
            'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0'
        }
    });

    return new Response(response.body, {
        status: response.status,
        headers: response.headers
    });
}
