// Anonymous campaign entry counts; no store names, save data or query strings.
(()=>{'use strict';
 if(location.hostname!=='rental-space.net')return;
 const placements=new Set(['home','article','hub']);
 const links=[...document.querySelectorAll('a[data-game-promo]')];
 function send(name,a){try{if(localStorage.getItem('renspe.analytics.disabled')==='1')return;}catch{}const p=a.dataset.gamePromo;if(!placements.has(p)||typeof window.gtag!=='function')return;window.gtag('event',name,{send_to:'G-CHWF6QKRJ6',promo_placement:p,promo_campaign:'game_launch',transport_type:'beacon'});}
 for(const a of links)a.addEventListener('click',()=>send('game_banner_click',a));
 if(!('IntersectionObserver' in window))return;
 const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&e.intersectionRatio>=.5){send('game_banner_view',e.target);observer.unobserve(e.target);}}},{threshold:.5});
 for(const a of links)observer.observe(a);
})();
