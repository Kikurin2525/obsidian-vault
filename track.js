// 教科書リンクのクリック計測(GA4 kyokasho_click)。計測のみ・表示は変えない。2026-09-05
(function () {
    var RULES = [
        [/brain-market\.com\/u\/torano39\/a\/b4kTM0YjMgoTZsNWa0JXY/, 'brain_rental'],
        [/brain-market\.com\/u\/torano39\/a\/b3gDOyYjMgoTZsNWa0JXY/, 'brain_ebay'],
        [/brmk\.io\/pqk3UP/, 'brain_ebay'],
        [/brain-market\.com/, 'brain_other'],
        [/note\.com\/rentalspace_kiku\/n\/ndfdf3142d99b/, 'note_rental'],
        [/note\.com\/cham_ebay\/n\/nb6672d9c3e10/, 'note_ebay'],
        [/rental-space\.net\/mail\/?/, 'mail_lp']
    ];
    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a || typeof gtag !== 'function') return;
        var href = a.href || '';
        for (var i = 0; i < RULES.length; i++) {
            if (RULES[i][0].test(href)) {
                var inBanner = !!a.closest('.kyokasho-banner');
                gtag('event', 'kyokasho_click', {
                    dest: RULES[i][1],
                    placement: inBanner ? 'banner' : 'body',
                    link_url: href,
                    page_location: location.href,
                    transport_type: 'beacon'
                });
                return;
            }
        }
    }, true);
})();
