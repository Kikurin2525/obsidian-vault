import * as E from './engine.mjs?v=053';
import {roomArt} from './room.mjs?v=053';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,label,id,cls='choice-card')=>`<button class="${cls}" data-action="${action}" data-id="${esc(id)}">${label}</button>`;
export function inspectionScene(s,id){
 const p=s.listings.find(p=>p.id===s.research.propertyId);
 if(id==='permission')return `<div class="agent-letter"><small>仲介担当からのメッセージ</small><p>「事務所としての利用は可能ですよ。」</p><span>まだ伝えていないこと：無人運営・時間貸し・利用用途</span></div>`;
 if(id==='route')return `<div class="walk-diagram" aria-label="駅から入口と室内までの確認"><div><b>駅</b><small>募集の徒歩${p.walk}分</small></div><span aria-hidden="true">→</span><div><b>建物入口</b><small>${p.elevator?'エレベーターあり':p.floor===1?'1階の入口':'階段あり'}</small></div><span aria-hidden="true">→</span><div><b>室内</b><small>荷物・家具も通れる？</small></div></div>`;
 const tags={noise:['部屋の中で音を出す','廊下・隣室で聞く'],neighbors:['上・下・隣の用途','階数だけで決めない'],vibration:E.researchProperty(s)?.danceBuilding?.lower==='下にフロアなし'?['室内でジャンプ・足踏み','上階・周囲への響き']:['上でジャンプ・足踏み','下でも響きを確かめる'],basement:['壁際の湿気・換気','入口と室内の通信'],key:s.genreId==='meeting'?['入口 → 入室 → PC接続','回線は開通後に確認']:['入口 → 鍵 → 室内','予備鍵と連絡手順'],measure:s.genreId==='photo'?['撮影距離・照明','試し撮りで確認']:['家具を置ける広さ','お客さんが使える動線'],visit:['写真の印象','実際に使った時の気持ち']}[id]||['現地で確かめる','使う場面を想像する'];
 return `<figure class="inspection-scene">${roomArt(s.genreId,[])}<figcaption><span>${tags[0]}</span><span>${tags[1]}</span></figcaption><small>利用イメージ。物件の実際の間取りではありません。</small></figure>`;
}
export function comparisonPanel(s,selected=null){
 const p=s.listings.find(p=>p.id===s.research.propertyId),cs=E.competitors(s),chosen=cs.find(c=>c.id===selected);
 return `<span class="eyebrow">比べて選ぶ / 競合調査</span><h2>売上予測の参考にする店を1つ選ぼう</h2><p>あなたの候補は${p.area}㎡・駅徒歩${p.walk}分。まずは、広さが近い店を見てみよう。</p><div class="competitor-choices">${cs.map(c=>button('compare-select',`<small>${esc(c.role)}</small><b>${esc(c.name)}</b><span>${c.area}㎡ · 徒歩${c.walk}分 · ${E.money(c.rate)}/時間</span><q>${esc(c.review)}</q>`,c.id,`competitor-choice ${selected===c.id?'selected':''}`)).join('')}</div>${chosen?`<div class="comparison-feedback" role="status"><b>${esc(chosen.name)}を選ぶと…</b><p>${esc(chosen.lesson)}</p>${chosen.id!=='c0'?'<p>人気や条件の違いで見込みが変わります。条件の近い店も見比べてから決められます。</p>':''}</div>${button('compare-save','5店の比較を記録し、この店を基準にする',chosen.id,'primary')}`:'<p class="small">気になる店を1つ選ぶと、比較のヒントが出ます。</p>'}<p class="small">5店は架空の調査資料です。この操作では視察費はかかりません。</p>`;
}
function calendarBar(label,hours,blocked,buffer,max){const total=hours+blocked+buffer;return `<div class="calendar-observation"><b>${label}</b><div class="calendar-track" style="width:${100*total/max}%" aria-hidden="true"><span style="flex:${hours}" class="paid"></span><span style="flex:${blocked}" class="blocked"></span><span style="flex:${buffer}" class="buffer"></span></div><p>お客さん ${hours}h ／ オーナー確保 ${blocked}h ／ 入替 ${buffer}h <small>埋まった時間 ${total}h</small></p></div>`;}
export function salesHoursTable(c){return `<dl class="ledger"><div><dt>お客さんが利用</dt><dd>${c.hours}時間</dd></div><div><dt>オーナーが自分で使う</dt><dd>${c.blocked}時間</dd></div><div><dt>予約の間の準備</dt><dd>${c.buffer}時間</dd></div></dl>`;}
export function inspectionPanel(s,q,notice=''){
 return `<span class="eyebrow">かんたん確認 / ${esc(E.genreOf(s).name)}の内見</span><h2>${esc(q.question)}</h2><p>${esc(q.scene)}</p>${notice?`<p class="warning" role="status">${esc(notice)}</p>`:''}<div class="decision-options">${q.choices.map((label,i)=>button('inspection-answer',`<b>${String.fromCharCode(65+i)}</b><span>${esc(label)}</span>`,i)).join('')}</div><p class="small">どちらか1つを選ぼう。間違えても資金は減りません。</p>`;
}
export function calendarPanel(s,notice=''){
 const c=E.competitors(s).find(c=>c.id===s.research.benchmark),middle=Math.round((c.firstHours+c.hours)/2);
 return `<span class="eyebrow">かんたん確認 / 売上の計算</span><h2>売上になるのは、何時間？</h2><p>${esc(c.name)}の1週間の予定です。</p>${salesHoursTable(c)}${notice?`<p class="warning" role="status">${esc(notice)}</p>`:''}<div class="calendar-answers">${[c.hours+c.blocked+c.buffer,c.hours].map(h=>button('calendar-answer',`${h}時間`,h)).join('')}</div><details class="quiz-details"><summary>予約が増えた経過を見る</summary><p>同じ1週間を、日を変えて調べた例です。</p><div class="calendar-legend"><span>緑：お客さん</span><span>灰：オーナー確保</span><span>点線：入替</span></div>${calendarBar('初回の調査',c.firstHours,c.blocked,c.buffer,c.hours+c.blocked+c.buffer)}${calendarBar('別日の調査',middle,c.blocked,c.buffer,c.hours+c.blocked+c.buffer)}${calendarBar('利用直前の調査',c.hours,c.blocked,c.buffer,c.hours+c.blocked+c.buffer)}</details><p class="small">ゲーム内の比較例です。間違えても資金は減りません。</p>`;
}
