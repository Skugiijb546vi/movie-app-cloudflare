export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const tmdb = url.searchParams.get('tmdb');
    const type = url.searchParams.get('type') || 'movie';
    const season = url.searchParams.get('s') || 1;
    const episode = url.searchParams.get('e') || 1;

    if (!tmdb) {
        return new Response(JSON.stringify({ error: "No TMDB ID provided" }), { status: 400 });
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        // Red Team Vidsrc Extraction Strategy
        // 1. Fetch the main embed page
        let vidsrcUrl = `https://vidsrc.me/embed/movie?tmdb=${tmdb}`;
        if (type === 'tv') {
            vidsrcUrl = `https://vidsrc.me/embed/tv?tmdb=${tmdb}&season=${season}&episode=${episode}`;
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Referer': 'https://vidsrc.me/'
        };

        const res = await fetch(vidsrcUrl, { headers });
        const html = await res.text();

        // 2. Look for the iframe src (rcp)
        const iframeMatch = html.match(/<iframe[^>]+src="([^"]+rcp[^"]+)"/i);
        
        let m3u8_link = "";

        if (iframeMatch) {
            const iframeUrl = iframeMatch[1].startsWith('//') ? 'https:' + iframeMatch[1] : iframeMatch[1];
            const rcpRes = await fetch(iframeUrl, { headers });
            const rcpHtml = await rcpRes.text();

            // 3. Extract the hidden encoded hash
            const hashMatch = rcpHtml.match(/data-hash="([^"]+)"/i) || rcpHtml.match(/data-file="([^"]+)"/i);
            if (hashMatch) {
                const encodedData = hashMatch[1];
                // 4. Decode the Base64/Obfuscated string
                // Note: Vidsrc constantly changes their AES key and string reversal logic. 
                // This is a generalized decryption wrapper.
                try {
                    let decoded = atob(encodedData);
                    // If it contains a direct m3u8, we got it. If it requires AES, we'd apply the key here.
                    if (decoded.includes('.m3u8')) {
                        m3u8_link = decoded.match(/(https:\/\/[^\s"'<]+m3u8)/i)?.[1] || decoded;
                    }
                } catch (e) {
                    console.log("Decryption failed", e);
                }
            }
        }

        // Fallback: Use a known public raw stream API if our Vidsrc extraction fails 
        // (because Vidsrc keys change daily)
        if (!m3u8_link || !m3u8_link.includes('.m3u8')) {
            // HACK: Fallback to an alternative raw stream provider if vidsrc bypass fails today
            const fallbackApi = `https://moviesapi.club/movie/${tmdb}`; 
            // In a real Red Team scenario, you'd integrate the Consumet API or FlixHQ scraper here
            m3u8_link = `https://vidsrc.net/embed/movie?tmdb=${tmdb}`; // Fallback iframe if no m3u8 found
        }

        return new Response(JSON.stringify({ 
            success: true, 
            stream_url: m3u8_link,
            is_raw_m3u8: m3u8_link.includes('.m3u8')
        }), { headers: corsHeaders, status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { headers: corsHeaders, status: 500 });
    }
}
