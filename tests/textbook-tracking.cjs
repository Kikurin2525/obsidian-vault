const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path'),base=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(base,'track.js'),'utf8');
function click(href,{cta=false,banner=false}={}){let events=[],handler;
const a={href,hasAttribute:()=>cta,closest:()=>banner?{}:null};
vm.runInNewContext(code,{document:{addEventListener:(name,fn)=>{if(name==='click'&&!handler)handler=fn}},location:{origin:'https://rental-space.net',pathname:'/articles/example.html',href:'https://rental-space.net/articles/example.html?rt=private'},gtag:(...args)=>events.push(args)});
handler({target:{closest:()=>a}});return events;}
assert.equal(click('https://rental-space.net/kyokasho/')[0][2].dest,'lp_rental');
assert.equal(click('https://rental-space.net/kyokasho/ebay/?utm_source=x')[0][2].dest,'lp_ebay');
assert.equal(click('https://rental-space.net/kyokasho/index.html')[1][1],'rental_lp_click');
assert.equal(click('https://rental-space.net/kyokasho/thanks/').length,0);
assert.equal(click('https://rental-space.net/kyokasho/?rt=secret')[0][2].link_url,'https://rental-space.net/kyokasho/');
assert.equal(click('https://rental-space.net/kyokasho/')[0][2].page_location,'https://rental-space.net/articles/example.html');
assert.equal(click('https://rental-space.net/kyokasho/',{banner:true})[0][2].placement,'banner');
assert.equal(click('https://rental-space.net/kyokasho/',{cta:true}).length,0);
assert.equal(click('https://brain-market.com/u/torano39/a/bzczM1YjMgoTZsNWa0JXY')[0][2].dest,'brain_ebay');
assert.equal(click('https://rental-space.net/mail/')[1][1],'mail_lp_click');
const thanks=fs.readFileSync(path.join(base,'kyokasho/thanks/index.html'),'utf8');
const script=[...thanks.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
let events=[],store=new Map();
function receipt(query){vm.runInNewContext(script,{URLSearchParams,location:{search:query,origin:'https://rental-space.net',pathname:'/kyokasho/thanks/'},document:{getElementById:()=>({})},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},gtag:(...args)=>events.push(args)});}
receipt('?p=rental');receipt('?p=rental&s=cs_test_abc');assert.equal(events.length,0);
receipt('?p=rental&s=cs_live_abc');receipt('?p=rental&s=cs_live_abc');assert.equal(events.length,1);assert.equal(events[0][1],'checkout_return');assert.equal(events[0][2].value,undefined);assert.equal(events.some(e=>e[1]==='purchase'),false);
for(const rel of ['kyokasho/index.html','kyokasho/ebay/index.html','mail/index.html']) assert.equal((fs.readFileSync(path.join(base,rel),'utf8').match(/src="\/track\.js/g)||[]).length,1);
console.log('PASS: LP mapping, both banners, CTA deduplication, query redaction, checkout-return guards, no fabricated purchases, all 3 pages load tracking');
function lpEvents(product,cta){let handler,events=[];const a={dataset:{cta,position:'offer'},getAttribute:()=>cta,href:'https://buy.stripe.com/example'};
const dummy={addEventListener(){},querySelector(){return this}};
let source=product==='rental'?fs.readFileSync(path.join(base,'kyokasho/lp-v4-de38d585be.js'),'utf8'):[...fs.readFileSync(path.join(base,'kyokasho/ebay/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('ebay_checkout_click'));
vm.runInNewContext(source,{document:{querySelector:()=>dummy,querySelectorAll:()=>[],addEventListener:(name,fn)=>handler=fn},window:{},location:{href:'https://rental-space.net/kyokasho/'},gtag:(...args)=>events.push(args)});
handler({target:{closest:()=>a}});return events;}
for(const p of ['rental','ebay']){assert.equal(lpEvents(p,'stripe_'+p).filter(e=>e[1]===p+'_checkout_click').length,1);assert.equal(lpEvents(p,'jump_buy').filter(e=>e[1]===p+'_checkout_click').length,0);assert.equal(lpEvents(p,'stripe_'+p).filter(e=>e[1]==='kyokasho_click').length,1);}
console.log('PASS: real LP handlers distinguish checkout clicks from price-section jumps');

// 流入元→Stripeの client_reference_id(2026-09-27)
function stripeRef({search='',referrer='',pathname='/kyokasho/ebay/',stored=null}={}){
  const store=new Map();if(stored)store.set('kk_src',JSON.stringify(stored));
  const handlers={};const link={attrs:{href:'https://buy.stripe.com/dRmbJ012S3TR6u730d67T0j'},getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v}};
  vm.runInNewContext(code,{URLSearchParams,URL,Date,JSON,encodeURIComponent,
    location:{search,pathname,hostname:'rental-space.net',origin:'https://rental-space.net',href:'https://rental-space.net'+pathname+search},
    localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)},
    document:{referrer,readyState:'complete',querySelectorAll:()=>[link],addEventListener:(n,fn)=>{(handlers[n]=handlers[n]||[]).push(fn)}}});
  return {href:link.attrs.href,store};
}
let r1=stripeRef({search:'?utm_source=x&utm_medium=cham_post&utm_campaign=2026-09-27_2100__kyozai'});
assert.equal(r1.href,'https://buy.stripe.com/dRmbJ012S3TR6u730d67T0j?client_reference_id=x--cham_post--2026-09-27_2100_kyozai--ebay');
let r2=stripeRef({referrer:'https://t.co/abc',pathname:'/articles/2026-09-20-ebay-award-seller-summary.html'});
assert.equal(JSON.parse(r2.store.get('kk_src')).s,'x');assert.equal(JSON.parse(r2.store.get('kk_src')).l,'2026-09-20-ebay-award-seller-summary');
let r3=stripeRef({referrer:'https://rental-space.net/articles/a.html',stored:{s:'google',m:'referral',c:'',l:'a',t:Date.now()}});
assert.ok(r3.href.endsWith('client_reference_id=google--referral----a'));
let r4=stripeRef({});assert.ok(r4.href.endsWith('client_reference_id=direct'));
let r5=stripeRef({stored:{s:'note',m:'referral',c:'',l:'x',t:Date.now()-31*24*3600*1000}});assert.ok(r5.href.endsWith('client_reference_id=direct'));
for(const h of [r1.href,r2.href,r3.href,r4.href]){const id=new URL(h).searchParams.get('client_reference_id');assert.match(id,/^[A-Za-z0-9_-]{1,200}$/);}
console.log('PASS: stripe client_reference_id (utm / referrer / internal nav keeps first / direct / 30-day expiry / charset)');
