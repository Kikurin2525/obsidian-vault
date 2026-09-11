import {PRODUCT_LINK_ROWS} from './product-link-data.mjs?v=051';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stores={'link.amazon':'Amazon','www.amazon.co.jp':'Amazon','amazon.co.jp':'Amazon','amzn.to':'Amazon','a.r10.to':'楽天市場','www.nitori-net.jp':'ニトリ','www.cainz.com':'カインズ','neewer.jp':'NEEWER','www.e-kagami.com':'鏡の販売.com'};
export function linksFor(item){
 const sources=item.sources||[item.source].filter(Boolean);
 const seen=new Set();
 return PRODUCT_LINK_ROWS.filter(r=>r.status==='ready'&&sources.some(s=>s.sheet===r.sheet&&Number(s.range.match(/\d+/)?.[0])===r.row)).filter(r=>{
  if(seen.has(r.url))return false;
  const u=new URL(r.url);if(!['https:','http:'].includes(u.protocol))return false;
  seen.add(r.url);return true;
 });
}
export function productLinks(item){
 const links=linksFor(item);if(!links.length)return '';
 return `<section class="equipment-products" aria-label="${esc(item.name)}の参考商品"><h3>実際の商品を見てみる</h3><div class="product-link-list">${links.map((link,i)=>{const shop=stores[new URL(link.url).hostname]||'販売店';const same=links.filter(x=>new URL(x.url).hostname===new URL(link.url).hostname).length>1;return `<a href="${esc(link.url)}" target="_blank" rel="sponsored noopener noreferrer">${esc(shop)}で商品を見る${same?'（'+(i+1)+'）':''} ↗</a>`;}).join('')}</div></section>`;
}
export function productDisclosure(){return `<aside class="product-disclosure" aria-label="商品紹介について"><b>商品紹介について（広告を含みます）</b><p>実際の商品へのリンクには、Amazon・楽天などのアフィリエイトリンクを含みます。リンク経由の購入により、運営者が紹介料を受け取る場合があります。Amazonのアソシエイトとして、きくりんは適格販売により収入を得ています。</p><p>実物の購入は任意で、ゲームの進行に影響しません。ゲーム内価格は概算です。実際の価格・サイズ・仕様・在庫は各販売店でご確認ください。</p></aside>`;}
