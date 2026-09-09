(() => {
 const dialog=document.querySelector('.image-dialog');let opener;
 document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{
  opener=button;const img=dialog.querySelector('img');img.src=button.dataset.image;img.alt=button.dataset.caption;
  document.querySelector('#image-caption').textContent=button.dataset.caption;dialog.showModal();dialog.querySelector('.image-scroll').scrollTo(0,0);
 }));
 dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 document.addEventListener('click',event=>{const a=event.target.closest?.('a[data-cta]');if(!a||typeof gtag!=='function')return;
  gtag('event','kyokasho_click',{dest:a.dataset.cta,placement:'lp_kyokasho_v4',cta_position:a.dataset.position,link_url:a.href,page_location:location.href,transport_type:'beacon'});
 },true);
 if('IntersectionObserver' in window){const seen=new Set();const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;const section=entry.target.closest('main>section').id;if(seen.has(section))return;seen.add(section);
  if(typeof gtag==='function')gtag('event','lp_section',{section,lp:'kyokasho_v4'});observer.unobserve(entry.target);
 }),{threshold:0.3});document.querySelectorAll('main>section').forEach(section=>{const heading=section.querySelector('h1,h2');if(heading)observer.observe(heading);});}
 const sample=document.querySelector('#sample details');sample?.addEventListener('toggle',()=>{if(sample.open&&typeof gtag==='function')gtag('event','lp_free_open',{lp:'kyokasho_v4'});});
})();