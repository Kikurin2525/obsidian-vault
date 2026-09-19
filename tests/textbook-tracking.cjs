const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path'),base=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(base,'track.js'),'utf8');
function click(href,{cta=false,banner=false}={}){let events=[],handler;
const a={href,hasAttribute:()=>cta,closest:()=>banner?{}:null};
vm.runInNewContext(code,{document:{addEventListener:(name,fn)=>handler=fn},location:{origin:'https://rental-space.net',pathname:'/articles/example.html',href:'https://rental-space.net/articles/example.html?rt=private'},gtag:(...args)=>events.push(args)});
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
