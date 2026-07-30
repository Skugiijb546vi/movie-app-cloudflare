export async function onRequest(context) {
    const url = new URL(context.request.url);
    
    if (url.pathname.startsWith('/vidsrc/')) {
        const targetPath = url.pathname.replace('/vidsrc', '');
        const targetUrl = new URL(targetPath + url.search, 'https://vidsrc.me');
        
        const newReq = new Request(targetUrl, context.request);
        newReq.headers.set('Host', 'vidsrc.me');
        newReq.headers.set('Referer', 'https://vidsrc.me/');
        
        const response = await fetch(newReq);
        
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            let html = await response.text();
            
            // Aggressive ad removal
            html = html.replace(/<script[^>]*?>.*?<\/script>/gi, (match) => {
                const lower = match.toLowerCase();
                if (lower.includes('popunder') || lower.includes('ad720') || lower.includes('ad_container') || lower.includes('ads')) {
                    return '';
                }
                return match;
            });
            
            // Rewrite absolute URLs
            html = html.replace(/https:\/\/vidsrc\.me/g, url.origin + '/vidsrc');
            
            // Rewrite relative URLs
            html = html.replace(/(src|href)=["']\/([^"']+)["']/gi, `$1="${url.origin}/vidsrc/$2"`);
            
            // Rewrite AJAX / fetch calls in inline JS
            html = html.replace(/url:\s*['"]\/([^'"]+)['"]/g, `url: "${url.origin}/vidsrc/$1"`);
            html = html.replace(/fetch\(['"]\/([^'"]+)['"]/g, `fetch("${url.origin}/vidsrc/$1"`);

            return new Response(html, { headers: response.headers });
        }
        
        return response;
    }
    
    // Fallback for vidlink proxy if needed, but we don't need it.
    return context.env.ASSETS.fetch(context.request);
}
