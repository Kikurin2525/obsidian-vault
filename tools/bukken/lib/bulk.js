// 一括リサーチ: athomeの保存条件ぶんの物件をまとめて判定(おすすめ順)・前回比・問い合わせ管理・詳細ページの確認(実質スケルトンの見落とし防止)
// データはブックマークレット(static/collector.js)が #bulk= / #bulkdetail= に圧縮して渡す。保存先はこのブラウザだけ(取り込んだ回=IndexedDB、対応状況・詳細=localStorage)
// 社内版だけに入る(tools/build_static.sh を BULK=1 でビルド)。判定は1件判定と同じ lib/score.js。app.js の window.BukkenApp を使う
(function () {
  'use strict';
  const RUNS_KEY = 'bukken-bulk-runs';
  const STATUS_KEY = 'bukken-bulk-status';
  const DETAIL_KEY = 'bukken-bulk-detail';
  const UI_KEY = 'bukken-bulk-ui';
  const MAX_RUNS = 8;
  const MAX_DETAIL = 500;
  const SEED_URL = 'data/bulk_seed.json';
  const ATHOME = 'https://www.athome.co.jp';
  const PREFS = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
  const ROMAN = ['hokkaido', 'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima', 'ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa', 'niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi', 'mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama', 'tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi', 'tokushima', 'kagawa', 'ehime', 'kochi', 'fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'];
  const SEIREI = ['札幌市', '仙台市', 'さいたま市', '千葉市', '横浜市', '川崎市', '相模原市', '新潟市', '静岡市', '浜松市', '名古屋市', '京都市', '大阪市', '堺市', '神戸市', '岡山市', '広島市', '北九州市', '福岡市', '熊本市'];
  const STATUS = [['todo', '未対応'], ['asked', '問い合わせ済(返信待ち)'], ['replied', '返信あり・検討中'], ['visit', '内見予定・内見済み'], ['apply', '申込・交渉中'], ['hold', '様子見'], ['ng', '先方NG'], ['skip', '見送り(自分で)']];
  const STATUS_LABEL = Object.fromEntries(STATUS);
  const STATUS_VIEW = ['apply', 'visit', 'replied', 'hold', 'asked', 'todo', 'ng', 'skip'];
  const MARK = { go: '◎', maybe: '○', cond: '△', ng: '✕' };
  const ORDER = { go: 0, maybe: 1, cond: 2, ng: 3 };
  const PILL = { go: 'p-go', maybe: 'p-maybe', cond: 'p-cond', ng: 'p-ng' };
  const TAGL = { new: '新着', first: '初回', chg: '変更' };
  // 「スケルトン返し」など退去時の原状回復の話は、いまの内装状態ではないので詳細ページ由来の文からは外す
  const RESTORE = /(?:原状回復|退去時|解約時|明渡し時|明け渡し時)[^、。\n]{0,10}スケルトン|スケルトン\s*(?:で|にて|での|状態で|状態にて)?\s*(?:返し|戻し|返還|原状回復|明け?渡し)/g;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (_) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } },
  };
  const nfkc = (s) => (s == null ? '' : String(s).normalize('NFKC'));
  const man = (y) => (Math.round((y || 0) / 100) / 100) + '万';
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (ts) => { const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + pad(d.getMinutes()); };
  const fmtMD = (ts) => { const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); };
  const fmtDay = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const App = () => window.BukkenApp;

  // ===== 取り込んだ回の保存(IndexedDB。使えないブラウザはlocalStorage) =====
  const idb = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((ok, ng) => {
        const rq = indexedDB.open('bukken-bulk', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
        rq.onsuccess = () => { this.db = rq.result; ok(this.db); };
        rq.onerror = () => ng(rq.error);
      });
    },
    async get(k) {
      const db = await this.open();
      return new Promise((ok, ng) => { const rq = db.transaction('kv').objectStore('kv').get(k); rq.onsuccess = () => ok(rq.result); rq.onerror = () => ng(rq.error); });
    },
    async set(k, v) {
      const db = await this.open();
      return new Promise((ok, ng) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => ok(true); tx.onerror = () => ng(tx.error); });
    },
  };
  async function loadRuns() {
    try { return (await idb.get('runs')) || []; } catch (_) { return ls.get(RUNS_KEY, []); }
  }
  async function saveRuns(runs) {
    runs.sort((a, b) => a.at - b.at);
    while (runs.length > MAX_RUNS) runs.shift();
    try { await idb.set('runs', runs); return; } catch (_) { /* IndexedDBが使えない → localStorage */ }
    while (!ls.set(RUNS_KEY, runs) && runs.length > 1) runs.shift();
  }
  function loadStatus() { return ls.get(STATUS_KEY, {}); }
  function saveStatus(st) { if (!ls.set(STATUS_KEY, st)) msg('対応状況を保存できませんでした(ブラウザの保存容量)', true); }
  function loadDetail() { return ls.get(DETAIL_KEY, {}); }
  function saveDetail(det) {
    const ids = Object.keys(det).sort((a, b) => det[b].at - det[a].at);
    for (const id of ids.slice(MAX_DETAIL)) delete det[id];
    ls.set(DETAIL_KEY, det);
  }
  let ui = Object.assign({ run: null, tab: 'rank', v: ['go', 'maybe', 'cond'], cond: '', onlyNew: false, hideDone: false, q: '' }, ls.get(UI_KEY, {}));
  function saveUi() { ls.set(UI_KEY, ui); }

  function msg(text, isErr) {
    const el = $('bulk-msg');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('err', !!isErr);
    el.hidden = false;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ===== athomeの一覧データ → 判定用の物件データ(scripts/bulk_judge_from_api.js と同じ変換) =====
  function yen(str) {
    if (!str) return 0;
    const s = nfkc(str).replace(/,/g, '');
    const m = s.match(/([\d.]+)\s*万円/);
    if (m) return Math.round(parseFloat(m[1]) * 10000);
    const m2 = s.match(/([\d.]+)\s*円/);
    if (m2) return Math.round(parseFloat(m2[1]));
    return 0;
  }
  function months(str) {
    if (!str) return { months: 0 };
    const s = nfkc(str);
    const m = s.match(/([\d.]+)\s*(ヶ月|カ月|か月)/);
    if (m) return { months: parseFloat(m[1]) };
    const y = yen(s);
    if (y) return { yen: y };
    return { months: 0 };
  }
  function num(str) { const m = nfkc(str).match(/([\d.]+)/); return m ? parseFloat(m[1]) : null; }
  function prefOfCond(cond) {
    const k = parseInt(cond.ken, 10);
    if (k >= 1 && k <= 47) return PREFS[k - 1];
    const i = ROMAN.indexOf(cond.roman);
    return i >= 0 ? PREFS[i] : '';
  }
  function itemToProp(it, cond) {
    const c = it.contract || {}, a = it.area || {}, i = it.info || {}, tp = it.tp || {};
    const loc = nfkc(it.location);
    const seo = cond.seo || 'rent_store';
    const pc = parseInt(it.prefCd, 10);
    const pref = PREFS.some((p) => loc.startsWith(p)) ? '' : pc >= 1 && pc <= 47 ? PREFS[pc - 1] : prefOfCond(cond);
    return {
      source: 'athome-list', id: String(it.id), seo, url: ATHOME + '/' + seo + '/' + it.id + '/', cond: String(it.c),
      title: nfkc(it.title), address: pref + loc,
      rentYen: yen(c.price), mgmtYen: yen(c.managementFee), areaSqm: num(a.area), tsubo: num(a.tsubo), tsuboTankaYen: yen(a.unitPrice),
      shikikin: months(c.deposit), hoshokin: months(c.guaranteeDeposit), reikin: months(c.keyMoney),
      built: nfkc(String(i.chikunengetsu || '').replace(/<br\s*\/?>/g, ' ')), structure: nfkc(i.construction), floors: nfkc(i.kaidateKai),
      stations: (it.traffic || []).filter((t) => t.w).map((t) => ({ line: nfkc(t.l), station: nfkc(t.s), walk: parseInt(t.w, 10) })),
      genkyo: tp.skel === '1' ? 'スケルトン' : tp.inuki === '1' ? '居抜き' : null,
      contract: null, tokki: [it.tenant].concat(tp.feat || []).filter(Boolean).join('、'), equip: null,
      comment: it.comment || null, kaiin: nfkc(it.kaiin), lastTenant: tp.last || '', canDance: !!it.dance,
    };
  }

  // ===== 部屋としてまとめる(同じ部屋を複数の不動産会社が載せている)・回をまたいだ同一判定 =====
  function keysOf(p) {
    const a = nfkc(p.address).replace(/\s/g, '').replace(/ヶ/g, 'ケ');
    const f = nfkc(p.floors).replace(/\s/g, '');
    return { exact: [a, p.areaSqm, p.rentYen, f].join('|'), loose: [a, p.areaSqm, f].join('|') };
  }
  function groupRooms(props) {
    const map = new Map();
    for (const p of props) {
      const k = keysOf(p);
      let r = map.get(k.exact);
      if (!r) { r = { uid: null, ids: [], conds: [], exact: k.exact, loose: k.loose, prop: p }; map.set(k.exact, r); }
      if (!r.ids.includes(p.id)) r.ids.push(p.id);
      if (!r.conds.includes(p.cond)) r.conds.push(p.cond);
      if (p.canDance) r.prop.canDance = true;
    }
    return [...map.values()];
  }
  // 部屋ID(uid): 物件IDが1つでも同じ → 同じ部屋 / 所在地+面積+階+賃料が同じ → 載せ直し / 所在地+面積+階が同じ(1件だけ) → 賃料の変更
  function assignUids(rooms, runs) {
    const st = loadStatus();
    const byId = new Map(), byExact = new Map(), byLoose = new Map(), known = new Set();
    const add = (uid, ids, exact, loose) => {
      known.add(uid);
      for (const id of ids || []) if (!byId.has(id)) byId.set(id, uid);
      if (exact && !byExact.has(exact)) byExact.set(exact, uid);
      if (loose) { const u = byLoose.get(loose); if (u === undefined) byLoose.set(loose, uid); else if (u !== uid) byLoose.set(loose, null); }
    };
    for (const run of runs.slice().sort((a, b) => b.at - a.at)) for (const r of run.rooms) add(r.uid, r.ids, r.exact, r.loose);
    for (const [uid, s] of Object.entries(st)) add(uid, s.ids, s.exact, s.loose);
    const used = new Set();
    for (const r of rooms) {
      let uid = null;
      for (const id of r.ids) { const u = byId.get(id); if (u && !used.has(u)) { uid = u; break; } }
      if (!uid) { const u = byExact.get(r.exact); if (u && !used.has(u)) uid = u; }
      if (!uid) { const u = byLoose.get(r.loose); if (u && !used.has(u)) uid = u; }
      if (!uid) { uid = r.ids[0]; let n = 2; while (used.has(uid) || known.has(uid)) uid = r.ids[0] + '-' + n++; }
      r.uid = uid;
      used.add(uid);
    }
  }
  // 対応状況を付けた部屋は、新しい回で見つかった物件ID・所在地キーを覚えておく(次の回でも同じ部屋として見つけるため)
  function touchStatus(rooms) {
    const st = loadStatus();
    let dirty = false;
    for (const r of rooms) {
      const s = st[r.uid];
      if (!s) continue;
      s.ids = [...new Set((s.ids || []).concat(r.ids))];
      s.exact = r.exact; s.loose = r.loose;
      dirty = true;
    }
    if (dirty) saveStatus(st);
  }
  function snapshot(r) {
    const p = r.prop;
    return { ids: r.ids.slice(), exact: r.exact, loose: r.loose, title: p.title, address: p.address, url: p.url, rent: (p.rentYen || 0) + (p.mgmtYen || 0), area: p.areaSqm, kaiin: p.kaiin };
  }

  // ===== 前回比 =====
  function changes(a, b) {
    const out = [];
    if ((a.rentYen || 0) !== (b.rentYen || 0)) out.push('賃料 ' + man(a.rentYen) + '→' + man(b.rentYen));
    if ((a.mgmtYen || 0) !== (b.mgmtYen || 0)) out.push('管理費 ' + man(a.mgmtYen) + '→' + man(b.mgmtYen));
    if (a.areaSqm !== b.areaSqm) out.push('面積 ' + a.areaSqm + '→' + b.areaSqm + '㎡');
    const dep = (p) => JSON.stringify([p.shikikin, p.hoshokin, p.reikin]);
    if (dep(a) !== dep(b)) out.push('敷金・保証金・礼金が変更');
    if ((a.genkyo || '') !== (b.genkyo || '')) out.push('現況 ' + (a.genkyo || '記載なし') + '→' + (b.genkyo || '記載なし'));
    if (!!a.canDance !== !!b.canDance) out.push(b.canDance ? 'スタジオ出店可が付いた' : 'スタジオ出店可が外れた');
    return out;
  }
  function diff(cur, prev) {
    const out = { added: [], first: [], changed: [], gone: [], unknownGone: [] };
    if (!prev) return out;
    const prevBy = new Map(prev.rooms.map((r) => [r.uid, r]));
    const curUids = new Set(cur.rooms.map((r) => r.uid));
    const prevConds = new Set(prev.conds.map((c) => String(c.key)));
    const fullConds = new Set(cur.conds.filter((c) => c.got >= c.count).map((c) => String(c.key)));
    for (const r of cur.rooms) {
      const p = prevBy.get(r.uid);
      if (!p) { (r.conds.some((c) => prevConds.has(c)) ? out.added : out.first).push(r); continue; }
      const ch = changes(p.prop, r.prop);
      if (ch.length) out.changed.push({ room: r, prev: p, ch });
    }
    for (const p of prev.rooms) {
      if (curUids.has(p.uid)) continue;
      (p.conds.every((c) => fullConds.has(c)) ? out.gone : out.unknownGone).push(p);
    }
    return out;
  }

  // ===== 詳細ページの確認結果(実質スケルトンの見落とし防止) =====
  function detailOf(r, det) {
    let best = null;
    for (const id of r.ids) { const x = det[id]; if (x && (!best || x.at > best.at)) best = x; }
    return best;
  }
  function withDetail(r, det) {
    const x = detailOf(r, det || loadDetail());
    if (!x || x.ended) return r.prop;
    const p = Object.assign({}, r.prop);
    const sk = skelSigns(x);
    // 写真の説明・掲載文に「現況スケルトン」などとはっきり書いてあれば、判定でもスケルトン扱い(必須NG)にする
    p.genkyo = [r.prop.genkyo, x.genkyo, sk.strong.length ? 'スケルトン(詳細ページ: ' + sk.strong[0] + ')' : ''].filter(Boolean).join(' / ') || null;
    const extra = [x.tokki, x.joken, x.point].filter(Boolean).join('、').replace(RESTORE, '退去時の原状回復あり');
    if (extra) p.tokki = [r.prop.tokki, extra].filter(Boolean).join('、');
    if (x.equip) p.equip = x.equip;
    if (x.contract) p.contract = x.contract;
    p.detailAt = x.at;
    return p;
  }
  // 詳細ページから読んだ「実質スケルトン」の手がかり。掲載文(現況・特記事項・条件等・ポイント・コメント)にはっきり書いてあるときだけ拾う
  // 写真の説明は同じページに他の物件の写真データも入っていて見分けられないので使わない(2026-09-15 スムークビルで確認)。内装は最後は写真と内見で確かめる
  function skelSigns(x) {
    const strong = [];
    const txt = nfkc([x.genkyo, x.tokki, x.joken, x.point, x.comment].filter(Boolean).join(' ')).replace(RESTORE, '');
    const m = txt.match(/スケルトン|内装(?:なし|無し|未施工)|床(?:・壁)?(?:なし|無し)|コンクリート(?:打ち?っ?放し|むき出し)/);
    if (m) strong.push('掲載文に「' + m[0] + '」');
    return { strong };
  }
  function flagsOf(r, p, det) {
    const f = [];
    if (p.canDance) f.push(['good', 'athome上でスタジオ出店可']);
    if (/居抜き/.test(p.genkyo || '')) f.push(['good', '居抜き']);
    const x = detailOf(r, det);
    if (x && x.ended) f.push(['bad', '詳細ページなし(掲載終了の可能性) ' + fmtMD(x.at)]);
    else if (x) {
      const s = skelSigns(x);
      if (s.strong.length) f.push(['warn', '実質スケルトン: ' + s.strong.join('・')]);
      f.push(['info', '詳細 ' + fmtMD(x.at) + ': 現況=' + nfkc(x.genkyo || '記載なし').slice(0, 12) + ' / 設備=' + (x.equip ? nfkc(x.equip).slice(0, 20) : '記載なし')]);
    }
    return f;
  }

  // ===== 判定 =====
  function judgeRooms(rooms, det) {
    const sim = App().currentSim();
    const out = new Map();
    for (const r of rooms) {
      try { out.set(r.uid, window.Score.judge(withDetail(r, det), { sim })); } catch (_) { out.set(r.uid, null); }
    }
    return out;
  }
  function sorted(rooms, res) {
    return rooms.map((r) => [r, res.get(r.uid)]).sort(([, a], [, b]) => {
      if (!a || !b) return (a ? 0 : 1) - (b ? 0 : 1);
      return (ORDER[a.verdictClass] - ORDER[b.verdictClass]) || (b.total - a.total);
    });
  }
  function countVerdicts(res) {
    const c = { go: 0, maybe: 0, cond: 0, ng: 0 };
    for (const d of res.values()) c[d ? d.verdictClass : 'ng']++;
    return c;
  }

  // ===== 受け取り(ブックマークレット → #bulk= / #bulkdetail=) =====
  function b64ToBytes(s) {
    let b = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const bin = atob(b);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function decode(s) {
    const bytes = b64ToBytes(s.slice(1));
    if (s[0] === 'z') {
      if (!window.DecompressionStream) throw new Error('このブラウザは圧縮データに対応していません(Chrome・Edge・Safariの最新版で開いてください)');
      const st = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return JSON.parse(await new Response(st).text());
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  async function fromHash() {
    const m = location.hash.match(/^#(bulk|bulkdetail)=([A-Za-z0-9_-]+)/);
    if (!m) return false;
    history.replaceState(null, '', location.pathname + location.search);
    App().showMode('bulk');
    try {
      const data = await decode(m[2]);
      if (m[1] === 'bulk') await importRun(data); else await importDetail(data);
    } catch (e) { msg('ブックマークレットのデータを読めませんでした: ' + e.message + '(athomeのタブに残っている「判定ツールで開く」をもう一度押してください)', true); }
    return true;
  }
  async function importRun(data, quiet) {
    if (!data || !Array.isArray(data.items)) throw new Error('データの形式が違います');
    const runs = await loadRuns();
    const id = 'r' + data.at;
    if (runs.some((r) => r.id === id)) {
      ui.run = id; ui.tab = 'rank'; saveUi();
      if (!quiet) { await render(); msg('この回はもう取り込み済みです(表示を切り替えました)'); }
      return;
    }
    const conds = (data.conds || []).map((c) => Object.assign({}, c, { key: String(c.key) }));
    const condBy = new Map(conds.map((c) => [c.key, c]));
    const props = [];
    let skipped = 0;
    for (const it of data.items) {
      const p = itemToProp(it, condBy.get(String(it.c)) || {});
      if (p.rentYen && p.areaSqm) props.push(p); else skipped++;
    }
    const rooms = groupRooms(props);
    assignUids(rooms, runs);
    touchStatus(rooms);
    runs.push({ id, at: data.at, source: data.source || '', partial: !!data.partial, conds, fetched: data.items.length, skipped, rooms });
    await saveRuns(runs);
    ui.run = id; ui.tab = 'rank'; saveUi();
    if (quiet) return;
    await render();
    msg('取り込みました: 保存条件' + conds.length + '本・' + data.items.length + '件 → ' + rooms.length + '室(同じ部屋を複数の不動産会社が載せている分をまとめました)'
      + (skipped ? '。賃料か面積が読めない' + skipped + '件は外しました' : '') + (data.partial ? '。※athomeの制限で途中までの取得です' : ''));
  }
  async function importDetail(data) {
    if (!data || !Array.isArray(data.items)) throw new Error('データの形式が違います');
    const det = loadDetail();
    let n = 0, ended = 0, warn = 0;
    for (const it of data.items) {
      if (!it || !it.id) continue;
      if (it.ended) { det[it.id] = { at: data.at, ended: 1 }; ended++; continue; }
      const cap = it.cap || {};
      const pairs = cap.pairs || {};
      const pick = (...ks) => { for (const k of ks) { const hit = Object.keys(pairs).find((x) => x.includes(k)); if (hit) return String(pairs[hit]).slice(0, 400); } return null; };
      const x = { at: data.at, genkyo: pick('現況'), equip: pick('設備'), tokki: pick('特記事項', '備考'), joken: pick('条件等', '入居条件'), contract: pick('契約期間'), point: (cap.pointText || '').slice(0, 400) || null, comment: (cap.comment || '').slice(0, 600) || null };
      det[it.id] = x;
      n++;
      if (skelSigns(x).strong.length) warn++;
    }
    saveDetail(det);
    ui.tab = 'rank'; saveUi();
    await render();
    msg('詳細ページを確認しました: ' + n + '件' + (ended ? '(ページがなかった=掲載終了の可能性 ' + ended + '件)' : '')
      + (warn ? '。掲載文に「スケルトン」「内装なし」などと書かれた物件が ' + warn + '件(判定もスケルトン扱いにしました)→ 一覧の黄色い表示を見てください' : '。掲載文に内装なし(スケルトン)の記載は見つかりませんでした')
      + '。現況・設備は各物件の灰色の表示で見られます。文字に出てこない内装の状態は、写真と内見で確認してください');
  }
  async function importSeed(data) {
    for (const p of data.payloads || []) await importRun(p, true);
    const runs = await loadRuns();
    const st = loadStatus();
    let n = 0;
    for (const s of data.status || []) {
      const r = findRoomIn(runs, (x) => x.ids.includes(String(s.id)));
      if (!r) continue;
      if (st[r.uid] && (st[r.uid].at || 0) >= (s.at || 0)) continue;
      st[r.uid] = Object.assign(snapshot(r), { st: s.st, memo: s.memo || '', at: s.at || Date.now() });
      n++;
    }
    saveStatus(st);
    ui.run = null; ui.tab = 'rank'; saveUi();
    await render();
    msg('過去の結果を読み込みました(' + (data.payloads || []).length + '回分・対応状況' + n + '件)');
  }
  async function importBackup(data) {
    const runs = await loadRuns();
    const have = new Set(runs.map((r) => r.id));
    let addRuns = 0;
    for (const r of data.runs || []) if (!have.has(r.id)) { runs.push(r); addRuns++; }
    await saveRuns(runs);
    const st = loadStatus();
    let addSt = 0;
    for (const [uid, s] of Object.entries(data.status || {})) if (!st[uid] || (s.at || 0) > (st[uid].at || 0)) { st[uid] = s; addSt++; }
    saveStatus(st);
    const det = loadDetail();
    for (const [id, x] of Object.entries(data.detail || {})) if (!det[id] || x.at > det[id].at) det[id] = x;
    saveDetail(det);
    ui.run = null; saveUi();
    await render();
    msg('バックアップを読み込みました(回 ' + addRuns + '件・対応状況 ' + addSt + '件を追加)');
  }
  async function readFile(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data && data.type === 'bukken-bulk-seed') await importSeed(data);
      else if (data && data.type === 'bukken-bulk-backup') await importBackup(data);
      else throw new Error('一括リサーチのバックアップファイルではありません');
    } catch (e) { msg('読み込めませんでした: ' + e.message, true); }
  }
  async function loadSeed() {
    try {
      const r = await fetch(SEED_URL, { cache: 'no-store' });
      if (!r.ok) throw new Error('過去の結果のファイルが見つかりません');
      await importSeed(await r.json());
    } catch (e) { msg(e.message, true); }
  }

  // ===== 表示 =====
  let view = null;
  let seq = 0;
  function findRoomIn(runs, fn) {
    for (const run of runs.slice().sort((a, b) => b.at - a.at)) { const r = run.rooms.find(fn); if (r) return r; }
    return null;
  }
  function findRoom(uid) {
    if (!view) return null;
    return view.run.rooms.find((r) => r.uid === uid) || findRoomIn(view.runs, (r) => r.uid === uid);
  }
  function setStatus(uid, patch) {
    const st = loadStatus();
    const r = findRoom(uid);
    const cur = st[uid] || Object.assign({ st: 'todo', memo: '' }, r ? snapshot(r) : {});
    Object.assign(cur, patch, { at: Date.now() });
    st[uid] = cur;
    saveStatus(st);
  }
  function addrNoPref(a) { const s = nfkc(a); const p = PREFS.find((x) => s.startsWith(x)); return p ? s.slice(p.length) : s; }
  function prefOfAddr(a) { const s = nfkc(a); return PREFS.find((x) => s.startsWith(x)) || ''; }
  function cityOf(a) {
    const s = addrNoPref(a);
    const sr = SEIREI.find((c) => s.startsWith(c));
    if (sr) { const m = s.slice(sr.length).match(/^.+?区/); return sr + (m ? m[0] : ''); }
    const m = s.match(/^.+?郡.+?[町村]|^.+?[市区町村]/);
    return m ? m[0] : '';
  }
  function nearest(p) { return (p.stations || []).slice().sort((a, b) => a.walk - b.walk)[0] || null; }
  function floorShort(f) { return nfkc(f).split(/[/／]/).pop().trim(); }
  function normQ(s) { return nfkc(s).replace(/\s+/g, '').replace(/ヶ/g, 'ケ').toLowerCase(); }

  async function render() {
    const my = ++seq;
    const runs = await loadRuns();
    if (my !== seq) return;
    $('bulk-empty').hidden = runs.length > 0;
    $('bulk-main').hidden = runs.length === 0;
    if (!runs.length) { view = null; return; }
    const run = runs.find((r) => r.id === ui.run) || runs[runs.length - 1];
    ui.run = run.id;
    const prev = runs[runs.indexOf(run) - 1] || null;
    await App().ensureDataMany(run.rooms.map((r) => r.prop).concat(prev ? prev.rooms.map((r) => r.prop) : []));
    if (my !== seq) return;
    const det = loadDetail();
    const res = judgeRooms(run.rooms, det);
    const prevRes = prev ? judgeRooms(prev.rooms, det) : new Map();
    const df = diff(run, prev);
    for (const c of df.changed) {
      const a = prevRes.get(c.prev.uid), b = res.get(c.room.uid);
      if (a && b && (a.verdictClass !== b.verdictClass || a.total !== b.total)) c.ch.push('判定 ' + MARK[a.verdictClass] + a.total + '→' + MARK[b.verdictClass] + b.total);
    }
    const tagOf = new Map();
    df.added.forEach((r) => tagOf.set(r.uid, 'new'));
    df.first.forEach((r) => tagOf.set(r.uid, 'first'));
    df.changed.forEach((c) => tagOf.set(c.room.uid, 'chg'));
    view = { runs, run, prev, res, prevRes, diff: df, tagOf, det };
    renderRunbar();
    renderTabs();
    drawTab();
  }
  function renderRunbar() {
    const { runs, run, prev, res, diff: df } = view;
    const cnt = countVerdicts(res);
    const opts = runs.slice().reverse().map((r) => '<option value="' + esc(r.id) + '"' + (r.id === run.id ? ' selected' : '') + '>' + fmtDate(r.at) + ' 取得 ・ ' + r.conds.length + '条件 ・ ' + r.rooms.length + '室' + (r.partial ? ' ・ 途中まで' : '') + (r.source === 'seed' ? ' ・ 過去データ' : '') + '</option>').join('');
    const notFull = run.conds.filter((c) => c.got < c.count);
    $('bulk-runbar').innerHTML = '<label class="runsel">表示する回 <select data-act="run">' + opts + '</select></label>'
      + '<div class="sum"><span class="pill p-go">◎ ' + cnt.go + '</span><span class="pill p-maybe">○ ' + cnt.maybe + '</span><span class="pill p-cond">△ ' + cnt.cond + '</span><span class="pill p-ng">✕ ' + cnt.ng + '</span>'
      + (prev ? '<span class="tag t-new">新着 ' + df.added.length + '</span><span class="tag t-chg">変更 ' + df.changed.length + '</span><span class="tag t-gone">消えた ' + df.gone.length + '</span>' : '') + '</div>'
      + '<div class="muted">保存条件' + run.conds.length + '本・' + run.fetched + '件を取得 → ' + run.rooms.length + '室(同じ部屋を複数の不動産会社が載せている分をまとめた数)。' + (prev ? '前回 = ' + fmtDate(prev.at) + ' 取得' : '前回の回はまだありません')
      + (run.partial ? '。<b style="color:var(--bad)">athomeの制限で途中までの取得です</b>' : '')
      + (notFull.length ? '。取りきれなかった条件: ' + notFull.map((c) => esc(String(c.label).slice(0, 24)) + '(' + c.got + '/' + c.count + '件)').join('、') : '') + '</div>';
  }
  function renderTabs() {
    const st = loadStatus();
    const nSt = Object.values(st).filter((s) => s.st !== 'todo').length;
    const tabs = [['rank', 'おすすめ順'], ['diff', '前回比' + (view.prev ? '(新着' + view.diff.added.length + ')' : '')], ['status', '問い合わせ管理' + (nSt ? '(' + nSt + ')' : '')]];
    $('bulk-tabs').innerHTML = tabs.map(([k, l]) => '<button type="button" class="tab' + (ui.tab === k ? ' on' : '') + '" data-act="tab" data-tab="' + k + '">' + l + '</button>').join('');
  }
  function drawTab() {
    if (ui.tab === 'diff') renderDiff();
    else if (ui.tab === 'status') renderStatus();
    else renderRank();
  }
  function statusSelect(s) {
    const cur = s ? s.st : 'todo';
    return '<select class="stsel st-' + cur + '" data-act="st">' + STATUS.map(([k, l]) => '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
  }
  function memoHtml(s) {
    const m = s && s.memo ? s.memo : '';
    return (m ? '<div class="memo" title="' + esc(m) + '">' + esc(m.slice(0, 44)) + (m.length > 44 ? '…' : '') + '</div>' : '') + '<button type="button" class="linkbtn" data-act="memo">' + (m ? 'メモを直す' : 'メモを書く') + '</button>';
  }
  function rowHtml(r, d, rank, st) {
    const p = d ? d.property : r.prop;
    const vc = d ? d.verdictClass : 'ng';
    const tag = view.tagOf.get(r.uid);
    const s = st[r.uid];
    const stn = nearest(p);
    const ch = tag === 'chg' ? view.diff.changed.find((c) => c.room.uid === r.uid) : null;
    const fl = flagsOf(r, p, view.det);
    const rent = (p.rentYen || 0) + (p.mgmtYen || 0);
    const tt = p.tsuboTankaYen || (p.tsubo ? Math.round(rent / p.tsubo) : null);
    return '<tr data-uid="' + esc(r.uid) + '">'
      + '<td class="rk">' + rank + '</td>'
      + '<td class="vd"><span class="pill ' + PILL[vc] + '">' + MARK[vc] + ' ' + (d ? d.total : '?') + '</span>' + (tag ? '<span class="tag t-' + tag + '">' + TAGL[tag] + '</span>' : '')
      + (d && d.ng.length ? '<div class="ngr">' + esc(d.ng[0].slice(0, 42)) + (d.ng.length > 1 ? ' ほか' + (d.ng.length - 1) + '件' : '') + '</div>' : '') + '</td>'
      + '<td class="pp"><div class="p1">' + (stn ? esc(stn.station) + ' 徒歩' + stn.walk + '分' : '駅不明') + '<span class="muted"> ・ ' + esc(addrNoPref(p.address)) + '</span></div>'
      + '<div class="p2 muted">' + esc(String(p.title || '').slice(0, 48)) + ' ・ ' + esc(floorShort(p.floors) || '階不明') + ' ・ ' + esc(p.structure || '構造不明') + (p.kaiin ? ' ・ ' + esc(p.kaiin) : '') + (r.ids.length > 1 ? ' ・ ' + r.ids.length + '社が掲載' : '') + '</div>'
      + (fl.length ? '<div class="flags">' + fl.map(([c, t]) => '<span class="flag f-' + c + '">' + esc(t) + '</span>').join('') + '</div>' : '')
      + (ch ? '<div class="chg">' + esc(ch.ch.join(' / ')) + '</div>' : '') + '</td>'
      + '<td class="money"><b>' + man(rent) + '</b><div class="muted">' + (p.areaSqm != null ? p.areaSqm + '㎡' : '') + (tt ? ' ・ 坪' + tt.toLocaleString() + '円' : '') + '</div></td>'
      + '<td class="stc">' + statusSelect(s) + memoHtml(s) + '</td>'
      + '<td class="acts"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">athome↗</a><button type="button" class="linkbtn" data-act="open">詳しく</button></td>'
      + '</tr>';
  }
  function tableHtml(rows, st) {
    return '<div class="tbl-wrap"><table class="list bulk"><tr><th>#</th><th>判定</th><th>物件</th><th>家賃(管理費込)・広さ</th><th>対応状況</th><th></th></tr>'
      + rows.map(([r, d], i) => rowHtml(r, d, i + 1, st)).join('') + '</table></div>';
  }
  function renderRank() {
    const { run, res } = view;
    const cnt = countVerdicts(res);
    const conds = run.conds.map((c) => '<option value="' + esc(c.key) + '"' + (ui.cond === c.key ? ' selected' : '') + '>' + esc(String(c.label).slice(0, 40)) + '(' + c.got + '件)</option>').join('');
    $('bulk-body').innerHTML = '<div class="bfilters">'
      + ['go', 'maybe', 'cond', 'ng'].map((v) => '<button type="button" class="vchip' + (ui.v.includes(v) ? ' on' : '') + '" data-act="v" data-v="' + v + '">' + MARK[v] + ' ' + cnt[v] + '</button>').join('')
      + '<select data-act="cond"><option value="">すべての保存条件</option>' + conds + '</select>'
      + '<label class="chk"><input type="checkbox" data-act="onlyNew"' + (ui.onlyNew ? ' checked' : '') + '>新着・変更だけ</label>'
      + '<label class="chk"><input type="checkbox" data-act="hideDone"' + (ui.hideDone ? ' checked' : '') + '>対応中・対応済みを隠す</label>'
      + '<input type="search" data-act="q" placeholder="駅名・地名・物件名・仲介" value="' + esc(ui.q) + '">'
      + '</div><div id="bulk-table"></div>';
    renderRankTable();
  }
  function renderRankTable() {
    const { run, res, tagOf } = view;
    const st = loadStatus();
    const q = normQ(ui.q);
    const rows = sorted(run.rooms, res).filter(([r, d]) => {
      if (!ui.v.includes(d ? d.verdictClass : 'ng')) return false;
      if (ui.cond && !r.conds.includes(ui.cond)) return false;
      if (ui.onlyNew && !tagOf.has(r.uid)) return false;
      if (ui.hideDone && st[r.uid] && st[r.uid].st !== 'todo') return false;
      if (q && !normQ([r.prop.title, r.prop.address, r.prop.kaiin].concat((r.prop.stations || []).map((s) => s.station + s.line)).join(' ')).includes(q)) return false;
      return true;
    });
    $('bulk-table').innerHTML = rows.length ? tableHtml(rows, st) : '<div class="card empty">条件に合う物件がありません。上の ◎○△✕ ボタンで表示する判定を切り替えられます</div>';
  }
  function goneTable(rooms, prevRes, st) {
    return '<div class="tbl-wrap"><table class="list bulk"><tr><th>前回の判定</th><th>物件</th><th>家賃(管理費込)・広さ</th><th>対応状況</th><th></th></tr>'
      + sorted(rooms, prevRes).map(([r, d]) => {
        const p = r.prop;
        const vc = d ? d.verdictClass : 'ng';
        const stn = nearest(p);
        return '<tr data-uid="' + esc(r.uid) + '"><td class="vd"><span class="pill ' + PILL[vc] + '">' + MARK[vc] + ' ' + (d ? d.total : '?') + '</span></td>'
          + '<td class="pp"><div class="p1">' + (stn ? esc(stn.station) + ' 徒歩' + stn.walk + '分' : '') + '<span class="muted"> ・ ' + esc(addrNoPref(p.address)) + '</span></div><div class="p2 muted">' + esc(String(p.title || '').slice(0, 48)) + (p.kaiin ? ' ・ ' + esc(p.kaiin) : '') + '</div></td>'
          + '<td class="money"><b>' + man((p.rentYen || 0) + (p.mgmtYen || 0)) + '</b><div class="muted">' + p.areaSqm + '㎡</div></td>'
          + '<td class="stc">' + statusSelect(st[r.uid]) + memoHtml(st[r.uid]) + '</td>'
          + '<td class="acts"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">athome↗</a></td></tr>';
      }).join('') + '</table></div>';
  }
  function renderDiff() {
    const { run, prev, res, prevRes, diff: df } = view;
    if (!prev) { $('bulk-body').innerHTML = '<div class="card empty">比べる前回の回がありません。次にathomeから取り込むと、今回との差(新着・賃料の変更・検索結果から消えた物件)がここに出ます</div>'; return; }
    const st = loadStatus();
    const sec = (title, rows, note) => '<h3 class="bh">' + title + ' <span class="muted">' + rows.length + '室 ・ ' + note + '</span></h3>' + (rows.length ? tableHtml(rows, st) : '<div class="card empty">なし</div>');
    let html = '<div class="muted">前回 ' + fmtDate(prev.at) + ' 取得(' + prev.rooms.length + '室) → 今回 ' + fmtDate(run.at) + ' 取得(' + run.rooms.length + '室)。判定はどちらも今の設定でつけ直して比べています</div>';
    html += sec('新着', sorted(df.added, res), '前回の検索結果になかった部屋');
    html += sec('変更あり', sorted(df.changed.map((c) => c.room), res), '賃料・現況などが変わった部屋');
    html += '<h3 class="bh">検索結果から消えた <span class="muted">' + df.gone.length + '室 ・ 成約・掲載終了、または条件から外れた(賃料アップなど)部屋</span></h3>' + (df.gone.length ? goneTable(df.gone, prevRes, st) : '<div class="card empty">なし</div>');
    if (df.first.length) html += sec('初回取得', sorted(df.first, res), '前回はなかった保存条件で見つかった部屋');
    if (df.unknownGone.length) html += '<div class="muted" style="margin-top:10px">※今回取りきれなかった保存条件の部屋(' + df.unknownGone.length + '室)は、消えたかどうかを判断していません</div>';
    $('bulk-body').innerHTML = html;
  }
  function renderStatus() {
    const { run, res } = view;
    const st = loadStatus();
    const inRun = new Map(run.rooms.map((r) => [r.uid, r]));
    const uids = new Set(Object.keys(st).filter((u) => st[u].st !== 'todo' || st[u].memo));
    for (const r of run.rooms) { const d = res.get(r.uid); if (d && d.verdictClass === 'go') uids.add(r.uid); }
    const rank = (x) => STATUS_VIEW.indexOf(x.s ? x.s.st : 'todo');
    const list = [...uids].map((uid) => ({ uid, r: inRun.get(uid) || findRoom(uid), s: st[uid], d: inRun.has(uid) ? res.get(uid) : null }))
      .sort((a, b) => (rank(a) - rank(b)) || ((a.d ? ORDER[a.d.verdictClass] : 9) - (b.d ? ORDER[b.d.verdictClass] : 9)) || ((b.d ? b.d.total : 0) - (a.d ? a.d.total : 0)));
    if (!list.length) { $('bulk-body').innerHTML = '<div class="card empty">まだ対応状況を付けた物件がありません。おすすめ順の画面で「未対応」の欄を切り替えると、ここにまとまります</div>'; return; }
    const counts = {};
    list.forEach((x) => { const k = x.s ? x.s.st : 'todo'; counts[k] = (counts[k] || 0) + 1; });
    $('bulk-body').innerHTML = '<div class="sum" style="margin-bottom:8px">' + STATUS_VIEW.filter((k) => counts[k]).map((k) => '<span class="tag st-' + k + '">' + STATUS_LABEL[k] + ' ' + counts[k] + '</span>').join('') + '</div>'
      + '<div class="muted" style="margin-bottom:8px">対応状況を付けた物件と、今回の◎(未対応)を出しています。状況とメモは入力するとこのブラウザに自動で保存され、おすすめ順・前回比の画面とも共通です</div>'
      + '<div class="tbl-wrap"><table class="list bulk"><tr><th>対応状況</th><th>物件</th><th>家賃(管理費込)・広さ</th><th>メモ(仲介の担当者・電話・返信の要点)</th><th></th></tr>'
      + list.map(({ uid, r, s, d }) => {
        const snap = s || {};
        const p = r ? r.prop : null;
        const url = p ? p.url : snap.url;
        const stn = p ? nearest(p) : null;
        const live = inRun.has(uid);
        return '<tr data-uid="' + esc(uid) + '"><td class="stc">' + statusSelect(s) + '</td>'
          + '<td class="pp"><div class="p1">' + esc(String((p ? p.title : snap.title) || '').slice(0, 44)) + '</div><div class="p2 muted">' + (stn ? esc(stn.station) + ' 徒歩' + stn.walk + '分 ・ ' : '') + esc(addrNoPref((p ? p.address : snap.address) || '')) + (p && p.kaiin ? ' ・ ' + esc(p.kaiin) : '') + '</div>'
          + '<div class="flags">' + (live ? (d ? '<span class="pill ' + PILL[d.verdictClass] + '">' + MARK[d.verdictClass] + ' ' + d.total + '</span>' : '') + '<span class="flag f-good">今回の検索結果にあり</span>' : '<span class="flag f-bad">今回の検索結果になし</span>') + '</div></td>'
          + '<td class="money">' + (p ? '<b>' + man((p.rentYen || 0) + (p.mgmtYen || 0)) + '</b><div class="muted">' + p.areaSqm + '㎡</div>' : '') + '</td>'
          + '<td><textarea class="memoarea" data-act="memoarea" placeholder="例: ○○不動産 △△様 03-xxxx-xxxx / 9/10返信・内見OK">' + esc(snap.memo || '') + '</textarea><div class="muted">' + (snap.at ? '更新 ' + fmtDate(snap.at) : '') + '</div></td>'
          + '<td class="acts">' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">athome↗</a>' : '') + (r ? '<button type="button" class="linkbtn" data-act="open">詳しく</button>' : '') + '</td></tr>';
      }).join('') + '</table></div>';
  }

  // ===== 書き出し =====
  function toMarkdown() {
    const { run, prev, res, prevRes, diff: df, tagOf } = view;
    const st = loadStatus();
    const cnt = countVerdicts(res);
    const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '｜').replace(/\s*\n\s*/g, ' ');
    const L = ['# 物件判定 一括ランキング(' + fmtDay(run.at) + ' 取得)', ''];
    L.push('> 判定ツールの「一括リサーチ」から書き出し。athomeの保存条件' + run.conds.length + '本・' + run.fetched + '件 → ' + run.rooms.length + '室(同じ部屋の重複をまとめた数)');
    L.push('> ◎ ' + cnt.go + ' / ○ ' + cnt.maybe + ' / △ ' + cnt.cond + ' / ✕ ' + cnt.ng + (prev ? ' ・ 前回(' + fmtDay(prev.at) + ')比: 新着 ' + df.added.length + ' / 変更 ' + df.changed.length + ' / 検索結果から消えた ' + df.gone.length : ''), '');
    L.push('| # | 判定 | 点 | 物件名 | 都道府県 | 市区町村 | 最寄り駅(路線) | 駅徒歩 | 家賃(管理費込)・面積・階 | 坪単価 | 前回比 | 対応状況 | 仲介 | URL |');
    L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    sorted(run.rooms, res).filter(([, d]) => d && d.verdictClass !== 'ng').forEach(([r, d], i) => {
      const p = d.property;
      const stn = nearest(p);
      const rent = (p.rentYen || 0) + (p.mgmtYen || 0);
      const tt = p.tsuboTankaYen || (p.tsubo ? Math.round(rent / p.tsubo) : null);
      const tag = tagOf.get(r.uid);
      const ch = tag === 'chg' ? df.changed.find((c) => c.room.uid === r.uid) : null;
      const s = st[r.uid];
      L.push('| ' + [i + 1, MARK[d.verdictClass], d.total, cell(p.title), prefOfAddr(p.address), cityOf(p.address), stn ? cell(stn.station + '(' + stn.line + ')') : '', stn ? stn.walk + '分' : '',
        man(rent) + '・' + p.areaSqm + '㎡・' + cell(floorShort(p.floors)), tt ? tt.toLocaleString() + '円' : '', ch ? cell(ch.ch.join(' / ')) : (tag ? TAGL[tag] : ''),
        s ? STATUS_LABEL[s.st] + (s.memo ? ':' + cell(s.memo.slice(0, 40)) + (s.memo.length > 40 ? '…' : '') : '') : '', cell(p.kaiin), '[athome](' + p.url + ')'].join(' | ') + ' |');
    });
    if (df.gone.length) {
      L.push('', '## 検索結果から消えた部屋(前回比)', '', '| 物件名 | 所在地 | 前回の判定 | 対応状況 | URL |', '|---|---|---|---|---|');
      sorted(df.gone, prevRes).forEach(([r, d]) => { const s = st[r.uid]; L.push('| ' + [cell(r.prop.title), cell(r.prop.address), d ? MARK[d.verdictClass] + d.total : '', s ? STATUS_LABEL[s.st] : '', '[athome](' + r.prop.url + ')'].join(' | ') + ' |'); });
    }
    const act = Object.entries(st).filter(([, s]) => s.st !== 'todo').sort(([, a], [, b]) => STATUS_VIEW.indexOf(a.st) - STATUS_VIEW.indexOf(b.st));
    if (act.length) {
      L.push('', '## 問い合わせ状況', '', '| 対応状況 | 物件名 | 所在地 | メモ | URL |', '|---|---|---|---|---|');
      act.forEach(([, s]) => L.push('| ' + [STATUS_LABEL[s.st], cell(s.title), cell(s.address), cell(s.memo), s.url ? '[athome](' + s.url + ')' : ''].join(' | ') + ' |'));
    }
    return L.join('\n') + '\n';
  }
  function toCsv() {
    const { run, res, tagOf } = view;
    const st = loadStatus();
    const head = ['順位', '判定', '点', '前回比', '対応状況', 'メモ', '物件名', '所在地', '最寄り駅', '路線', '徒歩(分)', '賃料(円)', '管理費(円)', '面積(㎡)', '坪単価(円)', '階', '構造', '仲介', 'athome URL', '物件ID', 'NG理由'];
    const rows = sorted(run.rooms, res).map(([r, d], i) => {
      const p = d ? d.property : r.prop;
      const stn = nearest(p);
      const s = st[r.uid];
      const rent = (p.rentYen || 0) + (p.mgmtYen || 0);
      return [i + 1, d ? MARK[d.verdictClass] : '?', d ? d.total : '', TAGL[tagOf.get(r.uid)] || '', s ? STATUS_LABEL[s.st] : '', s ? s.memo : '', p.title, p.address, stn ? stn.station : '', stn ? stn.line : '', stn ? stn.walk : '',
        p.rentYen, p.mgmtYen, p.areaSqm, p.tsuboTankaYen || (p.tsubo ? Math.round(rent / p.tsubo) : ''), p.floors, p.structure, p.kaiin, p.url, r.ids.join(' '), d ? d.ng.join(' / ') : ''];
    });
    const q = (v) => { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + [head].concat(rows).map((a) => a.map(q).join(',')).join('\r\n');
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function copyMarkdown() {
    const md = toMarkdown();
    try { await navigator.clipboard.writeText(md); msg('Obsidian用の表をコピーしました。ノートに貼り付けてください(◎○△の' + md.split('\n').filter((l) => /^\| \d/.test(l)).length + '件)'); }
    catch (_) { download('物件判定_一括ランキング_' + fmtDay(view.run.at) + '.md', md, 'text/markdown'); msg('コピーできなかったので、mdファイルとして保存しました'); }
  }
  async function backup() {
    const data = { type: 'bukken-bulk-backup', v: 1, at: Date.now(), runs: await loadRuns(), status: loadStatus(), detail: loadDetail() };
    download('bukken-bulk-backup_' + fmtDay(Date.now()) + '.json', JSON.stringify(data), 'application/json');
  }
  async function deleteRun() {
    const runs = await loadRuns();
    const run = runs.find((r) => r.id === ui.run);
    if (!run || !confirm(fmtDate(run.at) + ' 取得の回を消しますか?(対応状況・メモは消えません)')) return;
    await saveRuns(runs.filter((r) => r !== run));
    ui.run = null; saveUi();
    await render();
  }
  // ◎○の詳細ページをathome上で読む: athomeを #bkcheck=物件ID… 付きで開き、そこでブックマークレットを押してもらう
  function openDetailCheck() {
    const { run, res } = view;
    const det = loadDetail();
    const fresh = (r) => r.ids.some((id) => det[id] && Date.now() - det[id].at < 3 * 86400000);
    const targets = sorted(run.rooms, res).filter(([r, d]) => d && (d.verdictClass === 'go' || d.verdictClass === 'maybe') && !fresh(r)).map(([r]) => r);
    if (!targets.length) { msg('◎○の物件は、3日以内にすべて詳細ページを確認済みです'); return; }
    const list = targets.slice(0, 40).map((r) => (r.prop.seo || 'rent_store') + ':' + r.ids[0]);
    window.open(ATHOME + '/personal/condition/#bkcheck=' + list.join(','), '_blank', 'noopener');
    msg('athomeを新しいタブで開きました。そのタブでブックマーク「一括リサーチ」を押すと、◎○の' + list.length + '件の詳細ページを約2.5秒おきに読み取ります(約' + Math.max(1, Math.round(list.length * 2.7 / 60)) + '分)。終わったら「判定ツールで開く」を押してください');
  }

  // ===== 操作 =====
  let qTimer = null;
  const memoTimers = new Map();
  function uidOf(el) { const tr = el.closest('[data-uid]'); return tr ? tr.dataset.uid : null; }
  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
    const act = el.dataset.act;
    if (act === 'seed') { loadSeed(); return; }
    if (act === 'restore') { $('bulk-file').click(); return; }
    if (!view) return;
    const uid = uidOf(el);
    if (act === 'v') {
      const v = el.dataset.v;
      ui.v = ui.v.includes(v) ? ui.v.filter((x) => x !== v) : ui.v.concat(v);
      el.classList.toggle('on');
      saveUi();
      renderRankTable();
    } else if (act === 'tab') { ui.tab = el.dataset.tab; saveUi(); renderTabs(); drawTab(); }
    else if (act === 'memo') {
      const st = loadStatus();
      const v = prompt('メモ(仲介の担当者・電話・返信の要点など)', (st[uid] && st[uid].memo) || '');
      if (v === null) return;
      setStatus(uid, { memo: v.trim() });
      drawTab();
    } else if (act === 'open') { const r = findRoom(uid); if (r) App().openSingle(withDetail(r, view.det)); }
    else if (act === 'check') openDetailCheck();
    else if (act === 'md') copyMarkdown();
    else if (act === 'csv') { download('物件判定_一括_' + fmtDay(view.run.at) + '.csv', toCsv(), 'text/csv'); }
    else if (act === 'backup') backup();
    else if (act === 'delrun') deleteRun();
  }
  function onChange(e) {
    const el = e.target;
    if (el.id === 'bulk-file') { if (el.files[0]) readFile(el.files[0]); el.value = ''; return; }
    const act = el.dataset.act;
    if (act === 'st') { setStatus(uidOf(el), { st: el.value }); el.className = 'stsel st-' + el.value; renderTabs(); if (ui.hideDone && ui.tab === 'rank') renderRankTable(); }
    else if (act === 'cond') { ui.cond = el.value; saveUi(); renderRankTable(); }
    else if (act === 'onlyNew' || act === 'hideDone') { ui[act] = el.checked; saveUi(); renderRankTable(); }
    else if (act === 'run') { ui.run = el.value; saveUi(); render(); }
  }
  function onInput(e) {
    const el = e.target;
    const act = el.dataset && el.dataset.act;
    if (act === 'q') { ui.q = el.value; saveUi(); clearTimeout(qTimer); qTimer = setTimeout(renderRankTable, 200); }
    else if (act === 'memoarea') {
      const uid = uidOf(el);
      clearTimeout(memoTimers.get(uid));
      memoTimers.set(uid, setTimeout(() => setStatus(uid, { memo: el.value.trim() }), 500));
    }
  }
  function init() {
    const sec = $('bulk-sec');
    if (!sec) return;
    sec.addEventListener('click', onClick);
    sec.addEventListener('change', onChange);
    sec.addEventListener('input', onInput);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // toMarkdown / toCsv は動作確認用(開発者ツールから中身を見られるように)
  window.Bulk = { fromHash, show: render, toMarkdown: () => (view ? toMarkdown() : ''), toCsv: () => (view ? toCsv() : '') };
})();
