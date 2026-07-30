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
    
    // NUCLEAR AD BLOCKER - inject before everything else
    const adBlocker = `
    <base href="https://vidlink.pro">
    <script>
    // ========== NUCLEAR AD BLOCKER ==========
    
    // 1. Kill ALL popups
    window.open = function() { return null; };
    Object.defineProperty(window, 'open', { value: function(){return null}, writable: false, configurable: false });
    
    // 2. Block ad domains at fetch/XHR level
    const AD_DOMAINS = [
        'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
        'adservice.google', 'ads.google', 'pagead2.googlesyndication',
        'mc.yandex.ru', 'yandex.ru/metrika', 'googletagmanager.com',
        'google-analytics.com', 'facebook.net', 'facebook.com/tr',
        'cdn.jwplayer.com', 'jwpcdn.com',
        'popads.net', 'popcash.net', 'propellerads.com', 'revcontent.com',
        'taboola.com', 'outbrain.com', 'mgid.com',
        'exoclick.com', 'juicyads.com', 'trafficjunky.com',
        'hilltopads.com', 'clickadu.com', 'adsterra.com', 'a-ads.com',
        'richads.com', 'pushground.com', 'evadav.com',
        'ad.plus', 'adnium.com', 'adskeeper.com',
        'bidvertiser.com', 'clickaine.com',
        'syndication.', 'serving-sys.com', 'rubiconproject.com',
        'pubmatic.com', 'openx.net', 'casalemedia.com',
        'amazon-adsystem.com', 'criteo.', 'smartadserver.',
        'moatads.com', 'doubleverify.com', 'adsafeprotected.com',
        'sb-cd.com', 'sb.scorecardresearch.com',
        'viglink.com', 'skimresources.com',
        'mixpanel.com', 'amplitude.com', 'segment.io',
        'hotjar.com', 'mouseflow.com', 'crazyegg.com',
        'adf.ly', 'shorte.st', 'linkvertise.com',
        'disqus.com/embed/ads', 'nativeads.',
        'waust.at', 'trminnqkg.com', 'felhfrwijk.com',
        'antiadblock.', 'blockadblock.',
        'gstatic.com/adsense', 'pagead',
        'prebid', 'headerbid',
        'stickyadstv', 'spotx', 'springserve',
        'ad-delivery', 'ad-provider', 'ad-score',
        '/ads/', '/ad/', '/adserver/', '/adx/',
        'banner', 'popunder', 'interstitial'
    ];
    
    function isAdUrl(url) {
        if (!url) return false;
        const lower = url.toLowerCase();
        return AD_DOMAINS.some(d => lower.includes(d));
    }
    
    // Override fetch
    const origFetch = window.fetch;
    window.fetch = function(url, opts) {
        if (typeof url === 'string' && isAdUrl(url)) return Promise.resolve(new Response('', {status: 200}));
        if (url && url.url && isAdUrl(url.url)) return Promise.resolve(new Response('', {status: 200}));
        return origFetch.apply(this, arguments);
    };
    
    // Override XMLHttpRequest
    const origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (isAdUrl(url)) { this._blocked = true; return; }
        return origXHROpen.apply(this, arguments);
    };
    const origXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        if (this._blocked) return;
        return origXHRSend.apply(this, arguments);
    };
    
    // 3. Block script injection
    const origCreateElement = document.createElement.bind(document);
    document.createElement = function(tag) {
        const el = origCreateElement(tag);
        if (tag.toLowerCase() === 'script') {
            const origSetAttr = el.setAttribute.bind(el);
            el.setAttribute = function(name, val) {
                if (name === 'src' && isAdUrl(val)) return;
                return origSetAttr(name, val);
            };
            Object.defineProperty(el, 'src', {
                set: function(v) { if (!isAdUrl(v)) origSetAttr('src', v); },
                get: function() { return el.getAttribute('src'); }
            });
        }
        if (tag.toLowerCase() === 'iframe') {
            Object.defineProperty(el, 'src', {
                set: function(v) { if (!isAdUrl(v)) el.setAttribute('src', v); },
                get: function() { return el.getAttribute('src'); }
            });
        }
        return el;
    };
    
    // 4. Block event listeners that might open ads
    const origAddEvent = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, fn, opts) {
        if (type === 'click' && this === document) return;
        if (type === 'mousedown' && this === document) return;
        if (type === 'pointerdown' && this === document) return;
        return origAddEvent.call(this, type, fn, opts);
    };
    
    // 5. Continuous DOM cleaner
    function cleanAds() {
        // Remove ad iframes
        document.querySelectorAll('iframe').forEach(f => {
            const src = f.src || f.getAttribute('src') || '';
            if (isAdUrl(src) || f.style.display === 'none' || f.width == 0 || f.height == 0) {
                f.remove();
            }
        });
        // Remove ad divs (common patterns)
        document.querySelectorAll('[id*="ad"],[id*="Ad"],[id*="banner"],[class*="ad-"],[class*="ad_"],[class*="ads-"],[class*="popup"],[class*="overlay"],[class*="modal"]').forEach(el => {
            // Don't remove the actual video player elements
            if (el.querySelector('video') || el.classList.contains('plyr') || el.id === 'player') return;
            if (el.offsetWidth > 0 && el.offsetHeight > 0 && !el.querySelector('video')) {
                const rect = el.getBoundingClientRect();
                // Remove if it looks like an overlay
                if (el.style.position === 'fixed' || el.style.position === 'absolute' || 
                    el.style.zIndex > 100 || window.getComputedStyle(el).zIndex > 100) {
                    el.remove();
                }
            }
        });
        // Remove fixed position overlays that block the player
        document.querySelectorAll('div[style*="position: fixed"], div[style*="position:fixed"]').forEach(el => {
            if (!el.querySelector('video') && !el.classList.contains('plyr')) {
                el.remove();
            }
        });
        // Remove elements with high z-index that might be overlays
        document.querySelectorAll('div, section, aside').forEach(el => {
            const z = parseInt(window.getComputedStyle(el).zIndex);
            if (z > 9000 && !el.querySelector('video') && !el.classList.contains('plyr')) {
                el.remove();
            }
        });
    }
    
    // Run cleaner on DOM changes
    const observer = new MutationObserver(cleanAds);
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
        cleanAds();
        setInterval(cleanAds, 1000);
    });
    
    // 6. Block navigation away (ad redirects)
    window.addEventListener('beforeunload', (e) => { e.preventDefault(); });
    
    // 7. Neuter ad-related globals
    window.ga = function(){};
    window.gtag = function(){};
    window.__gads = undefined;
    window._gaq = { push: function(){} };
    window.adsbygoogle = { push: function(){} };
    
    console.log('[SEBAR TV] Ad blocker active');
    </script>
    <style>
        /* Hide any remaining ad elements */
        [id*="google_ads"], [id*="aswift"], [class*="adsbygoogle"],
        [id*="ad-"], [id*="ad_"], [class*="ad-container"],
        [class*="popup"], [class*="overlay"]:not(.plyr__overlay),
        [data-ad], [data-ads], ins.adsbygoogle,
        div[style*="z-index: 9999"], div[style*="z-index:9999"],
        div[style*="z-index: 99999"], div[style*="z-index:99999"],
        .ad, .ads, .advert, .advertisement {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
        }
        /* Make sure the player stays visible */
        video, .plyr, #player, .jw-wrapper {
            display: block !important;
            visibility: visible !important;
        }
    </style>
    `;
    
    html = html.replace('<head>', '<head>' + adBlocker);

    return new Response(html, {
        headers: { 
            'content-type': 'text/html;charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
