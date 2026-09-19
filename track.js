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
