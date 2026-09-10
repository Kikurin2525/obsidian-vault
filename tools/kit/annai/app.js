/* 案内ページメーカー v1.0 — 外部送信なし・保存はlocalStorage・QRはブラウザ内生成 */
(function () {
  'use strict';
  const GATE_WORD = 'kit2026';
  const GATE_KEY = 'kit-gate-ok';
  const SAVE_KEY = 'kit-annai-v1';
  const STEPS = 11;
  const MAX_PHOTOS = 6;
  const PHOTO_W = 1200;
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* noop */ } },
  };

  // ---- gate ----
  function gateOk() { return ls.get(GATE_KEY, false) === true; }
  function showApp() { $('gate').style.display = 'none'; $('app').style.display = 'block'; }
  function checkGate() {
    const v = ($('gate-input').value || '').trim().toLowerCase();
    if (v === GATE_WORD) { ls.set(GATE_KEY, true); showApp(); }
    else { $('gate-error').style.display = 'block'; }
  }

  // ---- state ----
  const TEXT_IDS = ['shop', 'room', 'title', 'address', 'route1', 'route2', 'route3', 'mapUrl', 'lockType', 'lockPlace', 'code', 'lockSteps', 'lockVideo', 'checkout', 'ssid', 'wifiPass', 'wifiNote', 'equipment', 'rules', 'trash', 'phone', 'phoneNote', 'contact2', 'pubUrl', 'posterMsg'];
  const BOOL_IDS = ['codeVisible', 'wifiVisible'];
  let step = 1;
  let photos = []; // {src, caption}
  let qrDataUrl = '';

  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._h); toast._h = setTimeout(() => t.classList.remove('show'), 2000); }

  function data() {
    const d = {};
    TEXT_IDS.forEach((id) => { d[id] = ($(id).value || '').trim(); });
    BOOL_IDS.forEach((id) => { d[id] = $(id).checked; });
    d.photos = photos;
    return d;
  }
  function save() {
    const d = data(); d.step = step;
    if (!ls.set(SAVE_KEY, d)) {
      // 写真で容量超過 → 写真なしで保存を試す
      const d2 = Object.assign({}, d, { photos: [] });
      if (ls.set(SAVE_KEY, d2)) toast('写真が大きく保存できませんでした(文字は保存済み)。ダウンロードはできます');
    }
  }
  function restore() {
    const d = ls.get(SAVE_KEY, null); if (!d) return;
    TEXT_IDS.forEach((id) => { if (d[id] !== undefined) $(id).value = d[id]; });
    BOOL_IDS.forEach((id) => { $(id).checked = !!d[id]; });
    photos = Array.isArray(d.photos) ? d.photos.slice(0, MAX_PHOTOS) : [];
    step = Math.min(Math.max(1, d.step || 1), STEPS);
  }

  // ---- wizard ----
  function renderDots() {
    const box = $('dots'); box.innerHTML = '';
    for (let i = 1; i <= STEPS; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = i;
      b.className = i === step ? 'on' : i < step ? 'done' : '';
      b.title = 'ステップ' + i + 'へ';
      b.addEventListener('click', () => go(i));
      box.appendChild(b);
    }
  }
  function go(n) {
    step = Math.min(Math.max(1, n), STEPS);
    document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', Number(p.dataset.step) === step));
    $('bar').style.width = Math.round((step / STEPS) * 100) + '%';
    $('prog-num').textContent = step + ' / ' + STEPS;
    $('prev').disabled = step === 1;
    $('next').textContent = step === STEPS ? '完了' : step === STEPS - 1 ? 'できあがりへ' : '次へ';
    $('intro').style.display = step === 1 ? '' : 'none';
    renderDots();
    if (step === 10) renderPhotos();
    if (step === STEPS) { renderPoster(); setTimeout(fitPoster, 50); }
    save();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- photos ----
  function renderPhotos() {
    const box = $('photos'); box.innerHTML = '';
    photos.forEach((p, i) => {
      const d = document.createElement('div'); d.className = 'ph';
      const img = document.createElement('img'); img.src = p.src; img.alt = '';
      const cap = document.createElement('input'); cap.type = 'text'; cap.placeholder = '説明(例: 入口のキーボックス)'; cap.value = p.caption || '';
      cap.addEventListener('input', () => { photos[i].caption = cap.value; save(); });
      const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'rm'; rm.textContent = 'この写真を外す';
      rm.addEventListener('click', () => { photos.splice(i, 1); renderPhotos(); save(); });
      d.appendChild(img); d.appendChild(cap); d.appendChild(rm); box.appendChild(d);
    });
    $('photo-count').textContent = photos.length + ' / ' + MAX_PHOTOS + ' 枚';
    $('addph-btn').style.opacity = photos.length >= MAX_PHOTOS ? '.45' : '1';
  }
  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, PHOTO_W / img.naturalWidth);
        const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('読み込めない画像です')); };
      img.src = url;
    });
  }
  async function addPhotos(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast('写真は最大' + MAX_PHOTOS + '枚までです'); return; }
    for (const f of list.slice(0, room)) {
      try { const src = await resizeImage(f); photos.push({ src, caption: '' }); }
      catch (e) { toast(e.message); }
    }
    if (list.length > room) toast('最大' + MAX_PHOTOS + '枚までなので、' + room + '枚だけ追加しました');
    renderPhotos(); save();
  }

  // ---- helpers ----
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lines = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const ul = (s) => { const L = lines(s); return L.length ? '<ul>' + L.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : ''; };
  const ol = (arr) => { const L = arr.filter(Boolean); return L.length ? '<ol>' + L.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>' : ''; };
  const linkify = (u, label) => /^https?:\/\//i.test(u) ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(label || u) + '</a>' : '';
  const today = () => { const d = new Date(); return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate(); };
  const fileSafe = (s) => (s || '案内').replace(/[\\/:*?"<>|\s]+/g, '_');

  // ---- 案内ページHTML ----
  function buildHtml() {
    const d = data();
    const title = d.title || 'ご利用案内';
    const head = [d.shop, d.room].filter(Boolean).join(' ');
    const secs = [];
    const sec = (id, name, body) => { if (body && body.replace(/<[^>]+>/g, '').trim()) secs.push({ id, name, body }); };

    // 住所と道順
    let acc = '';
    if (d.address) acc += '<p class="addr">' + esc(d.address) + '</p>';
    acc += ol([d.route1, d.route2, d.route3]);
    if (d.mapUrl) acc += '<p>' + linkify(d.mapUrl, '地図を開く') + '</p>';
    sec('access', '住所と道順', acc);

    // 入室方法
    let ent = '<p><b>鍵の種類:</b> ' + esc(d.lockType) + '</p>';
    if (d.lockPlace) ent += '<p><b>場所:</b> ' + esc(d.lockPlace) + '</p>';
    if (d.code) ent += d.codeVisible ? '<p class="code"><b>暗証番号:</b> <span>' + esc(d.code) + '</span></p>' : '<p class="code muted">暗証番号は、ご予約確定後のメッセージでお知らせします。</p>';
    ent += ol(lines(d.lockSteps));
    if (d.lockVideo) ent += '<p>' + linkify(d.lockVideo, '開け方の動画を見る') + '</p>';
    sec('enter', '入室方法', ent);

    // 写真
    if (photos.length) {
      sec('photos', '写真で見る', '<div class="gal">' + photos.map((p) => '<figure><img src="' + p.src + '" alt="' + esc(p.caption) + '" loading="lazy">' + (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>').join('') + '</div>');
    }

    sec('exit', '退室方法', ul(d.checkout));

    // Wi-Fi
    let wifi = '';
    if (d.ssid) wifi += '<p><b>ネットワーク名:</b> ' + esc(d.ssid) + '</p>';
    if (d.wifiPass) wifi += d.wifiVisible ? '<p><b>パスワード:</b> <span class="code">' + esc(d.wifiPass) + '</span></p>' : '<p class="muted">パスワードは室内の掲示をご覧ください。</p>';
    if (d.wifiNote) wifi += '<p><b>つながらないとき:</b> ' + esc(d.wifiNote) + '</p>';
    sec('wifi', 'Wi-Fi', wifi);

    sec('equip', '設備・備品', ul(d.equipment));
    sec('rules', 'ルールと禁止事項', ul(d.rules));
    sec('trash', 'ゴミ', ul(d.trash));

    // 緊急連絡先
    let em = '';
    if (d.phone) em += '<p class="tel"><a href="tel:' + esc(d.phone.replace(/[^\d+]/g, '')) + '">' + esc(d.phone) + '</a></p>';
    if (d.phoneNote) em += '<p>' + esc(d.phoneNote) + '</p>';
    if (d.contact2) em += '<p>' + esc(d.contact2) + '</p>';
    sec('contact', '緊急連絡先', em);

    const toc = secs.map((s) => '<a href="#' + s.id + '">' + esc(s.name) + '</a>').join('');
    const body = secs.map((s) => '<details id="' + s.id + '" open><summary>' + esc(s.name) + '</summary><div class="in">' + s.body + '</div></details>').join('\n');

    return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(head ? head + ' ' + title : title)}</title>
<style>
  :root{--bg:#fffdf8;--ink:#1a1a1a;--navy:#1e3a5f;--navy2:#eef2f7;--gold:#b8862b;--green:#1f9d55;--line:#d9dde3;--r:8px}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);line-height:1.75;font-family:"Hiragino Sans","Noto Sans JP","Yu Gothic",system-ui,sans-serif;-webkit-text-size-adjust:100%}
  header{background:var(--navy);color:#fff;padding:18px 16px}
  header .h{max-width:640px;margin:0 auto}
  header .shop{font-size:13px;opacity:.85}
  header h1{font-size:22px;margin:2px 0 0;line-height:1.3}
  main{max-width:640px;margin:0 auto;padding:14px 14px 60px}
  nav.toc{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
  nav.toc a{font-size:12.5px;font-weight:700;color:var(--navy);background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px;text-decoration:none}
  details{background:#fff;border:1px solid var(--line);border-radius:var(--r);margin:0 0 10px;overflow:hidden}
  summary{cursor:pointer;list-style:none;padding:12px 14px;font-size:16px;font-weight:700;color:var(--navy);border-left:5px solid var(--gold);display:flex;align-items:center}
  summary::-webkit-details-marker{display:none}
  summary::after{content:"＋";margin-left:auto;color:var(--gold);font-weight:700}
  details[open] summary::after{content:"－"}
  .in{padding:4px 16px 14px;font-size:15px}
  .in p{margin:6px 0}
  .in ul,.in ol{margin:6px 0;padding-left:22px}
  .in li{margin:4px 0}
  .addr{font-weight:700}
  .code span,span.code{display:inline-block;font-size:20px;font-weight:700;letter-spacing:.08em;background:var(--navy2);border-radius:6px;padding:2px 10px;color:var(--navy)}
  .muted{color:#7a7a7a}
  .tel a{display:inline-block;background:var(--green);color:#fff;text-decoration:none;font-weight:700;font-size:18px;padding:10px 18px;border-radius:var(--r)}
  .gal{display:grid;grid-template-columns:1fr;gap:10px}
  .gal figure{margin:0}
  .gal img{display:block;width:100%;height:auto;border-radius:var(--r);border:1px solid var(--line)}
  .gal figcaption{font-size:13px;color:#4a4a4a;margin-top:4px}
  footer{max-width:640px;margin:0 auto;padding:0 14px;font-size:11.5px;color:#7a7a7a}
  a{color:var(--navy)}
</style>
</head>
<body>
<header><div class="h">${head ? '<div class="shop">' + esc(head) + '</div>' : ''}<h1>${esc(title)}</h1></div></header>
<main>
<nav class="toc">${toc}</nav>
${body}
</main>
<footer>更新日 ${today()}</footer>
</body>
</html>`;
  }

  // ---- Googleドキュメント用テキスト ----
  function buildDoc() {
    const d = data();
    const title = d.title || 'ご利用案内';
    const head = [d.shop, d.room].filter(Boolean).join(' ');
    const out = [];
    out.push((head ? head + ' ' : '') + title);
    out.push('');
    const H = (s) => { out.push('■ ' + s); };
    const L = (arr) => { arr.forEach((x, i) => out.push((i + 1) + '. ' + x)); };
    const B = (arr) => { arr.forEach((x) => out.push('・' + x)); };

    if (d.address || d.route1 || d.mapUrl) {
      H('住所と道順'); if (d.address) out.push(d.address); L([d.route1, d.route2, d.route3].filter(Boolean)); if (d.mapUrl) out.push('地図: ' + d.mapUrl); out.push('');
    }
    H('入室方法'); out.push('鍵の種類: ' + d.lockType); if (d.lockPlace) out.push('場所: ' + d.lockPlace);
    if (d.code) out.push(d.codeVisible ? '暗証番号: ' + d.code : '暗証番号は、ご予約確定後のメッセージでお知らせします。');
    L(lines(d.lockSteps)); if (d.lockVideo) out.push('開け方の動画: ' + d.lockVideo); out.push('');
    if (photos.length) { H('写真'); photos.forEach((p, i) => out.push('(写真' + (i + 1) + ') ' + (p.caption || ''))); out.push(''); }
    if (lines(d.checkout).length) { H('退室方法'); B(lines(d.checkout)); out.push(''); }
    if (d.ssid || d.wifiPass || d.wifiNote) {
      H('Wi-Fi'); if (d.ssid) out.push('ネットワーク名: ' + d.ssid);
      if (d.wifiPass) out.push(d.wifiVisible ? 'パスワード: ' + d.wifiPass : 'パスワードは室内の掲示をご覧ください。');
      if (d.wifiNote) out.push('つながらないとき: ' + d.wifiNote); out.push('');
    }
    if (lines(d.equipment).length) { H('設備・備品'); B(lines(d.equipment)); out.push(''); }
    if (lines(d.rules).length) { H('ルールと禁止事項'); B(lines(d.rules)); out.push(''); }
    if (lines(d.trash).length) { H('ゴミ'); B(lines(d.trash)); out.push(''); }
    if (d.phone || d.phoneNote || d.contact2) { H('緊急連絡先'); if (d.phone) out.push('電話: ' + d.phone); if (d.phoneNote) out.push(d.phoneNote); if (d.contact2) out.push(d.contact2); out.push(''); }
    out.push('更新日 ' + today());
    return out.join('\n');
  }

  // ---- download / copy ----
  function downloadBlob(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  async function copyText(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(okMsg); } catch (e2) { toast('コピーできませんでした'); }
      document.body.removeChild(ta);
    }
  }

  // ---- QR ----
  function makeQr() {
    const url = ($('pubUrl').value || '').trim();
    qrDataUrl = ''; $('qr-dl').disabled = true;
    const box = $('qr-box'); box.innerHTML = '';
    if (!/^https?:\/\//i.test(url)) { renderPoster(); toast('httpまたはhttpsから始まる公開URLを入れてください'); return; }
    if (typeof QRCode === 'undefined') { toast('QRライブラリを読み込めませんでした(オフライン?)'); return; }
    try {
      new QRCode(box, { text: url, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
    } catch (e) { toast('QRを作れませんでした: ' + e.message); return; }
    // canvasからPNGを取り出す(描画は同期)
    const c = box.querySelector('canvas');
    if (c) {
      // 余白つきのPNGにする
      const pad = 24, out = document.createElement('canvas'); out.width = c.width + pad * 2; out.height = c.height + pad * 2;
      const g = out.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, out.width, out.height); g.drawImage(c, pad, pad);
      qrDataUrl = out.toDataURL('image/png');
      $('qr-dl').disabled = false;
    }
    save(); renderPoster();
  }

  // ---- poster ----
  function renderPoster() {
    const d = data();
    const head = [d.shop, d.room].filter(Boolean).join(' ');
    const msg = d.posterMsg || $('posterMsg').placeholder;
    const p = $('poster');
    p.innerHTML =
      '<div class="band"><div class="t1">' + esc(d.title || 'ご利用案内') + '</div>' + (head ? '<div class="t2">' + esc(head) + '</div>' : '') + '</div>' +
      '<div class="qr">' + (qrDataUrl ? '<img src="' + qrDataUrl + '" alt="QR">' : '<div class="ph">上の「QRを作る」で<br>QRが入ります</div>') + '</div>' +
      '<div class="msg">' + esc(msg) + '</div>' +
      (d.pubUrl ? '<div class="url">' + esc(d.pubUrl) + '</div>' : '') +
      '<div class="foot">' + (d.phone ? 'お困りのときは ' + esc(d.phone) : '') + (d.phoneNote ? '(' + esc(d.phoneNote) + ')' : '') + '</div>';
    fitPoster();
  }
  // 貼り紙プレビューを画面幅に合わせて縮小(A5=148mm≒559px)
  function fitPoster() {
    const fit = $('poster-fit'), wrap = fit.parentElement, poster = $('poster');
    const W = poster.offsetWidth || 559, H = poster.offsetHeight || 794;
    const avail = wrap.clientWidth - parseFloat(getComputedStyle(wrap).paddingLeft) * 2;
    const s = Math.min(1, avail / W);
    poster.style.transform = 'scale(' + s + ')';
    fit.style.width = Math.round(W * s) + 'px'; fit.style.height = Math.round(H * s) + 'px';
  }
  function doPrint() {
    if(!qrDataUrl) { toast('現在の公開URLでQRを作ってから印刷してください'); return; }
    renderPoster();
    const root = $('print-root'); root.innerHTML = ''; root.appendChild($('poster').cloneNode(true));
    window.print();
  }

  // ---- init ----
  function init() {
    $('gate-btn').addEventListener('click', checkGate);
    $('gate-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkGate(); });
    if (gateOk()) showApp();

    restore();
    go(step);
    TEXT_IDS.forEach((id) => $(id).addEventListener('input', () => { if(id === 'pubUrl') { qrDataUrl=''; $('qr-box').innerHTML=''; $('qr-dl').disabled=true; } save(); if (step === STEPS) renderPoster(); }));
    BOOL_IDS.forEach((id) => $(id).addEventListener('change', save));
    $('prev').addEventListener('click', () => go(step - 1));
    $('next').addEventListener('click', () => {
      if (step === 1 && !$('shop').value.trim()) { toast('店名を入れてください'); $('shop').focus(); return; }
      if (step === STEPS) { toast('おつかれさまでした。案内ページとQRをお使いください'); return; }
      go(step + 1);
    });
    $('photo-input').addEventListener('change', (e) => { addPhotos(e.target.files); e.target.value = ''; });
    $('dl-html').addEventListener('click', () => downloadBlob(new Blob([buildHtml()], { type: 'text/html;charset=utf-8' }), '案内_' + fileSafe($('shop').value) + '.html'));
    $('preview').addEventListener('click', () => {
      const w = window.open('', '_blank');
      if (!w) { toast('ポップアップがブロックされました。ダウンロードして開いてください'); return; }
      w.document.open(); w.document.write(buildHtml()); w.document.close();
    });
    $('copy-doc').addEventListener('click', () => copyText(buildDoc(), 'Googleドキュメント用テキストをコピーしました'));
    $('dl-doc').addEventListener('click', () => downloadBlob(new Blob([buildDoc()], { type: 'text/plain;charset=utf-8' }), '案内_' + fileSafe($('shop').value) + '.txt'));
    $('qr-make').addEventListener('click', makeQr);
    $('qr-dl').addEventListener('click', () => { if (!qrDataUrl) return; const a = document.createElement('a'); a.href = qrDataUrl; a.download = 'QR_' + fileSafe($('shop').value) + '.png'; document.body.appendChild(a); a.click(); a.remove(); });
    $('print').addEventListener('click', doPrint);
    window.addEventListener('afterprint', () => { $('print-root').innerHTML = ''; });
    window.addEventListener('resize', () => { if (step === STEPS) fitPoster(); });
    $('reset').addEventListener('click', () => {
      if (!confirm('入力した内容と写真をすべて消して、最初からやり直しますか?')) return;
      ls.del(SAVE_KEY); TEXT_IDS.forEach((id) => { $(id).value = ''; }); BOOL_IDS.forEach((id) => { $(id).checked = false; });
      photos = []; qrDataUrl = ''; $('qr-box').innerHTML = ''; $('qr-dl').disabled = true; go(1); toast('最初からになりました');
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
