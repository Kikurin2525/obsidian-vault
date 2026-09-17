/* 公式HPメーカー v1.0 — 外部送信なし・保存はlocalStorage。業種プリセットは presets.js */
(function () {
  'use strict';
  const P = window.HP_PRESETS;
  const SAVE_KEY = 'kikurin-hp-maker-v1';
  const STEPS = 12;
  const MAX_PHOTOS = 10;
  const PHOTO_W = 1400;
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* noop */ } },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lines = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const isUrl = (u) => /^https?:\/\//i.test(u || '');
  const today = () => { const d = new Date(); return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); };

  // ---- state ----
  const TEXT_IDS = ['shop', 'rooms', 'area', 'catch', 'lead', 'points', 'spec-note', 'price-unit', 'min-hours', 'price-opts', 'price-notes', 'equip-add', 'equip-note', 'address', 'stations', 'route1', 'route2', 'route3', 'map', 'parking', 'entry-note', 'rule-add', 'cancel', 'book-type', 'book-url', 'book-label', 'book-sub', 'line', 'insta', 'tel', 'mail', 'contact-note', 'links', 'owner', 'owner-name', 'owner-address', 'owner-msg', 'news', 'gbp', 'voices', 'desc'];
  const BOOL_IDS = ['dark'];
  const S = {
    step: 1,
    genre: '',
    color: '',
    uses: [],          // 選んだ用途
    useExtra: [],      // 自分で足した用途
    spec: {},          // id -> value
    price: [],         // {name, wd, we}
    equip: {},         // item -> true
    rules: {},         // rule -> true
    faq: [],           // {q, a}
    photos: [],        // {src, caption, hero}
  };

  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._h); toast._h = setTimeout(() => t.classList.remove('show'), 2200); }
  const G = () => P.genres.find((g) => g.id === S.genre) || P.genres[0];

  function data() {
    const d = {};
    TEXT_IDS.forEach((id) => { d[id] = ($(id).value || '').trim(); });
    BOOL_IDS.forEach((id) => { d[id] = $(id).checked; });
    // spec の値を DOM から
    const spec = {};
    document.querySelectorAll('#spec-fields input').forEach((i) => { if (i.value.trim()) spec[i.dataset.id] = i.value.trim(); });
    S.spec = spec;
    // 料金表を DOM から
    S.price = Array.from(document.querySelectorAll('#price-body tr')).map((tr) => {
      const [n, w, e] = tr.querySelectorAll('input');
      return { name: n.value.trim(), wd: w.value.trim(), we: e.value.trim() };
    }).filter((r) => r.name || r.wd || r.we);
    // FAQ を DOM から
    S.faq = Array.from(document.querySelectorAll('#faq-list .faq-item')).map((el) => ({ q: el.querySelector('input').value.trim(), a: el.querySelector('textarea').value.trim() })).filter((f) => f.q || f.a);
    Object.assign(d, { step: S.step, genre: S.genre, color: S.color, uses: S.uses, useExtra: S.useExtra, spec: S.spec, price: S.price, equip: S.equip, rules: S.rules, faq: S.faq, photos: S.photos });
    return d;
  }
  function save() {
    const d = data();
    if (!ls.set(SAVE_KEY, d)) {
      const d2 = Object.assign({}, d, { photos: [] });
      if (ls.set(SAVE_KEY, d2)) toast('写真が大きく保存できませんでした(文字は保存済み)。ダウンロードはできます');
    }
  }
  function applyData(d) {
    if (!d) return;
    TEXT_IDS.forEach((id) => { if (d[id] !== undefined) $(id).value = d[id]; });
    BOOL_IDS.forEach((id) => { $(id).checked = !!d[id]; });
    S.genre = d.genre || '';
    S.color = d.color || '';
    S.uses = Array.isArray(d.uses) ? d.uses : [];
    S.useExtra = Array.isArray(d.useExtra) ? d.useExtra : [];
    S.spec = d.spec || {};
    S.price = Array.isArray(d.price) ? d.price : [];
    S.equip = d.equip || {};
    S.rules = d.rules || {};
    S.faq = Array.isArray(d.faq) ? d.faq : [];
    S.photos = Array.isArray(d.photos) ? d.photos.slice(0, MAX_PHOTOS) : [];
    S.step = Math.min(Math.max(1, d.step || 1), STEPS);
  }

  // ---- 業種 ----
  function renderGenres() {
    const box = $('genres'); box.innerHTML = '';
    P.genres.forEach((g) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'genre' + (g.id === S.genre ? ' on' : '');
      b.innerHTML = '<div class="ic">' + g.icon + '</div><b>' + esc(g.label) + '</b><small>' + esc(g.sub) + '</small>';
      b.addEventListener('click', () => selectGenre(g.id));
      box.appendChild(b);
    });
    const g = P.genres.find((x) => x.id === S.genre);
    $('genre-ref').style.display = g ? '' : 'none';
    if (g) $('genre-ref-in').innerHTML = '<ul>' + g.ref.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>';
    renderColors();
  }
  function selectGenre(id) {
    const first = !S.genre;
    if (!first && id === S.genre) return;
    const changed = !first && id !== S.genre;
    S.genre = id;
    const g = G();
    if (first || changed) {
      // 業種を変えたら、その業種のお手本を入れる(自分で書いた文があるところは残す)
      if (!S.color) S.color = g.color;
      if (first) { $('dark').checked = !!g.dark; S.color = g.color; }
      if (changed && confirm('業種を「' + g.label + '」に変えます。用途・スペック欄・料金の例・設備・ルール・よくある質問を、この業種のものに入れ替えますか?\n(店名・住所・連絡先などはそのまま残ります)')) {
        S.uses = []; S.spec = {}; S.price = []; S.equip = {}; S.rules = {}; S.faq = [];
        $('catch').value = ''; $('lead').value = ''; $('points').value = ''; $('price-notes').value = ''; $('cancel').value = ''; $('owner-msg').value = '';
        S.color = g.color; $('dark').checked = !!g.dark;
      }
      if (!S.uses.length) S.uses = g.uses.slice(0, 6);
      if (!S.price.length) S.price = g.priceRows.map((r) => Object.assign({}, r));
      if (!Object.keys(S.rules).length) g.rules.forEach((r, i) => { if (i < 10) S.rules[r] = true; });
      if (!S.faq.length) S.faq = g.faq.slice(0, 6).map((f) => Object.assign({}, f));
      if (!$('points').value) $('points').value = g.points.join('\n');
      if (!$('price-notes').value) $('price-notes').value = g.priceNotes.slice(0, 3).join('\n');
      if (!$('cancel').value) $('cancel').value = g.cancel[0];
      if (!$('book-label').value) $('book-label').value = g.bookLabel;
      if (!$('min-hours').value && g.minHours) $('min-hours').value = g.minHours;
    }
    renderGenres(); renderChips(); renderSpec(); renderPrice(); renderEquip(); renderRules(); renderFaq(); renderPhotoGuide();
    save();
  }
  function renderColors() {
    const box = $('colors'); box.innerHTML = '';
    P.colors.forEach((c) => {
      const b = document.createElement('button'); b.type = 'button'; b.style.background = c.hex; b.title = c.name; b.className = c.hex === S.color ? 'on' : '';
      b.addEventListener('click', () => { S.color = c.hex; renderColors(); save(); });
      box.appendChild(b);
    });
  }

  // ---- チップ類 ----
  function chipList(boxId, items, onPick, isOn) {
    const box = $(boxId); box.innerHTML = '';
    items.forEach((it) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip ' + (isOn ? (isOn(it) ? 'on' : '') : 'pick'); b.textContent = it;
      b.addEventListener('click', () => onPick(it));
      box.appendChild(b);
    });
  }
  function renderChips() {
    const g = G();
    chipList('catch-chips', g.catch, (t) => { $('catch').value = t; save(); });
    chipList('lead-chips', g.lead.map((t, i) => '案' + (i + 1) + ': ' + t.slice(0, 22) + '…'), (t) => { $('lead').value = g.lead[Number(t.slice(1, 2)) - 1]; save(); });
    const all = g.uses.concat(S.useExtra.filter((u) => !g.uses.includes(u)));
    chipList('use-chips', all, (t) => { const i = S.uses.indexOf(t); if (i >= 0) S.uses.splice(i, 1); else S.uses.push(t); renderChips(); save(); }, (t) => S.uses.includes(t));
    chipList('pricenote-chips', g.priceNotes, (t) => { const L = lines($('price-notes').value); if (!L.includes(t)) L.push(t); $('price-notes').value = L.join('\n'); save(); });
    chipList('cancel-chips', g.cancel.map((t, i) => '例' + (i + 1) + ': ' + t.split('\n')[0]), (t) => { $('cancel').value = g.cancel[Number(t.slice(1, 2)) - 1]; save(); });
    chipList('owner-chips', g.owner.map((t, i) => '例' + (i + 1) + ': ' + t.slice(0, 24) + '…'), (t) => { $('owner-msg').value = g.owner[Number(t.slice(1, 2)) - 1]; save(); });
    renderFaqChips();
  }

  // ---- スペック ----
  function renderSpec() {
    const g = G(); const box = $('spec-fields'); box.innerHTML = '';
    const grid = document.createElement('div'); grid.className = 'row2';
    g.spec.forEach((f) => {
      const w = document.createElement('div');
      w.innerHTML = '<label class="f">' + esc(f.label) + (f.hint ? '<small>' + esc(f.hint) + '</small>' : '') + '</label>';
      const i = document.createElement('input'); i.type = 'text'; i.dataset.id = f.id; i.placeholder = f.placeholder || ''; i.value = S.spec[f.id] || '';
      i.addEventListener('input', save);
      w.appendChild(i); grid.appendChild(w);
    });
    box.appendChild(grid);
  }

  // ---- 料金表 ----
  function priceRow(r) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td><input type="text" placeholder="例: 平日 9:00-18:00" value="' + esc(r.name) + '"></td><td><input type="text" inputmode="numeric" placeholder="1,500円" value="' + esc(r.wd) + '"></td><td><input type="text" inputmode="numeric" placeholder="2,000円" value="' + esc(r.we) + '"></td><td><button type="button" class="rm" title="この行を消す">✕</button></td>';
    tr.querySelectorAll('input').forEach((i) => i.addEventListener('input', save));
    tr.querySelector('.rm').addEventListener('click', () => { tr.remove(); save(); });
    return tr;
  }
  function renderPrice() {
    const body = $('price-body'); body.innerHTML = '';
    (S.price.length ? S.price : [{ name: '', wd: '', we: '' }]).forEach((r) => body.appendChild(priceRow(r)));
  }

  // ---- 設備 ----
  function renderEquip() {
    const g = G(); const box = $('equip-groups'); box.innerHTML = '';
    Object.keys(g.equip).forEach((grp) => {
      const h = document.createElement('h3'); h.textContent = grp; box.appendChild(h);
      const cl = document.createElement('div'); cl.className = 'cl';
      g.equip[grp].forEach((item) => cl.appendChild(checkItem(item, S.equip)));
      box.appendChild(cl);
    });
  }
  function checkItem(text, store, after) {
    const l = document.createElement('label'); l.className = store[text] ? 'on' : '';
    const c = document.createElement('input'); c.type = 'checkbox'; c.checked = !!store[text];
    c.addEventListener('change', () => { if (c.checked) store[text] = true; else delete store[text]; l.className = c.checked ? 'on' : ''; save(); if (after) after(); });
    l.appendChild(c); l.appendChild(document.createTextNode(text));
    return l;
  }
  // ---- ルール ----
  function renderRules() {
    const g = G(); const box = $('rule-list'); box.innerHTML = '';
    g.rules.forEach((r) => box.appendChild(checkItem(r, S.rules)));
  }
  // ---- FAQ ----
  function faqItem(f, i) {
    const el = document.createElement('div'); el.className = 'faq-item';
    el.innerHTML = '<div class="muted">Q' + (i + 1) + '</div><input type="text" placeholder="質問" value="' + esc(f.q) + '"><textarea placeholder="答え">' + esc(f.a) + '</textarea><button type="button" class="ghost rm">この質問を消す</button>';
    el.querySelectorAll('input,textarea').forEach((x) => x.addEventListener('input', save));
    el.querySelector('.rm').addEventListener('click', () => { data(); S.faq.splice(i, 1); renderFaq(); save(); });
    return el;
  }
  function renderFaq() {
    const box = $('faq-list'); box.innerHTML = '';
    S.faq.forEach((f, i) => box.appendChild(faqItem(f, i)));
    renderFaqChips();
  }
  function renderFaqChips() {
    const g = G(); const used = S.faq.map((f) => f.q);
    const rest = g.faq.filter((f) => !used.includes(f.q));
    $('faq-chips').style.display = 'none';
    chipList('faq-chips', rest.map((f) => f.q), (q) => { data(); const f = g.faq.find((x) => x.q === q); S.faq.push(Object.assign({}, f)); renderFaq(); save(); $('faq-chips').style.display = 'flex'; });
  }
  // ---- 写真 ----
  function renderPhotoGuide() {
    const g = G(); $('photo-guide').innerHTML = g.photoGuide.map((t) => '<li>' + esc(t) + '</li>').join('');
  }
  function renderPhotos() {
    const box = $('photos'); box.innerHTML = '';
    S.photos.forEach((p, i) => {
      const d = document.createElement('div'); d.className = 'ph';
      const img = document.createElement('img'); img.src = p.src; img.alt = '';
      const cap = document.createElement('input'); cap.type = 'text'; cap.placeholder = '説明(例: 鏡側から見た全体)'; cap.value = p.caption || '';
      cap.addEventListener('input', () => { S.photos[i].caption = cap.value; save(); });
      const ctl = document.createElement('div'); ctl.className = 'ctl';
      const hero = document.createElement('button'); hero.type = 'button'; hero.className = 'hero' + (p.hero ? ' on' : ''); hero.textContent = p.hero ? '★ トップ写真' : 'トップに';
      hero.addEventListener('click', () => { S.photos.forEach((x, j) => { x.hero = j === i; }); renderPhotos(); save(); });
      const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'rm'; rm.textContent = '外す';
      rm.addEventListener('click', () => { S.photos.splice(i, 1); renderPhotos(); save(); });
      ctl.appendChild(hero); ctl.appendChild(rm);
      d.appendChild(img); d.appendChild(cap); d.appendChild(ctl); box.appendChild(d);
    });
    $('photo-count').textContent = S.photos.length + ' / ' + MAX_PHOTOS + ' 枚';
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
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('読み込めない画像です')); };
      img.src = url;
    });
  }
  async function addPhotos(files) {
    const list = Array.from(files || []); if (!list.length) return;
    const room = MAX_PHOTOS - S.photos.length;
    if (room <= 0) { toast('写真は最大' + MAX_PHOTOS + '枚までです'); return; }
    for (const f of list.slice(0, room)) {
      try { S.photos.push({ src: await resizeImage(f), caption: '', hero: S.photos.length === 0 }); } catch (e) { toast(e.message); }
    }
    renderPhotos(); save();
  }

  // ---- wizard ----
  const STEP_NAMES = ['業種', '言葉', '基本', '料金', '設備', '写真', 'アクセス', 'ルール', 'FAQ', '予約', '運営者', '完成'];
  function renderDots() {
    const box = $('dots'); box.innerHTML = '';
    for (let i = 1; i <= STEPS; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = STEP_NAMES[i - 1];
      b.className = i === S.step ? 'on' : i < S.step ? 'done' : '';
      b.addEventListener('click', () => go(i));
      box.appendChild(b);
    }
  }
  function go(n) {
    if (n > 1 && !S.genre) { toast('まず業種を選んでください'); n = 1; }
    data();
    S.step = Math.min(Math.max(1, n), STEPS);
    document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', Number(p.dataset.step) === S.step));
    $('bar').style.width = Math.round((S.step / STEPS) * 100) + '%';
    $('prog-num').textContent = S.step + ' / ' + STEPS;
    $('prev').disabled = S.step === 1;
    $('next').textContent = S.step === STEPS ? '完了' : S.step === STEPS - 1 ? 'できあがりへ' : '次へ';
    $('intro').style.display = S.step === 1 ? '' : 'none';
    renderDots();
    if (S.step === 6) renderPhotos();
    if (S.step === STEPS) { renderCheck(); renderPreview(); }
    save();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- 公開前チェック ----
  function checks() {
    const d = data(); const g = G(); const out = [];
    const ok = (c, good, bad) => out.push({ ok: c, text: c ? good : bad });
    ok(!!d.shop, '店名が入っています', '店名が空です(1)');
    ok(!!d.catch, 'キャッチコピーがあります', 'キャッチコピーが空です(2)。候補から選ぶだけでもOK');
    ok(!!d.lead, 'リード文があります', 'リード文が空です(2)');
    ok(S.price.some((r) => r.wd || r.we), '料金が入っています', '料金が1つも入っていません(4)。「いくらから」がないHPは予約されません');
    ok(Object.keys(S.equip).length >= 5, '設備が' + Object.keys(S.equip).length + '項目あります', '設備が' + Object.keys(S.equip).length + '項目しかありません(5)。5つ以上あると安心感が出ます');
    ok(S.photos.length >= 3, '写真が' + S.photos.length + '枚あります', '写真が' + S.photos.length + '枚です(6)。3枚以上、できれば6枚以上を');
    ok(!!d.address, '住所が入っています', '住所が空です(7)。Googleビジネスプロフィールと一致させてください');
    ok(!!lines(d.stations).length, '最寄駅と徒歩分数があります', '最寄駅と徒歩分数が空です(7)。検索で最も見られる情報です');
    ok(Object.keys(S.rules).length >= 5, 'ルールが' + Object.keys(S.rules).length + '項目あります', 'ルールが少なめです(8)。禁止事項は事前に書いてある方がトラブルが減ります');
    ok(!!d.cancel, 'キャンセルポリシーがあります', 'キャンセルポリシーが空です(8)');
    ok(S.faq.length >= 4, 'よくある質問が' + S.faq.length + '個あります', 'よくある質問が' + S.faq.length + '個です(9)。4個以上を');
    ok(isUrl(d['book-url']) || d['book-type'] === 'line' && isUrl(d.line) || d['book-type'] === 'tel' && d.tel, '予約先が設定されています', '予約先のURL(または電話・LINE)がありません(10)');
    ok(!!(d.line || d.insta || d.tel || d.mail), '連絡先があります', '連絡先が1つもありません(10)');
    ok(!!d.owner, '運営者が入っています', '運営者名が空です(11)。「誰がやっているか」は信用に直結します');
    g.specRequired.forEach((id) => { const f = g.spec.find((x) => x.id === id); if (f) ok(!!S.spec[id], f.label + 'があります', f.label + 'が空です(3)。この業種では必ず聞かれます'); });
    return out;
  }
  function renderCheck() {
    $('pubcheck').innerHTML = checks().map((c) => '<li class="' + (c.ok ? '' : 'ng') + '">' + esc(c.text) + '</li>').join('');
  }

  // ---- 生成 ----
  function mapEmbed(s) {
    s = (s || '').trim(); if (!s) return '';
    const m = s.match(/src="(https:\/\/www\.google\.com\/maps\/embed[^"]+)"/) || s.match(/^(https:\/\/www\.google\.com\/maps\/embed[^\s"]+)$/);
    if (m) return '<div class="map"><iframe src="' + esc(m[1]) + '" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" title="地図"></iframe></div>';
    if (isUrl(s)) return '<p><a class="btn sub" href="' + esc(s) + '" target="_blank" rel="noopener">Googleマップで開く</a></p>';
    return '';
  }
  function splitPipe(s) { const i = s.indexOf('｜') >= 0 ? s.indexOf('｜') : s.indexOf('|'); return i >= 0 ? [s.slice(0, i).trim(), s.slice(i + 1).trim()] : [s.trim(), '']; }
  function bookHref(d) {
    if (d['book-type'] === 'line') return d['book-url'] || d.line;
    if (d['book-type'] === 'tel') return d.tel ? 'tel:' + d.tel.replace(/[^\d+]/g, '') : (d['book-url'] || '');
    return d['book-url'];
  }
  function buildHtml() {
    const d = data(); const g = G();
    const color = S.color || g.color; const dark = !!d.dark;
    const shop = d.shop || 'スタジオ名';
    const title = shop + (d.area ? '｜' + d.area + 'の' + g.label : '｜' + g.label);
    const heroPhoto = S.photos.find((p) => p.hero) || S.photos[0];
    const others = S.photos;
    const desc = d.desc || [d.catch, d.area ? d.area + 'の' + g.label + '「' + shop + '」。' : '', (S.price.find((r) => r.wd || r.we) || {}).wd ? '料金は' + (S.price.find((r) => r.wd || r.we).wd || S.price.find((r) => r.wd || r.we).we) + '〜。' : ''].filter(Boolean).join(' ').slice(0, 140);
    const uses = S.uses.slice();
    const href = bookHref(d) || '#contact';
    const bookLabel = d['book-label'] || g.bookLabel;
    const navs = [];
    const secs = [];
    const sec = (id, name, body, cls) => { if (body && body.replace(/<[^>]+>/g, '').trim()) { secs.push('<section id="' + id + '" class="sec ' + (cls || '') + '"><div class="in"><h2>' + esc(name) + '</h2>' + body + '</div></section>'); navs.push('<a href="#' + id + '">' + esc(name) + '</a>'); } };

    // お知らせ
    const news = lines(d.news).map(splitPipe);
    if (news.length) sec('news', 'お知らせ', '<ul class="news">' + news.map(([dt, tx]) => '<li><time>' + esc(dt) + '</time><span>' + esc(tx || dt) + '</span></li>').join('') + '</ul>');
    // 強み
    const pts = lines(d.points).map(splitPipe);
    if (pts.length) sec('points', shop + 'の特徴', '<div class="pts">' + pts.map(([h, b]) => '<div class="pt"><b>' + esc(h) + '</b>' + (b ? '<p>' + esc(b) + '</p>' : '') + '</div>').join('') + '</div>');
    // 基本情報
    const specRows = g.spec.filter((f) => S.spec[f.id]).map((f) => '<tr><th>' + esc(f.label) + '</th><td>' + esc(S.spec[f.id]) + (f.unit && !/[^\d.,〜~-]/.test(S.spec[f.id]) ? esc(f.unit) : '') + '</td></tr>');
    if (d.rooms) specRows.unshift('<tr><th>部屋</th><td>' + esc(d.rooms) + '</td></tr>');
    sec('spec', 'スペース概要', (specRows.length ? '<table class="spec">' + specRows.join('') + '</table>' : '') + (d['spec-note'] ? '<p class="note">' + esc(d['spec-note']) + '</p>' : ''));
    // 料金
    const pr = S.price.filter((r) => r.name || r.wd || r.we);
    let price = '';
    if (pr.length) {
      const hasWe = pr.some((r) => r.we);
      price += '<div class="tw"><table class="price"><thead><tr><th>プラン・時間帯</th><th>平日' + (hasWe ? '' : '・土日祝') + '</th>' + (hasWe ? '<th>土日祝</th>' : '') + '</tr></thead><tbody>' + pr.map((r) => '<tr><td>' + esc(r.name) + '</td><td class="y">' + esc(r.wd || r.we) + '</td>' + (hasWe ? '<td class="y">' + esc(r.we || r.wd) + '</td>' : '') + '</tr>').join('') + '</tbody></table></div>';
      price += '<p class="unit">' + esc(d['price-unit']) + 'あたりの料金' + (d['min-hours'] ? '・最低' + esc(d['min-hours']) + 'から' : '') + '</p>';
    }
    const opts = lines(d['price-opts']); if (opts.length) price += '<h3>延長・オプション</h3><ul>' + opts.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    const pn = lines(d['price-notes']); if (pn.length) price += '<ul class="small">' + pn.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    price += '<p class="cta"><a class="btn" href="' + esc(href) + '" ' + (href.startsWith('#') ? '' : 'target="_blank" rel="noopener"') + '>' + esc(bookLabel) + '</a></p>';
    sec('price', '料金', price);
    // 設備
    const eqGroups = Object.keys(g.equip).map((grp) => { const items = g.equip[grp].filter((i) => S.equip[i]); return items.length ? '<div class="eg"><h3>' + esc(grp) + '</h3><ul class="tags">' + items.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul></div>' : ''; }).join('');
    const eqAdd = lines(d['equip-add']);
    sec('equip', '設備・備品', eqGroups + (eqAdd.length ? '<div class="eg"><h3>その他</h3><ul class="tags">' + eqAdd.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul></div>' : '') + (d['equip-note'] ? '<p class="note">' + esc(d['equip-note']) + '</p>' : ''));
    // 写真
    if (others.length) sec('photos', '写真', '<div class="gal">' + others.map((p) => '<figure><img src="' + p.src + '" alt="' + esc(p.caption || shop) + '" loading="lazy">' + (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>').join('') + '</div>');
    // アクセス
    let acc = '';
    if (d.address) acc += '<p class="addr">' + esc(d.address) + '</p>';
    const st = lines(d.stations); if (st.length) acc += '<ul class="st">' + st.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    const rt = [d.route1, d.route2, d.route3].filter(Boolean); if (rt.length) acc += '<h3>道順</h3><ol>' + rt.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>';
    acc += mapEmbed(d.map);
    if (d.parking) acc += '<p><b>駐車・駐輪:</b> ' + esc(d.parking) + '</p>';
    if (d['entry-note']) acc += '<p><b>入館・搬入:</b> ' + esc(d['entry-note']) + '</p>';
    sec('access', 'アクセス', acc);
    // ルール
    const rules = g.rules.filter((r) => S.rules[r]).concat(lines(d['rule-add']));
    let ru = rules.length ? '<ul class="rules">' + rules.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
    const cn = lines(d.cancel); if (cn.length) ru += '<h3>キャンセルポリシー</h3><ul>' + cn.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    sec('rules', 'ご利用ルール', ru);
    // FAQ
    const faq = S.faq.filter((f) => f.q);
    if (faq.length) sec('faq', 'よくある質問', faq.map((f) => '<details><summary>' + esc(f.q) + '</summary><div class="a">' + esc(f.a).replace(/\n/g, '<br>') + '</div></details>').join(''));
    // 声
    const vo = lines(d.voices).map(splitPipe);
    if (vo.length) sec('voices', 'ご利用者の声', '<div class="voices">' + vo.map(([t, w]) => '<blockquote><p>' + esc(t) + '</p>' + (w ? '<cite>' + esc(w) + '</cite>' : '') + '</blockquote>').join('') + '</div>' + (isUrl(d.gbp) ? '<p><a class="btn sub" href="' + esc(d.gbp) + '" target="_blank" rel="noopener">Googleの口コミを見る</a></p>' : ''));
    else if (isUrl(d.gbp)) sec('voices', 'ご利用者の声', '<p><a class="btn sub" href="' + esc(d.gbp) + '" target="_blank" rel="noopener">Googleの口コミを見る</a></p>');
    // 運営者
    let ow = '';
    if (d['owner-msg']) ow += '<p class="msg">' + esc(d['owner-msg']).replace(/\n/g, '<br>') + '</p>';
    const owRows = [['運営', d.owner], ['代表', d['owner-name']], ['所在地', d['owner-address'] || d.address]].filter((r) => r[1]);
    if (owRows.length) ow += '<table class="spec">' + owRows.map((r) => '<tr><th>' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>';
    sec('owner', '運営者について', ow);
    // 予約・連絡
    let ct = '<p class="cta"><a class="btn big" href="' + esc(href) + '" ' + (href.startsWith('#') ? '' : 'target="_blank" rel="noopener"') + '>' + esc(bookLabel) + '</a></p>';
    const subs = lines(d['book-sub']).map(splitPipe).filter((x) => isUrl(x[1]));
    const btns = subs.map(([n, u]) => '<a class="btn sub" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(n) + '</a>');
    if (isUrl(d.line) && d['book-type'] !== 'line') btns.push('<a class="btn sub line" href="' + esc(d.line) + '" target="_blank" rel="noopener">LINEで問い合わせ</a>');
    if (isUrl(d.insta)) btns.push('<a class="btn sub" href="' + esc(d.insta) + '" target="_blank" rel="noopener">Instagram</a>');
    if (d.tel) btns.push('<a class="btn sub" href="tel:' + esc(d.tel.replace(/[^\d+]/g, '')) + '">電話 ' + esc(d.tel) + '</a>');
    if (d.mail) btns.push('<a class="btn sub" href="mailto:' + esc(d.mail) + '">メール</a>');
    lines(d.links).map(splitPipe).filter((x) => isUrl(x[1])).forEach(([n, u]) => btns.push('<a class="btn sub" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(n) + '</a>'));
    if (btns.length) ct += '<div class="btns">' + btns.join('') + '</div>';
    if (d['contact-note']) ct += '<p class="note">' + esc(d['contact-note']) + '</p>';
    sec('contact', 'ご予約・お問い合わせ', ct, 'contact');

    // JSON-LD
    const ld = { '@context': 'https://schema.org', '@type': g.schema || 'LocalBusiness', name: shop, description: desc };
    if (d.address) ld.address = { '@type': 'PostalAddress', streetAddress: d.address, addressCountry: 'JP' };
    if (d.tel) ld.telephone = d.tel;
    if (d.mail) ld.email = d.mail;
    if (isUrl(d['book-url'])) ld.url = d['book-url'];
    const firstPrice = pr.find((r) => r.wd || r.we); if (firstPrice) ld.priceRange = (firstPrice.wd || firstPrice.we) + '〜';
    const same = [d.insta, d.line, d.gbp].filter(isUrl); if (same.length) ld.sameAs = same;

    const badges = g.spec.filter((f) => f.badge && S.spec[f.id]).slice(0, 3).map((f) => '<span>' + esc(f.label) + ' ' + esc(S.spec[f.id]) + (f.unit && !/[^\d.,〜~-]/.test(S.spec[f.id]) ? esc(f.unit) : '') + '</span>');
    if (firstPrice) badges.push('<span>' + esc(firstPrice.wd || firstPrice.we) + '〜/' + esc(d['price-unit']) + '</span>');
    if (st[0]) { const m = st[0].match(/徒歩\s*\d+\s*分/); if (m) badges.push('<span>' + esc(m[0]) + '</span>'); }

    const bg = dark ? '#141414' : '#ffffff', ink = dark ? '#f2f2f2' : '#1a1a1a', ink2 = dark ? '#c8c8c8' : '#4a4a4a', card = dark ? '#1f1f1f' : '#ffffff', line = dark ? '#333' : '#e6e6e6', soft = dark ? '#1a1a1a' : '#f6f6f6';

    return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="${esc(color)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>
  :root{--c:${color};--bg:${bg};--ink:${ink};--ink2:${ink2};--card:${card};--line:${line};--soft:${soft};--r:10px}
  *{box-sizing:border-box}
  html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:"Hiragino Sans","Noto Sans JP","Yu Gothic",system-ui,sans-serif;line-height:1.8;font-feature-settings:"palt";padding-bottom:72px}
  a{color:var(--c)}
  img{max-width:100%}
  .in{max-width:880px;margin:0 auto;padding:0 18px}
  header.top{position:sticky;top:0;z-index:5;background:${dark ? 'rgba(20,20,20,.92)' : 'rgba(255,255,255,.94)'};backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
  header.top .in{display:flex;align-items:center;gap:14px;height:56px}
  .brand{font-weight:700;font-size:16px;color:var(--ink);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none;max-width:46%}
  nav.g{margin-left:auto;display:flex;gap:2px;overflow-x:auto;scrollbar-width:none}
  nav.g::-webkit-scrollbar{display:none}
  nav.g a{font-size:12.5px;color:var(--ink2);text-decoration:none;padding:6px 8px;white-space:nowrap;font-weight:500}
  nav.g a:hover{color:var(--c)}
  header.top .btn{padding:8px 14px;font-size:13px;white-space:nowrap;display:none}
  @media(min-width:720px){header.top .btn{display:inline-block}}
  .hero{position:relative;color:#fff;background:linear-gradient(135deg,var(--c),#111)}
  .hero.ph{background:#222}
  .hero.ph img.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}
  .hero .in{position:relative;padding:64px 18px 56px;min-height:380px;display:flex;flex-direction:column;justify-content:flex-end}
  .hero .area{font-size:13px;letter-spacing:.1em;opacity:.9;font-weight:700}
  .hero h1{font-size:clamp(24px,5.2vw,40px);line-height:1.3;margin:6px 0 12px;text-shadow:0 2px 12px rgba(0,0,0,.35)}
  .hero p.lead{font-size:15.5px;max-width:600px;margin:0 0 16px;opacity:.95;text-shadow:0 1px 8px rgba(0,0,0,.35)}
  .badges{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
  .badges span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:700;backdrop-filter:blur(4px)}
  .uses{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 20px}
  .uses span{font-size:12.5px;background:rgba(0,0,0,.35);border-radius:6px;padding:3px 10px}
  .btn{display:inline-block;background:var(--c);color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px;font-size:15px;box-shadow:0 6px 18px rgba(0,0,0,.18);transition:transform .15s}
  .btn:hover{transform:translateY(-1px)}
  .btn.big{font-size:17px;padding:16px 34px}
  .btn.sub{background:var(--card);color:var(--c);border:2px solid var(--c);box-shadow:none;padding:10px 18px;font-size:14px}
  .btn.sub.line{border-color:#06c755;color:#06c755}
  .hero .btn.sub{background:transparent;color:#fff;border-color:#fff}
  .hero .cta{display:flex;gap:10px;flex-wrap:wrap;margin:0}
  .sec{padding:44px 0;border-bottom:1px solid var(--line)}
  .sec:nth-of-type(even){background:var(--soft)}
  .sec h2{font-size:22px;margin:0 0 18px;padding-left:14px;border-left:5px solid var(--c);line-height:1.3}
  .sec h3{font-size:15.5px;margin:18px 0 6px;color:var(--c)}
  .sec ul,.sec ol{padding-left:22px;margin:6px 0}
  .sec li{margin:4px 0}
  ul.small{font-size:13px;color:var(--ink2)}
  .note{font-size:13.5px;color:var(--ink2);background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:10px 14px}
  .news{list-style:none;padding:0;margin:0}
  .news li{display:flex;gap:14px;padding:8px 0;border-bottom:1px dashed var(--line);font-size:14.5px}
  .news time{color:var(--c);font-weight:700;white-space:nowrap}
  .pts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
  .pt{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 16px}
  .pt b{display:block;font-size:16.5px;color:var(--c);margin-bottom:6px}
  .pt p{margin:0;font-size:14.5px;color:var(--ink2)}
  table.spec{width:100%;border-collapse:collapse;background:var(--card);font-size:14.5px}
  table.spec th,table.spec td{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}
  table.spec th{width:34%;background:var(--soft);font-weight:700;color:var(--ink2)}
  .tw{overflow-x:auto}
  table.price{width:100%;border-collapse:collapse;background:var(--card);font-size:15px;min-width:320px}
  table.price th,table.price td{border:1px solid var(--line);padding:12px 10px;text-align:left}
  table.price th{background:var(--c);color:#fff;font-weight:700;font-size:13.5px}
  table.price td.y{font-weight:700;font-size:17px;white-space:nowrap}
  .unit{font-size:13px;color:var(--ink2);margin:6px 0 0}
  .eg{margin:0 0 10px}
  ul.tags{list-style:none;padding:0;margin:4px 0 0;display:flex;flex-wrap:wrap;gap:6px}
  ul.tags li{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:5px 11px;font-size:13.5px;margin:0}
  ul.tags li::before{content:"✓ ";color:var(--c);font-weight:700}
  .gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .gal figure{margin:0}
  .gal img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r);border:1px solid var(--line);cursor:zoom-in}
  .gal figcaption{font-size:13px;color:var(--ink2);margin-top:4px}
  .addr{font-weight:700;font-size:16px;margin:0 0 6px}
  ul.st{list-style:none;padding:0;margin:0 0 8px}
  ul.st li::before{content:"🚉 "}
  .map{position:relative;padding-top:56%;border-radius:var(--r);overflow:hidden;border:1px solid var(--line);margin:14px 0}
  .map iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
  ul.rules li{margin:6px 0}
  details{background:var(--card);border:1px solid var(--line);border-radius:var(--r);margin:0 0 8px;overflow:hidden}
  summary{cursor:pointer;list-style:none;padding:14px 16px;font-weight:700;font-size:15px;display:flex;gap:10px}
  summary::-webkit-details-marker{display:none}
  summary::before{content:"Q";color:var(--c);font-weight:700}
  .a{padding:0 16px 14px 38px;font-size:14.5px;color:var(--ink2)}
  .voices{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
  blockquote{margin:0;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px}
  blockquote p{margin:0 0 6px;font-size:14.5px}
  blockquote cite{font-style:normal;font-size:12.5px;color:var(--ink2)}
  .msg{font-size:15px;background:var(--card);border-left:4px solid var(--c);padding:14px 16px;border-radius:0 var(--r) var(--r) 0}
  .cta{text-align:center;margin:18px 0 0}
  .btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:14px 0 0}
  .sec.contact{text-align:center}
  .sec.contact h2{text-align:left}
  footer{padding:26px 0 30px;font-size:12.5px;color:var(--ink2);text-align:center}
  footer a{color:var(--ink2)}
  .fix{position:fixed;left:0;right:0;bottom:0;z-index:6;background:${dark ? 'rgba(20,20,20,.94)' : 'rgba(255,255,255,.96)'};border-top:1px solid var(--line);padding:10px 14px;display:flex;gap:8px;justify-content:center;backdrop-filter:blur(8px)}
  .fix .btn{flex:1;max-width:420px;text-align:center;padding:13px 16px}
  @media(min-width:720px){.fix{display:none}body{padding-bottom:0}}
  .lb{position:fixed;inset:0;background:rgba(0,0,0,.9);display:none;place-items:center;z-index:20;cursor:zoom-out}
  .lb.on{display:grid}
  .lb img{max-width:96vw;max-height:92vh;object-fit:contain}
</style>
</head>
<body>
<header class="top"><div class="in"><a class="brand" href="#top">${esc(shop)}</a><nav class="g">${navs.join('')}</nav><a class="btn" href="${esc(href)}" ${href.startsWith('#') ? '' : 'target="_blank" rel="noopener"'}>${esc(bookLabel)}</a></div></header>
<div class="hero${heroPhoto ? ' ph' : ''}" id="top">${heroPhoto ? '<img class="bg" src="' + heroPhoto.src + '" alt="">' : ''}<div class="in">
  ${d.area ? '<div class="area">' + esc(d.area) + ' / ' + esc(g.label) + '</div>' : ''}
  <h1>${esc(d.catch || shop)}</h1>
  ${d.lead ? '<p class="lead">' + esc(d.lead).replace(/\n/g, '<br>') + '</p>' : ''}
  ${badges.length ? '<div class="badges">' + badges.join('') + '</div>' : ''}
  ${uses.length ? '<div class="uses">' + uses.map((u) => '<span>' + esc(u) + '</span>').join('') + '</div>' : ''}
  <p class="cta"><a class="btn big" href="${esc(href)}" ${href.startsWith('#') ? '' : 'target="_blank" rel="noopener"'}>${esc(bookLabel)}</a>${pr.length ? '<a class="btn sub" href="#price">料金を見る</a>' : ''}</p>
</div></div>
<main>
${secs.join('\n')}
</main>
<footer><div class="in">${d.owner ? esc(d.owner) + ' ／ ' : ''}${esc(shop)}${d.address ? '<br>' + esc(d.address) : ''}<br>© ${new Date().getFullYear()} ${esc(shop)} ・ 更新 ${today()}</div></footer>
<div class="fix"><a class="btn" href="${esc(href)}" ${href.startsWith('#') ? '' : 'target="_blank" rel="noopener"'}>${esc(bookLabel)}</a>${isUrl(d.line) && d['book-type'] !== 'line' ? '<a class="btn sub line" href="' + esc(d.line) + '" target="_blank" rel="noopener">LINE</a>' : d.tel && d['book-type'] !== 'tel' ? '<a class="btn sub" href="tel:' + esc(d.tel.replace(/[^\d+]/g, '')) + '">電話</a>' : ''}</div>
<div class="lb" id="lb"><img alt=""></div>
<script>
(function(){var lb=document.getElementById('lb'),im=lb.querySelector('img');document.querySelectorAll('.gal img').forEach(function(i){i.addEventListener('click',function(){im.src=i.src;lb.classList.add('on');});});lb.addEventListener('click',function(){lb.classList.remove('on');});})();
<\/script>
</body>
</html>`;
  }

  // ---- 出力 ----
  function renderPreview() {
    const f = $('preview-frame'); f.srcdoc = buildHtml();
  }
  function downloadBlob(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  async function copyText(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(okMsg); } catch (e2) { toast('コピーできませんでした'); } ta.remove(); }
  }

  // ---- init ----
  function init() {
    applyData(ls.get(SAVE_KEY, null));
    renderGenres();
    if (S.genre) { renderChips(); renderSpec(); renderPrice(); renderEquip(); renderRules(); renderFaq(); renderPhotoGuide(); }
    TEXT_IDS.forEach((id) => $(id).addEventListener('input', save));
    BOOL_IDS.forEach((id) => $(id).addEventListener('change', save));
    $('use-add').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const v = $('use-add').value.trim(); if (v) { if (!S.useExtra.includes(v)) S.useExtra.push(v); if (!S.uses.includes(v)) S.uses.push(v); $('use-add').value = ''; renderChips(); save(); } } });
    $('price-add').addEventListener('click', () => { $('price-body').appendChild(priceRow({ name: '', wd: '', we: '' })); });
    $('price-preset').addEventListener('click', () => { S.price = G().priceRows.map((r) => Object.assign({}, r)); renderPrice(); save(); });
    $('faq-add').addEventListener('click', () => { data(); S.faq.push({ q: '', a: '' }); renderFaq(); save(); });
    $('faq-more').addEventListener('click', () => { const c = $('faq-chips'); c.style.display = c.style.display === 'flex' ? 'none' : 'flex'; if (!c.children.length) toast('候補は全部使っています'); });
    $('addph-btn').addEventListener('click', () => $('addph').click());
    $('addph').addEventListener('change', (e) => { addPhotos(e.target.files); e.target.value = ''; });
    $('prev').addEventListener('click', () => go(S.step - 1));
    $('next').addEventListener('click', () => { if (S.step === STEPS) { toast('おつかれさまでした。ダウンロードして公開しましょう'); return; } go(S.step + 1); });
    $('reset').addEventListener('click', () => { if (confirm('入力した内容と写真をすべて消して最初からにしますか?')) { ls.del(SAVE_KEY); location.reload(); } });
    $('dl-html').addEventListener('click', () => downloadBlob(new Blob([buildHtml()], { type: 'text/html;charset=utf-8' }), 'index.html'));
    $('copy-html').addEventListener('click', () => copyText(buildHtml(), 'HTMLをコピーしました'));
    $('preview-open').addEventListener('click', () => { const w = window.open('', '_blank'); if (!w) { toast('ポップアップがブロックされました'); return; } w.document.open(); w.document.write(buildHtml()); w.document.close(); });
    $('preview-toggle').addEventListener('click', () => { const w = $('preview-wrap'); w.classList.toggle('mobile'); const m = w.classList.contains('mobile'); $('preview-label').textContent = m ? 'スマホ表示' : 'PC表示'; $('preview-toggle').textContent = m ? 'PC表示にする' : 'スマホ表示にする'; });
    $('dl-json').addEventListener('click', () => downloadBlob(new Blob([JSON.stringify(data())], { type: 'application/json' }), 'hp-maker-' + ($('shop').value || 'backup').replace(/[\\/:*?"<>|\s]/g, '_') + '.json'));
    $('up-json-btn').addEventListener('click', () => $('up-json').click());
    $('up-json').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { const d = JSON.parse(r.result); if (!d || !d.genre) throw 0; applyData(d); save(); location.reload(); } catch (err) { toast('読み込めないファイルです'); } };
      r.readAsText(f); e.target.value = '';
    });
    go(S.step);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
