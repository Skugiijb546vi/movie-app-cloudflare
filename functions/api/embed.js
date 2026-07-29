export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type') || 'movie';
    const season = url.searchParams.get('season') || '1';
    const episode = url.searchParams.get('episode') || '1';
    
    let targetUrl;
    if (type === 'tv' || type === 'series') {
        targetUrl = 'https://movie-app-cloudflare.sarko-akram333.workers.dev/embed/tv/' + id + '/' + season + '/' + episode;
    } else {
        targetUrl = 'https://movie-app-cloudflare.sarko-akram333.workers.dev/embed/movie/' + id;
    }
    
    // Fetch vidzee content through our worker and return it
    const response = await fetch(targetUrl, {
        headers: {
            'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0'
        }
    });
    
    let html = await response.text();
    
    return new Response(html, {
        headers: {
            'content-type': 'text/html;charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
