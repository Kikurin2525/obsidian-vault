import {GENRES,money} from './engine.mjs?v=051';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const hasResume=s=>s.phase!=='welcome';
export function saveSummary(s){
 const genre=GENRES.find(g=>g.id===s.genreId)?.name||'ジャンル選び';
 const stage={genre:'ジャンル選び',area:'出店エリア選び',property:'物件探し',research:'内見・競合調査',setup:'開業準備',manage:`第${s.completedWeeks+1}週の運営`,waiting:`第${s.pending?.week||s.completedWeeks+1}週の結果待ち`,recap:`第${s.completedWeeks}週までの結果`,gameover:'24ヶ月以内に未回収・ゲームオーバー',goal:'2年以内の回収を達成・クリア',epilogue:'次の一室へ'}[s.phase]||'開業前';
 return {name:s.name||'はじめての一室',place:[s.location?.pref,s.location?.name&&s.location.name+'駅',genre].filter(Boolean).join(' · '),stage};
}
export function titleScreen(s,warning=''){
 const resume=hasResume(s),saved=saveSummary(s);
 return `<div class="launch-shell game-launch"><div class="launch-top"><span class="launch-brand">レンタルスペース経営シミュレーション</span><span class="launch-version">無料で遊べる · 試作 05.1</span></div>
 <main class="launch-main"><section class="launch-visual"><h1 class="launch-logo"><img src="assets/web/key-visual-v048.webp" width="1200" height="630" alt="ゲームで学ぶレンスペ経営" fetchpriority="high" decoding="async"></h1><div class="launch-world-note"><span>全国47都道府県</span><span>4つのジャンル</span><span>開業から経営まで</span></div></section><section class="launch-copy"><span class="launch-kicker">あなたの経営物語を、ここから。</span><h2>小さな一室に、<br>大きな「やってみたい」を。</h2><p class="launch-lead">学んで楽しいあなたのレンスペ経営物語。</p>
 ${warning?`<p class="warning" role="status">${esc(warning)}</p>`:''}
 <div class="launch-actions">${resume?`<div class="launch-save"><span class="launch-save-label">つづきの経営</span><strong>${esc(saved.name)}</strong><span>${esc(saved.place)}</span><div><b>${esc(saved.stage)}</b><span>手元資金 ${money(s.cash)}</span></div></div><button class="launch-primary" data-action="launch-continue"><span class="launch-button-label">つづきから</span><span class="launch-button-arrow" aria-hidden="true">→</span></button><button class="launch-secondary" data-action="reset-check">はじめから</button>`:`<button class="launch-primary" data-action="start"><span class="launch-button-label">はじめから</span><span class="launch-button-arrow" aria-hidden="true">→</span></button><p class="launch-start-note">開業資金200万円で、最初のジャンル選びへ。</p>`}<button class="launch-help" data-action="help">遊び方を見る</button></div>
 </section>
 <section class="launch-path" aria-label="ゲームで体験できること"><div><span>01</span><p><b>見つける</b>ジャンル・街・物件を選ぶ</p></div><div><span>02</span><p><b>つくる</b>調べて、備品をそろえて開業</p></div><div><span>03</span><p><b>育てる</b>お客さんの声で、もっといい部屋に</p></div><div><span>GOAL</span><p><b>2年以内に初期投資を回収</b>次は違うジャンルにも挑戦</p></div></section>
 <div class="launch-genres"><span>どんな一室から、始めよう？</span><b>パーティー</b><b>撮影スタジオ</b><b>ダンス</b><b>貸会議室</b></div></main>
 <footer class="launch-footer"><span>教材と実際の運営ノウハウをもとにした、学べる経営ゲーム。</span><button data-action="learn" data-id="genre">ジャンル選びについて学ぶ ↗</button><button data-action="analytics-info">アクセス解析</button></footer></div>`;
}
