export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type') || 'movie';
    const season = url.searchParams.get('season') || '1';
    const episode = url.searchParams.get('episode') || '1';
    
    let targetUrl = 'https://movie-app-cloudflare.sarko-akram333.workers.dev/embed/movie/' + id;
    if (type === 'tv' || type === 'series') {
        targetUrl = 'https://movie-app-cloudflare.sarko-akram333.workers.dev/embed/tv/' + id + '/' + season + '/' + episode;
    }
    
    return Response.redirect(targetUrl, 301);
}