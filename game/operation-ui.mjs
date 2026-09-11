import * as E from './engine.mjs?v=051';
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function careStatus(s){
 const staff=E.staffOf(s);
 return s.careDone?`✓ 今週は自分で清掃・補充を手配済み${staff?'。外注の定期依頼も継続中':''}`:staff?`${staff.name}さんに今週の清掃・補充を依頼中`:'今週の清掃・補充は未手配';
}
export function weeklyActions(s){
 const staff=E.staffOf(s);
 return `<section class="weekly-actions" aria-label="今週の運営"><span class="eyebrow">第${s.completedWeeks+1}週 / 今週の運営</span><h2>${s.completedWeeks===0?'開業しました。最初のお客さんを迎えよう。':'清掃を確認したら、お客さんを迎えよう。'}</h2><p class="weekly-care-status" role="status">${esc(careStatus(s))}</p><p>${staff?`外注費 ${E.money(E.cleaningFee(s))}/週＋消耗品。追加で自分が掃除しても定期依頼は続きます。`:`自分で週${E.genreOf(s).visits}回の巡回を手配します。消耗品 ${E.money(E.careCost(s))}。`}</p><div class="weekly-buttons"><button class="secondary" data-action="care" ${s.careDone?'disabled':''}>${s.careDone?'✓ 清掃・補充を手配済み':staff?'今週は自分でも清掃・補充する':'今週の清掃・補充をする'}</button><button class="primary" data-action="end">今週の運営を終える →</button></div><p class="small">運営を終えるとお客さんが入室します。通知が来たら対応し、「翌週へ」で1週間分の利用結果と収支を確認しましょう。家具の追加購入は任意です。</p></section>`;
}
export function mobileWeekBar(s){return `<aside class="mobile-week-bar" aria-label="今週の操作"><div><b>第${s.completedWeeks+1}週</b><small>${esc(careStatus(s))}</small></div><button class="primary" data-action="end">今週を終える →</button></aside>`;}
