// 教材への入口クリック。LP固有のdata-cta計測とは重複させない。2026-09-19
(function () {
    var RULES = [
        [/^https:\/\/rental-space\.net\/kyokasho\/ebay\/(?:index\.html)?(?:[?#]|$)/, 'lp_ebay'],
        [/^https:\/\/rental-space\.net\/kyokasho\/(?:index\.html)?(?:[?#]|$)/, 'lp_rental'],
        [/brain-market\.com\/u\/torano39\/a\/b4kTM0YjMgoTZsNWa0JXY/, 'brain_rental'],
        [/brain-market\.com\/u\/torano39\/a\/(?:b3gDOyYjMgoTZsNWa0JXY|bzczM1YjMgoTZsNWa0JXY)/, 'brain_ebay'],
        [/brmk\.io\/pqk3UP/, 'brain_ebay'],
        [/brain-market\.com/, 'brain_other'],
        [/note\.com\/rentalspace_kiku\/n\/ndfdf3142d99b/, 'note_rental'],
        [/note\.com\/cham_ebay\/n\/nb6672d9c3e10/, 'note_ebay'],
        [/rental-space\.net\/mail\/?/, 'mail_lp']
    ];
    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a || typeof gtag !== 'function' || a.hasAttribute('data-cta')) return;
        var href = a.href || '';
        for (var i = 0; i < RULES.length; i++) {
            if (RULES[i][0].test(href)) {
                var inBanner = !!a.closest('.kyokasho-banner, .kyokasho-banner-rensupe');
                var params = {
                    dest: RULES[i][1],
                    placement: inBanner ? 'banner' : 'body',
                    link_url: href.split(/[?#]/)[0],
                    page_location: location.origin + location.pathname,
                    transport_type: 'beacon'
                };
                gtag('event', 'kyokasho_click', params);
                var stages = {lp_rental:'rental_lp_click',lp_ebay:'ebay_lp_click',mail_lp:'mail_lp_click'};
                if (stages[params.dest]) gtag('event', stages[params.dest], params);
                return;
            }
        }
    }, true);
})();
// 流入元を覚えて、Stripeの購入リンクに client_reference_id として自動で付ける。
// お客さんには何も入力させない(9/27 大介さん)。Worker(kikurin-shop)が購入台帳の src 列に残す。2026-09-27
(function () {
    var KEY = 'kk_src', TTL = 30 * 24 * 3600 * 1000;
    var REF = [
        [/(^|\.)t\.co$|(^|\.)x\.com$|twitter\.com$/, 'x'], [/(^|\.)google\./, 'google'], [/(^|\.)yahoo\./, 'yahoo'],
        [/(^|\.)bing\.com$/, 'bing'], [/(^|\.)note\.com$/, 'note'], [/substack\.com$/, 'substack'],
        [/brain-market\.com$|brmk\.io$/, 'brain'], [/threads\.(net|com)$/, 'threads'], [/instagram\.com$/, 'instagram'],
        [/facebook\.com$/, 'facebook'], [/line\.me$/, 'line'], [/youtube\.com$/, 'youtube']
    ];
    function clean(v, n) { return String(v || '').replace(/[^A-Za-z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, n); }
    function read() {
        try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && Date.now() - v.t < TTL) return v; } catch (e) {}
        return null;
    }
    var q, land, touch = null;
    try {
        q = new URLSearchParams(location.search);
        land = clean(location.pathname.replace(/index\.html$/, '').replace(/\.html$/, '').split('/').filter(Boolean).pop() || 'home', 50);
        if (q.get('utm_source')) {
            touch = { s: clean(q.get('utm_source'), 20), m: clean(q.get('utm_medium'), 30), c: clean(q.get('utm_campaign'), 50) };
        } else if (q.get('gclid') || q.get('gbraid') || q.get('wbraid')) {
            touch = { s: 'google', m: 'cpc', c: '' };
        } else if (document.referrer) {
            var h = new URL(document.referrer).hostname.replace(/^www\./, '');
            if (h && h !== location.hostname) {
                var s = h;
                for (var i = 0; i < REF.length; i++) if (REF[i][0].test(h)) { s = REF[i][1]; break; }
                touch = { s: clean(s, 30), m: 'referral', c: '' };
            }
        }
        // 外から来たときだけ上書き(サイト内の移動・直接の再訪では、前の流入元を残す)
        if (touch) { touch.l = land; touch.t = Date.now(); localStorage.setItem(KEY, JSON.stringify(touch)); }
    } catch (e) {}
    function refId() {
        var v = read();
        return v ? clean([v.s, v.m, v.c, v.l].join('--'), 190) : 'direct';
    }
    function tag(a) {
        var href = a.getAttribute('href') || '';
        if (!/^https:\/\/buy\.stripe\.com\//.test(href)) return;
        var u = href.replace(/([?&])client_reference_id=[^&#]*&?/, '$1').replace(/[?&]$/, '');
        a.setAttribute('href', u + (u.indexOf('?') < 0 ? '?' : '&') + 'client_reference_id=' + encodeURIComponent(refId()));
    }
    function tagAll() { try { var as = document.querySelectorAll('a[href^="https://buy.stripe.com/"]'); for (var i = 0; i < as.length; i++) tag(as[i]); } catch (e) {} }
    function onPress(e) { var a = e.target && e.target.closest ? e.target.closest('a[href^="https://buy.stripe.com/"]') : null; if (a) tag(a); }
    document.addEventListener('click', onPress, true);
    document.addEventListener('auxclick', onPress, true);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tagAll); else tagAll();
})();
