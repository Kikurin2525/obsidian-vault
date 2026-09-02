// ダンスレンタルスタジオ 物件判定ツール(静的版) — ブラウザ内で完結。データは data/ から都道府県ごとに読み込む
(function () {
  'use strict';
  const GATE_WORD = 'kikurin';
  const GATE_KEY = 'bukken-gate-ok';
  const SIM_KEY = 'studio-bukken-sim-params';
  const HIST_KEY = 'bukken-history';
  const REC_KEY = 'bukken-recommended';
  const FETCH_PROXY = 'https://bukken-fetch.kikurin.workers.dev/?url=';
  const DATA_BASE = 'data/';
  const PREFS = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const man = (yen) => (yen / 10000).toFixed(1) + '万円';
  const fmtDate = (ts) => { const d = new Date(ts); return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const badgeClass = { '◎': 'b-good', '○': 'b-ok', '△': 'b-warn', '✕': 'b-bad', '?': 'b-unk' };
  const chipClass = { '◎': 'c-good', '○': 'c-ok', '△': 'c-warn', '✕': 'c-bad', '?': 'c-unk' };
  const pillClass = { go: 'p-go', maybe: 'p-maybe', cond: 'p-cond', ng: 'p-ng' };
  const ls = { get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (_) { return fb; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };

  let lastProp = null, lastOpts = {}, lastData = null;
  let dataIndex = null; const loadedPrefs = new Set(); const statsIndex = {};

  // ===== 合言葉ゲート =====
  function gateOk() { return ls.get(GATE_KEY, false) === true; }
  function checkGate() {
    const v = ($('gate-input').value || '').trim().toLowerCase();
    if (v === GATE_WORD) { ls.set(GATE_KEY, true); showApp(); }
    else { $('gate-error').style.display = 'block'; }
  }
  function showApp() { $('gate').style.display = 'none'; $('app').style.display = 'block'; }

  // ===== データ読み込み(都道府県ごと) =====
  async function loadIndex() {
    if (dataIndex) return dataIndex;
    const r = await fetch(DATA_BASE + 'index.json'); dataIndex = await r.json();
    return dataIndex;
  }
  async function loadPref(code) {
    if (!code || loadedPrefs.has(code)) return;
    const r = await fetch(DATA_BASE + 'pref/' + code + '.json');
    if (!r.ok) { loadedPrefs.add(code); return; }
    const d = await r.json();
    for (const [name, cands] of Object.entries(d.stations)) { (statsIndex[name] = statsIndex[name] || []).push(...cands); }
    loadedPrefs.add(code);
  }
  // 物件の駅名・住所から必要な都道府県データを読む
  async function ensureData(prop) {
    const idx = await loadIndex();
    const codes = new Set();
    const addr = String(prop.address || '');
    const pi = PREFS.findIndex((p) => addr.startsWith(p));
    if (pi >= 0) codes.add(String(pi + 1).padStart(2, '0'));
    for (const s of prop.stations || []) { for (const c of idx.index[s.station] || idx.index[String(s.station).replace(/駅$/, '')] || []) codes.add(c); }
    await Promise.all([...codes].map(loadPref));
    Score.setData({ statsIndex, stationData: recommendedAsStationData() });
  }
  // おすすめ駅(+2)はユーザーが自分で管理(初期値=data/recommended.json)
  let recommended = null;
  async function loadRecommended() {
    if (recommended) return recommended;
    const saved = ls.get(REC_KEY, null);
    if (saved) { recommended = saved; return recommended; }
    try { const r = await fetch(DATA_BASE + 'recommended.json'); recommended = await r.json(); } catch (_) { recommended = []; }
    return recommended;
  }
  function recommendedAsStationData() { const o = {}; for (const n of recommended || []) o[n] = { priority: true }; return o; }
  function saveRecommended(list) { recommended = list; ls.set(REC_KEY, list); }

  // ===== 損益分岐の設定 =====
  function loadSimParams() { return Object.assign({ autoRates: true }, Breakeven.DEFAULTS, ls.get(SIM_KEY, {})); }
  function simParamsForApi(p) { const o = Object.assign({}, p); if (o.autoRates) { delete o.weekdayRate; delete o.weekendRate; } delete o.autoRates; return o; }
  function effectiveSimParams(d, p) { if (!p.autoRates || !d || !d.breakeven || !d.breakeven.suggested) return p; return Object.assign({}, p, { weekdayRate: d.breakeven.suggested.weekdayRate, weekendRate: d.breakeven.suggested.weekendRate }); }
  function readSimForm() {
    const num = (id, fb) => { const el = $(id); const v = Number(el.value); return Number.isFinite(v) && el.value !== '' ? v : fb; };
    const d = Breakeven.DEFAULTS;
    return { autoRates: $('sim-auto').checked, weekdayRate: num('sim-wd', d.weekdayRate), weekendRate: num('sim-we', d.weekendRate), portalShare: num('sim-portal', d.portalShare * 100) / 100, openHours: num('sim-hours', d.openHours), otherCosts: num('sim-other', d.otherCosts) };
  }
  function fillSimForm(p, d) {
    const eff = effectiveSimParams(d, p);
    $('sim-auto').checked = !!p.autoRates; $('sim-wd').value = eff.weekdayRate; $('sim-we').value = eff.weekendRate;
    $('sim-wd').disabled = !!p.autoRates; $('sim-we').disabled = !!p.autoRates;
    $('sim-portal').value = Math.round(p.portalShare * 100); $('sim-hours').value = p.openHours; $('sim-other').value = p.otherCosts;
  }
  let rejudgeTimer = null;
  function onSimChange() {
    const p = readSimForm(); ls.set(SIM_KEY, p);
    $('sim-wd').disabled = p.autoRates; $('sim-we').disabled = p.autoRates;
    if (!lastData) return;
    if (p.autoRates) fillSimForm(p, lastData);
    renderBreakeven(lastData, effectiveSimParams(lastData, p));
    clearTimeout(rejudgeTimer);
    rejudgeTimer = setTimeout(() => rejudge({}), 500);
  }

  // ===== 判定 =====
  async function runJudge(prop, opts) {
    await loadRecommended();
    await ensureData(prop);
    const merged = Object.assign({ sim: simParamsForApi(loadSimParams()) }, opts || {});
    const d = Score.judge(prop, merged);
    d.url = prop.url || null; d.ridersOverride = merged.riders || null; d.residentialOverride = merged.residential || null;
    lastProp = prop; lastOpts = merged; lastData = d;
    render(d);
    pushHistory(prop, d);
    return d;
  }
  function rejudge(extra) {
    if (!lastProp) return;
    const o = Object.assign({}, lastOpts, extra || {});
    o.sim = simParamsForApi(loadSimParams());
    const d = Score.judge(lastProp, o);
    d.url = lastProp.url || null; d.ridersOverride = o.riders || null; d.residentialOverride = o.residential || null;
    lastOpts = o; lastData = d; render(d);
  }
  window.rejudgeWithRiders = () => { const v = Number($('riders-input').value); if (v) rejudge({ riders: v }); };
  window.rejudgeWithResidential = () => {
    const type = $('res-type').value; if (!type) { showError('駅前の性格を選んでください'); return; }
    rejudge({ residential: { type, kids: $('res-kids').value, night: $('res-night').checked } });
  };

  // ===== 入力: URL(Worker経由) / ブックマークレット / PDF / 手入力 =====
  function showError(msg) { const e = $('error'); e.textContent = msg; e.style.display = 'block'; }
  function clearMsgs() { $('error').style.display = 'none'; $('notice').style.display = 'none'; }
  function busy(on, label) { const b = $('btn'); b.disabled = on; b.textContent = on ? (label || '判定中…') : '判定する'; }

  async function judgeUrl() {
    const url = ($('url').value || '').trim();
    if (!url) return;
    clearMsgs();
    if (!/^https:\/\/(www\.)?athome\.co\.jp\/[a-z_]+\/\d{6,}\/?$/.test(url.split('?')[0])) { showError('athomeの物件URL(https://www.athome.co.jp/rent_store/番号/)を1件入れてください'); return; }
    busy(true, '取得中…');
    try {
      const r = await fetch(FETCH_PROXY + encodeURIComponent(url.split('?')[0]));
      if (!r.ok) {
        let msg = '取得に失敗しました';
        try { const j = await r.json(); msg = j.message || j.error || msg; } catch (_) {}
        throw new Error(msg + '。下の「ブックマークレット」「PDF」「手入力」のどれかで読み込んでください');
      }
      const html = await r.text();
      const prop = Parsers.fromCapture(Parsers.captureFromHtml(html, url.split('?')[0]));
      await runJudge(prop, {});
      $('result').scrollIntoView({ behavior: 'smooth' });
    } catch (e) { showError(e.message); }
    finally { busy(false); }
  }
  async function judgeFromHash() {
    const m = location.hash.match(/#cap=([A-Za-z0-9+/=]+)/);
    if (!m) return false;
    try {
      const json = decodeURIComponent(escape(atob(m[1])));
      const cap = JSON.parse(json);
      history.replaceState(null, '', location.pathname);
      const prop = Parsers.fromCapture(cap);
      $('url').value = prop.url || '';
      await runJudge(prop, {});
      $('result').scrollIntoView({ behavior: 'smooth' });
      return true;
    } catch (e) { showError('ブックマークレットのデータを読めませんでした: ' + e.message); return false; }
  }
  async function judgePdf() {
    const f = $('pdf').files[0]; if (!f) return;
    clearMsgs(); busy(true, 'PDF解析中…');
    try {
      if (!window.pdfjsLib) throw new Error('PDF解析ライブラリを読み込めませんでした(通信環境を確認してください)');
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); const tc = await page.getTextContent();
        let line = '', lastY = null;
        for (const it of tc.items) { if (lastY !== null && Math.abs(it.transform[5] - lastY) > 2) { text += line + '\n'; line = ''; } line += (line && it.hasEOL === false ? '\t' : '') + it.str; lastY = it.transform[5]; }
        text += line + '\n';
      }
      const prop = Parsers.fromPdfText(text);
      await runJudge(prop, {});
      $('result').scrollIntoView({ behavior: 'smooth' });
    } catch (e) { showError(e.message); }
    finally { busy(false); $('pdf').value = ''; }
  }
  async function judgeManual() {
    clearMsgs();
    const f = {};
    ['title', 'pref', 'city', 'addr', 'rentMan', 'mgmtMan', 'area', 'shikikin', 'hoshokin', 'reikin', 'built', 'structure', 'building', 'floor', 'line', 'station', 'walk', 'genkyo', 'contract'].forEach((k) => { f[k] = $('m-' + k).value; });
    f.oneTenant = $('m-oneTenant').checked; f.h24 = $('m-h24').checked;
    try {
      const prop = Parsers.fromManual(f);
      await runJudge(prop, {});
      $('result').scrollIntoView({ behavior: 'smooth' });
    } catch (e) { showError(e.message); }
  }

  // ===== 履歴(このブラウザのみ) =====
  function pushHistory(prop, d) {
    const list = ls.get(HIST_KEY, []);
    const key = prop.url || (prop.address + '|' + prop.rentYen + '|' + prop.areaSqm);
    const entry = { key, ts: Date.now(), address: prop.address, title: prop.title, verdict: d.verdict, verdictClass: d.verdictClass, total: d.total, url: prop.url || null, prop, opts: lastOpts };
    const rest = list.filter((e) => e.key !== key);
    ls.set(HIST_KEY, [entry].concat(rest).slice(0, 50));
    renderHistory();
  }
  function renderHistory() {
    const list = ls.get(HIST_KEY, []);
    if (!list.length) { $('history-sec').style.display = 'none'; return; }
    $('history-sec').style.display = 'block';
    $('history-table').innerHTML = '<tr><th>判定日時</th><th>物件</th><th>判定</th><th>点</th><th></th></tr>' + list.map((e, i) =>
      '<tr class="clickable" data-i="' + i + '"><td class="muted" style="white-space:nowrap">' + fmtDate(e.ts) + '</td><td>' + esc((e.address || e.title || '').slice(0, 40)) + '</td>'
      + '<td><span class="pill ' + (pillClass[e.verdictClass] || 'p-wait') + '">' + esc(e.verdict) + '</span></td><td>' + e.total + '</td>'
      + '<td>' + (e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener" class="muted" onclick="event.stopPropagation()">athome↗</a>' : '<span class="muted">' + (e.prop && e.prop.source === 'pdf' ? 'PDF' : '手入力') + '</span>') + '</td></tr>').join('');
    $('history-table').querySelectorAll('tr.clickable').forEach((tr) => tr.onclick = async () => { const e = list[Number(tr.dataset.i)]; await runJudge(e.prop, e.opts || {}); $('result').scrollIntoView({ behavior: 'smooth' }); });
  }
  window.clearHistory = () => { if (confirm('このブラウザの判定履歴を消しますか?')) { ls.set(HIST_KEY, []); renderHistory(); } };

  // ===== 描画(Mac版と同じ見た目) =====
  function render(d) {
    const p = d.property;
    const v = $('verdict');
    v.className = 'hero ' + d.verdictClass;
    v.innerHTML = '<div class="ring" style="--p:' + d.total + '"><b>' + d.total + '</b><small>/ 100</small></div>'
      + '<div><div class="v-label">' + esc(d.verdict) + '</div>' + (d.verdictNote ? '<div class="v-note">' + esc(d.verdictNote) + '</div>' : '')
      + '<div class="v-title">' + esc(p.address || '') + (p.title ? ' ｜ ' + esc(String(p.title).slice(0, 60)) : '') + '</div></div>';
    const rent = (p.rentYen || 0) + (p.mgmtYen || 0);
    const rentItem = d.items.find((i) => i.key === 'rent') || {};
    const tsuboItem = d.items.find((i) => i.key === 'tsubo') || {};
    $('kpi-rent').innerHTML = '<div class="k-label">家賃(管理費込)</div><div class="k-value">' + man(rent) + '<span class="grade-chip ' + (chipClass[rentItem.grade] || 'c-unk') + '">' + (rentItem.grade || '?') + '</span></div>'
      + '<div class="k-sub">坪単価 ' + (p.tsuboTankaYen ? p.tsuboTankaYen.toLocaleString() + '円' : (p.tsubo ? Math.round(rent / p.tsubo).toLocaleString() + '円' : '—')) + (tsuboItem.grade ? ' ' + tsuboItem.grade : '') + ' ／ ' + (p.areaSqm != null ? p.areaSqm + '㎡' : '—') + (p.tsubo ? '(' + p.tsubo + '坪)' : '') + '</div>';
    const initItem = d.items.find((i) => i.key === 'initial') || {};
    $('kpi-init').innerHTML = '<div class="k-label">初期費用(概算)</div><div class="k-value">' + esc((initItem.value || '—').replace(/\(.*$/, '')) + '<span class="grade-chip ' + (chipClass[initItem.grade] || 'c-unk') + '">' + (initItem.grade || '?') + '</span></div>'
      + '<div class="k-sub">' + esc((initItem.value || '').replace(/^[^(]*\(?/, '').replace(/\)$/, '')) + '</div>';
    const ngbox = $('ngbox');
    if (d.ng.length) { ngbox.style.display = 'block'; ngbox.innerHTML = '<b>必須条件NG:</b><ul>' + d.ng.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul>'; } else ngbox.style.display = 'none';

    $('items').innerHTML = d.items.map((it) =>
      '<div class="card item"><div class="i-head"><span class="badge ' + (badgeClass[it.grade] || 'b-unk') + '">' + it.grade + '</span>'
      + '<div><div class="i-label">' + esc(it.label) + '</div><div class="i-value">' + esc(it.value) + '</div></div></div>'
      + '<div class="i-comment">' + esc(it.comment) + '</div>'
      + (it.key === 'station' && it.station
        ? '<div class="riders-form"><span>' + esc(it.station) + '駅 1日乗降客数</span><input type="number" id="riders-input" min="0" step="1000" placeholder="例: 45000"><button onclick="rejudgeWithRiders()">この値で再判定</button></div>' : '')
      + (it.key === 'residential' && it.residentialSource !== 'stats'
        ? '<div class="riders-form res-form"><select id="res-type"><option value="">駅前の性格を選ぶ</option><option value="residential">住宅街</option><option value="mixed">商店街・住宅混在</option><option value="student">学生街</option><option value="tourist">観光地</option><option value="business">ビジネス街</option><option value="downtown">繁華街</option></select>'
          + '<select id="res-kids"><option value="normal">子育て世帯: ふつう</option><option value="many">子育て世帯: 多い</option><option value="few">子育て世帯: 少ない</option></select>'
          + '<label style="display:flex;align-items:center;gap:4px"><input type="checkbox" id="res-night" style="margin:0">夜の街(飲み屋・深夜営業が目立つ)</label>'
          + '<button onclick="rejudgeWithResidential()">この観察で再判定</button></div>' : '')
      + '</div>').join('');

    $('score').innerHTML = Object.entries(d.breakdown).map(([k, b], i) =>
      '<tr><th>' + esc(k) + (b.desc ? ' <button type="button" class="info" title="' + esc(b.desc) + '" onclick="toggleDesc(' + i + ')" aria-label="説明">i</button>' : '') + '</th>'
      + '<td style="width:45%"><div class="scorebar"><i style="width:' + (b.pts / b.max * 100) + '%"></i></div></td><td style="text-align:right;white-space:nowrap">' + b.pts + ' / ' + b.max + '</td></tr>'
      + (b.desc ? '<tr class="desc-row" id="desc-' + i + '" style="display:none"><td colspan="3">' + esc(b.desc) + '</td></tr>' : '')).join('')
      + '<tr class="total"><th>合計</th><td></td><td style="text-align:right">' + d.total + ' / 100</td></tr>';

    const sp = loadSimParams(); fillSimForm(sp, d); renderBreakeven(d, effectiveSimParams(d, sp));
    $('questions').innerHTML = d.questions.map((q) => '<li>' + esc(q) + '</li>').join('');
    $('result').style.display = 'block';
  }
  function gradeOcc(occ) { return occ <= 30 ? '◎' : occ <= 35 ? '○' : occ <= 40 ? '△' : '✕'; }
  function commentOcc(occ) {
    return occ <= 30 ? '立ち上がり期の稼働(30%前後)でも黒字になる低い水準。家賃リスク小' : occ <= 35 ? '安定期に入れば十分届く水準。立ち上がり数ヶ月の赤字は覚悟しておく'
      : occ <= 40 ? '安定期の稼働(35〜40%)が黒字の前提。立ち上がりに時間がかかると赤字が続くリスク' : '繁盛店クラスの稼働(40%超)が前提。家賃が重すぎるか、単価が低すぎる';
  }
  function renderBreakeven(d, params) {
    const be = Breakeven.calc(d.breakeven.rent, params);
    const occ = be.breakevenOcc; const g = Number.isFinite(occ) ? gradeOcc(occ) : '?'; const occText = Number.isFinite(occ) ? occ.toFixed(1) : '—';
    const basis = (params.autoRates !== false && d.breakeven.suggested) ? d.breakeven.suggested.basis + '・自動' : '手入力';
    $('kpi-occ').innerHTML = '<div class="k-label">黒字化に必要な稼働率</div><div class="k-value">' + occText + '<span>%</span><span class="grade-chip">' + g + '</span></div>'
      + '<div class="k-sub">1日' + (be.breakevenHours / 30).toFixed(1) + '時間の予約(月' + be.breakevenHours.toLocaleString() + 'h) ／ 単価 平日' + be.params.weekdayRate.toLocaleString() + '・休日' + be.params.weekendRate.toLocaleString() + '円</div>';
    const nextHit = be.sim.find((s) => s.profit >= 0);
    $('be').innerHTML = '<div class="be-big"><div class="num">' + occText + '<span>%</span></div><div class="lbl">黒字化に必要な稼働率<b>1日' + (be.breakevenHours / 30).toFixed(1) + '時間の予約(営業' + be.params.openHours + 'h/日のうち ／ 月' + be.breakevenHours.toLocaleString() + 'h)</b></div>'
      + '<span class="grade-chip ' + (chipClass[g] || 'c-unk') + '" style="font-size:16px;padding:4px 12px">' + g + '</span></div>'
      + '<div class="be-note">' + esc(commentOcc(occ)) + '。目安: 30%以下=◎ / 35%以下=○ / 40%以下=△ / 40%超=✕</div>'
      + '<div class="be-basis">計算条件: 家賃' + man(be.rent) + '(管理費込)+固定費' + man(be.params.otherCosts) + ' ／ 単価 平日' + be.params.weekdayRate + '円・休日' + be.params.weekendRate + '円[' + esc(basis) + '] ／ ポータル' + Math.round(be.params.portalShare * 100) + '% ／ 手取り単価 平日' + be.netWeekday + '円・休日' + be.netWeekend + '円</div>'
      + '<table class="sim"><tr><th>稼働率</th><th>予約時間/日</th><th>売上(お客様支払)</th><th>手取り(手数料後)</th><th>月損益</th></tr>'
      + be.sim.map((s) => '<tr' + (nextHit && s.occ === nextHit.occ ? ' class="hit"' : '') + '><td>' + s.occ + '%</td><td title="月' + s.hours.toLocaleString() + 'h">' + (s.hours / 30).toFixed(1) + 'h</td><td>¥' + s.gross.toLocaleString() + '</td><td>¥' + s.net.toLocaleString() + '</td><td class="' + (s.profit >= 0 ? 'plus' : 'minus') + '">' + (s.profit >= 0 ? '+' : '') + '¥' + s.profit.toLocaleString() + '</td></tr>').join('') + '</table>';
  }
  window.toggleDesc = (i) => { const row = $('desc-' + i); if (row) row.style.display = row.style.display === 'none' ? 'table-row' : 'none'; };
  window.toggleHint = (id) => { const el = $(id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; };
  window.copyQuestions = () => { if (!lastData) return; navigator.clipboard.writeText('お世話になっております。掲載中の「' + (lastData.property.title || '物件') + '」について、以下ご確認させてください。\n\n' + lastData.questions.map((q, i) => (i + 1) + '. ' + q).join('\n')); };

  // ===== おすすめ駅の編集 =====
  async function renderRecommended() {
    await loadRecommended();
    $('rec-text').value = (recommended || []).join('、');
  }
  window.saveRecommendedFromForm = () => {
    const list = [...new Set($('rec-text').value.split(/[、,\s\n]+/).map((s) => s.trim().replace(/駅$/, '')).filter(Boolean))];
    saveRecommended(list); $('rec-saved').style.display = 'inline'; setTimeout(() => { $('rec-saved').style.display = 'none'; }, 1500);
    if (lastProp) rejudge({});
  };

  // ===== 入力タブ切替 =====
  window.showTab = (name) => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === name));
    document.querySelectorAll('.tabpane').forEach((p) => { p.style.display = p.id === 'tab-' + name ? 'block' : 'none'; });
  };

  // ===== 起動 =====
  document.addEventListener('DOMContentLoaded', async () => {
    $('gate-btn').addEventListener('click', checkGate);
    $('gate-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkGate(); });
    if (gateOk()) showApp();
    $('btn').addEventListener('click', judgeUrl);
    $('url').addEventListener('keydown', (e) => { if (e.key === 'Enter') judgeUrl(); });
    $('pdf').addEventListener('change', judgePdf);
    $('m-btn').addEventListener('click', judgeManual);
    ['sim-wd', 'sim-we', 'sim-portal', 'sim-hours', 'sim-other'].forEach((id) => $(id).addEventListener('input', onSimChange));
    $('sim-auto').addEventListener('change', onSimChange);
    const sel = $('m-pref'); PREFS.forEach((p) => { const o = document.createElement('option'); o.value = p; o.textContent = p; sel.appendChild(o); });
    renderHistory(); renderRecommended();
    if (gateOk()) await judgeFromHash();
    else if (location.hash.startsWith('#cap=')) { $('notice').textContent = '合言葉を入力すると、ブックマークレットで取り込んだ物件を判定します'; $('notice').style.display = 'block'; const h = location.hash; $('gate-btn').addEventListener('click', () => { if (gateOk()) { location.hash = h; judgeFromHash(); } }, { once: true }); }
  });
})();
