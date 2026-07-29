export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type') || 'movie';
    const season = url.searchParams.get('season') || '1';
    const episode = url.searchParams.get('episode') || '1';
    
    let vidUrl = `https://vidlink.pro/${type}/${id}?primaryColor=f5c518&secondaryColor=1a1a1a&iconColor=f5c518&autoplay=true`;
    if (type === 'tv') {
        vidUrl = `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=f5c518&secondaryColor=1a1a1a&iconColor=f5c518&autoplay=true`;
    }

    const response = await fetch(vidUrl, {
        headers: {
            'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    let html = await response.text();
    
    // Inject base href so relative assets load from vidlink
    // Inject script to kill window.open (blocking all popup ads natively)
    html = html.replace('<head>', `<head>
        <base href="https://vidlink.pro">
        <script>
            window.open = function() { return null; };
            Object.freeze(window.open);
        </script>`);

    return new Response(html, {
        headers: { 
            'content-type': 'text/html;charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
