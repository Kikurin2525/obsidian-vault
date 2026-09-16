// 条件づくり(希望 → おすすめ駅 → 探す範囲 → athomeで集める)。社内版・公開版とも BULK=1 でビルドしたときだけ入る
// 条件はこのブラウザ(localStorage)に保存する。athomeへは「athomeで集める」で検索結果ページを #bkplan=(条件) 付きで開き、ブックマークレット(collector.js)が条件どおりに集める
// おすすめ駅の採点は 1件判定と同じ lib/score.js(住宅地性15点)+ 駅力15点(乗降客数)。9/4〜9/7の全国採点(候補駅ランキング)と同じ考え方
(function () {
  const $ = (id) => document.getElementById(id);
  const PLANS_KEY = 'bukken-plans';
  const DRAFT_KEY = 'bukken-plan-draft';
  const DATA_BASE = 'data/';
  const ATHOME = 'https://www.athome.co.jp';
  const PREFS = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
  const ROMAN = ['hokkaido', 'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima', 'ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa', 'niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi', 'mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama', 'tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi', 'tokushima', 'kagawa', 'ehime', 'kochi', 'fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'];
  // athomeの条件コード(2026-09-16 に athome の検索フォームから取得)。賃料と坪単価はどちらか一方しか指定できない
  const TSUBO_TO = [['kc804', '1.0万円'], ['kc805', '1.1万円'], ['kc806', '1.2万円'], ['kc807', '1.3万円'], ['kc808', '1.4万円'], ['kc809', '1.5万円'], ['kc810', '1.6万円'], ['kc811', '1.7万円'], ['kc812', '1.8万円'], ['kc813', '1.9万円'], ['kc814', '2.0万円'], ['kc815', '2.3万円'], ['kc816', '2.5万円'], ['kc817', '2.7万円'], ['kc818', '3.0万円'], ['kc820', '上限なし']];
  const RENT_TO = [['kc601', '10万円'], ['kc602', '15万円'], ['kc603', '20万円'], ['kc604', '25万円'], ['kc605', '30万円'], ['kc606', '35万円'], ['kc607', '40万円'], ['kc609', '50万円'], ['kc626', '上限なし']];
  const MENSEKI = [['kt201', '指定なし'], ['kt202', '20㎡以上'], ['kt203', '25㎡以上'], ['kt204', '30㎡以上'], ['kt205', '35㎡以上'], ['kt206', '40㎡以上'], ['kt208', '50㎡以上'], ['kt210', '60㎡以上'], ['kt212', '70㎡以上'], ['kt214', '80㎡以上'], ['kt218', '100㎡以上']];
  const WALK = [['ke102', '1分以内'], ['ke002', '3分以内'], ['ke003', '5分以内'], ['ke101', '7分以内'], ['ke004', '10分以内'], ['ke005', '15分以内'], ['ke001', '指定なし']];
  const STRUCT = [['kh001', '鉄筋系'], ['kh002', '鉄骨系'], ['kh003', '木造'], ['kh004', 'その他']];
  const FLOORS = [['P01', '1階'], ['P08', '地下階'], ['P02', '2階以上']];
  const RIDERS = [['20000', '2万人/日以上'], ['30000', '3万人/日以上'], ['40000', '4万人/日以上(推奨・既存店の基準)'], ['50000', '5万人/日以上']];
  // 駅の性格(用途地域・大学数・乗降客÷住民から機械判定。観光地はデータで見分けられない)
  const KINDS = [['res', '住宅街'], ['mix', '住宅・商店街の混在'], ['com', '商業・繁華街'], ['biz', 'オフィス街'], ['stu', '学生街']];
  const KIND_LABEL = Object.fromEntries(KINDS);
  const GYOSYU = 'tp005,tp001,tp002,tp003,tp004,tp006,tp007,tp008,tp009,tp999';
  const RANK = ['埼玉県', '千葉県', '神奈川県', '東京都', '茨城県', '大阪府', '兵庫県', '京都府', '奈良県', '滋賀県', '愛知県', '福岡県'];
  // 点数は届くが目視で除外した駅(9/7 の候補駅一覧と同じ。理由つき)
  const MANUAL_EX = { '堺筋本町|大阪府': 'ビジネス街', '北浜|大阪府': 'ビジネス街', '肥後橋|大阪府': 'ビジネス街', '長堀橋|大阪府': '繁華街(心斎橋隣接)', '谷町四丁目|大阪府': '官庁・ビジネス街', '谷町九丁目|大阪府': '繁華街隣接', '日本橋|大阪府': '繁華街', '南森町|大阪府': 'ビジネス街', '天満|大阪府': '飲食街', '天神橋筋六丁目|大阪府': '商店街・繁華街', '十三|大阪府': '繁華街・深夜飲食', 'ユニバーサルシティ|大阪府': 'テーマパーク・人口1万', '西九条|大阪府': 'ターミナル・工業地隣接', '大阪上本町|大阪府': 'ターミナル・繁華街', '森ノ宮|大阪府': 'ビジネス街隣接', '福島|大阪府': '飲食街', '姫路|兵庫県': 'ターミナル・1km人口1.6万', '名古屋城|愛知県': '官庁街', '出町柳|京都府': '学生街(京大・同志社)', '獨協大学前|埼玉県': '学生街(駅名が大学)', '秋津|埼玉県': '住居系19%・商業寄り', '東松戸|千葉県': '1km人口1.3万' };

  const ls = { get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (_) { return fb; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const App = () => window.BukkenApp;
  function msg(text, isErr) { const el = $('plan-msg'); el.textContent = text; el.classList.toggle('err', !!isErr); el.hidden = false; }
  function defaultWish() { return { prefs: [], money: 'tsubo', tsubo: 'kc808', rent: 'kc604', menseki: 'kt204', struct: ['kh001', 'kh002'], walk: 'ke101', floors: ['P01', 'P08'], riders: '40000', kinds: ['res', 'mix'] }; }
  // 編集中の条件(希望 + 駅の選び方)。名前を付けて保存すると plans に入る
  let draft = ls.get(DRAFT_KEY, null) || { id: null, name: '', wish: defaultWish(), off: [], on: [] };
  let stationsByPref = null; // 直近に出したおすすめ駅 { pref: [row] }
  const prefCache = {};
  // athomeの市区町村ローマ字(画面のURLに cities= として要る。cityCds だけでは一覧ページの表示が絞られない)。static-data/city_roman.json = 2026-09-16 に athome の /rent_store/<pref>/city/ から取得
  let cityRoman = null;
  async function loadCityRoman() {
    if (cityRoman) return cityRoman;
    try { const r = await fetch(DATA_BASE + 'city_roman.json'); cityRoman = r.ok ? await r.json() : {}; } catch (_) { cityRoman = {}; }
    return cityRoman;
  }

  // ===== 希望フォーム =====
  function opt(list, cur) { return list.map(([v, l]) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + l + '</option>').join(''); }
  function chk(list, cur, name) { return list.map(([v, l]) => '<label class="chk"><input type="checkbox" name="' + name + '" value="' + v + '"' + (cur.includes(v) ? ' checked' : '') + '>' + l + '</label>').join(''); }
  function renderForm() {
    const w = draft.wish;
    const prefs = PREFS.map((p, i) => { const c = String(i + 1).padStart(2, '0'); return '<label class="chk"><input type="checkbox" name="pref" value="' + c + '"' + (w.prefs.includes(c) ? ' checked' : '') + '>' + p + '</label>'; }).join('');
    $('plan-form').innerHTML = '<div class="pl-row"><span class="pl-k">都道府県</span><div><div class="pl-prefs">' + prefs + '</div><div><button type="button" class="linkbtn" data-act="prefall" style="display:inline;margin:4px 10px 0 0">すべて選択</button><button type="button" class="linkbtn" data-act="prefnone" style="display:inline;margin:4px 0 0">すべて外す</button></div></div></div>'
      + '<div class="pl-row"><span class="pl-k">駅の乗降客数</span><div><select name="riders">' + opt(RIDERS, w.riders || '40000') + '</select><div class="muted">4万人未満の駅は「参考」扱い</div></div></div>'
      + '<div class="pl-row"><span class="pl-k">駅の性格</span><div class="pl-chks">' + chk(KINDS, w.kinds || ['res', 'mix'], 'kinds') + '<span class="muted">データから機械判定(観光地は判定不可)</span></div></div>'
      + '<div class="pl-row"><span class="pl-k">金額</span><div><select name="money">' + opt([['tsubo', '坪単価の上限で探す(おすすめ)'], ['rent', '賃料の上限で探す']], w.money) + '</select> '
      + '<select name="tsubo"' + (w.money === 'tsubo' ? '' : ' hidden') + '>' + opt(TSUBO_TO, w.tsubo) + '</select><select name="rent"' + (w.money === 'rent' ? '' : ' hidden') + '>' + opt(RENT_TO, w.rent) + '</select>'
      + '<div class="muted">賃料と坪単価は片方だけ(athomeの決まり)。賃料が高すぎる物件は判定で自動的に✕</div></div></div>'
      + '<div class="pl-row"><span class="pl-k">広さ</span><div><select name="menseki">' + opt(MENSEKI, w.menseki) + '</select></div></div>'
      + '<div class="pl-row"><span class="pl-k">構造</span><div class="pl-chks">' + chk(STRUCT, w.struct, 'struct') + '<span class="muted">判定の基準: 鉄筋系◎・鉄骨系○・木造は✕</span></div></div>'
      + '<div class="pl-row"><span class="pl-k">駅徒歩</span><div><select name="walk">' + opt(WALK, w.walk) + '</select></div></div>'
      + '<div class="pl-row"><span class="pl-k">階</span><div class="pl-chks">' + chk(FLOORS, w.floors, 'floors') + '<span class="muted">1階と地下は別々に検索。地下は県全域</span></div></div>'
      + '<div class="pl-row"><span class="pl-k">業種</span><div class="muted" style="font-size:13px;color:var(--ink-2)">指定なし。スタジオ可の物件には印が付きます</div></div>';
  }
  function readForm() {
    const f = $('plan-form');
    const vals = (name) => [...f.querySelectorAll('input[name="' + name + '"]:checked')].map((i) => i.value);
    const sel = (name) => f.querySelector('select[name="' + name + '"]').value;
    draft.wish = { prefs: vals('pref'), money: sel('money'), tsubo: sel('tsubo'), rent: sel('rent'), menseki: sel('menseki'), struct: vals('struct'), walk: sel('walk'), floors: vals('floors'), riders: sel('riders'), kinds: vals('kinds') };
    ls.set(DRAFT_KEY, draft);
    return draft.wish;
  }
  function wishText(w) {
    const money = w.money === 'tsubo' ? '坪単価' + (TSUBO_TO.find((x) => x[0] === w.tsubo) || ['', '?'])[1] + '以下' : '賃料' + (RENT_TO.find((x) => x[0] === w.rent) || ['', '?'])[1] + '以下';
    const l = (list, v) => (list.find((x) => x[0] === v) || ['', v])[1];
    return money + ' / ' + l(MENSEKI, w.menseki) + ' / ' + w.struct.map((s) => l(STRUCT, s)).join('・') + ' / 徒歩' + l(WALK, w.walk) + ' / ' + w.floors.map((s) => l(FLOORS, s)).join('・') + ' / 乗降' + (Number(w.riders || 40000) / 10000) + '万人以上 / ' + (w.kinds || []).map((k) => KIND_LABEL[k] || k).join('・');
  }

  // ===== おすすめ駅(都道府県ごと) =====
  async function loadPref(code) {
    if (prefCache[code]) return prefCache[code];
    try { const r = await fetch(DATA_BASE + 'pref/' + code + '.json'); prefCache[code] = r.ok ? (await r.json()).stations : {}; } catch (_) { prefCache[code] = {}; }
    return prefCache[code];
  }
  function eki15(r) { return r >= 50000 ? 15 : r >= 40000 ? 13 : r >= 30000 ? 10 : 3; }
  // 駅の性格: 学生街(大学施設4件以上) > オフィス街(乗降客が住民の4倍超) > 商業・繁華街(商業地域が5.5割超、または住民比2倍超で商業寄り) > 住宅街(住居系6割以上、または用途地域データなしで住民比1倍以下) > 混在
  function kindOf(st) {
    const p = st.pop1km || 0, ratio = p > 0 && st.riders ? st.riders / p : null;
    const z = st.zoning_cov != null && st.zoning_cov >= 0.3;
    if ((st.univ1km || 0) >= 4) return 'stu';
    if (ratio != null && ratio > 4) return 'biz';
    if (z && st.com_share >= 0.55) return 'com';
    if (ratio != null && ratio > 2 && z && st.com_share >= 0.35) return 'com';
    if (z ? st.res_share >= 0.6 : (ratio != null && ratio <= 1)) return 'res';
    return 'mix';
  }
  async function scoreStations(prefCodes, w) {
    const rec = new Set(await App().recommended());
    const minR = Number(w.riders || 40000);
    const kinds = new Set(w.kinds && w.kinds.length ? w.kinds : KINDS.map((k) => k[0]));
    const out = {};
    for (const code of prefCodes) {
      const pref = PREFS[parseInt(code, 10) - 1];
      const data = await loadPref(code);
      const rows = [];
      for (const [name, cands] of Object.entries(data)) {
        const st = cands.slice().sort((a, b) => (b.riders || 0) - (a.riders || 0))[0];
        if (!st || !st.riders || st.riders < minR) continue;
        const kind = kindOf(st);
        if (!kinds.has(kind)) continue;
        const resid = window.Score.residentialFromStats(st, rec.has(name));
        const eki = eki15(st.riders);
        const total = resid.pts + eki;
        let mark = null;
        if (total >= 26 && eki >= 13) mark = '◎';
        else if (total >= 23 && total <= 25 && eki >= 13) mark = '○';
        else if (eki < 13 && resid.pts >= 11) mark = '参考';
        if (!mark) continue;
        const ex = MANUAL_EX[name + '|' + pref] || '';
        rows.push({ name, pref, prefCode: code, city: st.city || '', cityCode: st.cityCode || '', lines: (st.lines || []).slice(0, 3).join('/'), riders: st.riders, pop1km: st.pop1km || 0, kids: st.kidsRatio, res: st.res_share, resid: resid.pts, eki, total, mark, kind, ex, detail: resid.detail });
      }
      rows.sort((a, b) => (b.total - a.total) || (b.pop1km - a.pop1km));
      out[pref] = rows;
    }
    return out;
  }
  function keyOf(r) { return r.name + '|' + r.pref; }
  function isOn(r) {
    const k = keyOf(r);
    if (draft.on.includes(k)) return true;
    if (draft.off.includes(k)) return false;
    return defOn(r);
  }
  // 既定で選ぶ駅: ◎○(目視除外は外す)。乗降客数の基準を4万未満に下げたときは「参考」も選ぶ
  function defOn(r) { return !r.ex && (r.mark !== '参考' || Number(draft.wish.riders || 40000) < 40000); }
  function renderStations() {
    const box = $('plan-stations');
    if (!stationsByPref) { box.innerHTML = ''; return; }
    const prefs = Object.keys(stationsByPref);
    let html = '<h3 class="bh">② おすすめ駅 <span class="muted">チェックを外した駅は範囲から外れます</span> <button type="button" class="small" data-act="torange" style="margin:0 0 0 auto">③ 探す範囲・保存へ ↓</button></h3>';
    let any = 0;
    for (const pref of prefs) {
      const rows = stationsByPref[pref];
      const on = rows.filter(isOn).length;
      any += rows.length;
      html += '<div class="card pl-pref"><div class="pl-pref-h"><b>' + esc(pref) + '</b> <span class="muted">◎' + rows.filter((r) => r.mark === '◎').length + ' ○' + rows.filter((r) => r.mark === '○').length + ' 参考' + rows.filter((r) => r.mark === '参考').length + ' ・ 選択中 ' + on + '駅</span>'
        + ' <button type="button" class="linkbtn" data-act="allon" data-pref="' + esc(pref) + '">◎○をすべて選ぶ</button><button type="button" class="linkbtn" data-act="alloff" data-pref="' + esc(pref) + '">すべて外す</button></div>';
      if (!rows.length) { html += '<div class="muted">乗降4万人/日以上の住宅街の駅が見つかりませんでした(3万人台の「参考」もなし)。この県は駅力の面で不利です</div></div>'; continue; }
      html += '<div class="tbl-wrap"><table class="list bulk pl-tbl"><thead><tr><th></th><th>判定</th><th>駅</th><th>性格</th><th>市区町村</th><th>路線</th><th>乗降/日</th><th>1km人口</th><th>0-14歳</th><th>住居系</th><th>住宅地性</th><th>駅力</th><th>計</th><th>備考</th></tr></thead><tbody>';
      for (const r of rows) {
        html += '<tr' + (isOn(r) ? '' : ' class="pl-off"') + '><td><input type="checkbox" data-act="st" data-key="' + esc(keyOf(r)) + '"' + (isOn(r) ? ' checked' : '') + '></td>'
          + '<td><span class="pill ' + (r.mark === '◎' ? 'p-go' : r.mark === '○' ? 'p-maybe' : 'p-cond') + '">' + r.mark + '</span></td><td><b>' + esc(r.name) + '</b></td><td class="muted">' + esc(KIND_LABEL[r.kind] || '') + '</td><td>' + esc(r.city) + (r.cityCode ? '' : ' <span class="flag f-warn">市区町村コードなし</span>') + '</td><td class="muted">' + esc(r.lines) + '</td>'
          + '<td>' + r.riders.toLocaleString() + '</td><td>' + r.pop1km.toLocaleString() + '</td><td>' + (r.kids != null ? Math.round(r.kids * 100) + '%' : '-') + '</td><td>' + (r.res != null ? Math.round(r.res * 100) + '%' : '-') + '</td>'
          + '<td title="' + esc(r.detail) + '">' + r.resid + '</td><td>' + r.eki + '</td><td><b>' + r.total + '</b></td><td class="muted">' + (r.ex ? '<span class="flag f-bad">目視で除外: ' + esc(r.ex) + '</span>' : r.mark === '参考' ? '乗降4万人未満=駅力が基準未達' : '') + '</td></tr>';
      }
      html += '</tbody></table></div></div>';
    }
    html += '<details class="acc"><summary>点数の見方</summary><div class="acc-body">住宅地性15点+駅力15点。◎=26点以上で乗降4万人以上(既存店と同じ型)/○=23〜25点/参考=4万人未満で住宅地性が強い駅。家賃・競合はまだ見ていません。自分のおすすめ駅(1件判定の下)は+2点</div></details>';
    box.innerHTML = html;
    renderRange();
  }

  // ===== 探す範囲(athomeで探す単位に直す) =====
  function buildConds() {
    const w = draft.wish;
    const basic = [];
    if (w.money === 'tsubo') basic.push('kc701', w.tsubo); else basic.push('kc501', w.rent);
    if (w.menseki !== 'kt201') basic.push(w.menseki);
    basic.push(...w.struct);
    if (w.walk !== 'ke001') basic.push(w.walk);
    basic.push('kn001', 'kj001');
    const conds = [];
    for (const pref of Object.keys(stationsByPref || {})) {
      const rows = stationsByPref[pref].filter(isOn);
      const code = String(PREFS.indexOf(pref) + 1).padStart(2, '0');
      const roman = ROMAN[PREFS.indexOf(pref)];
      const cities = new Map();
      for (const r of rows) for (const cc of String(r.cityCode || '').split('_')) if (/^\d{5}$/.test(cc)) cities.set(cc, r.city);
      for (const fl of w.floors) {
        const flLabel = (FLOORS.find((x) => x[0] === fl) || ['', fl])[1];
        const wide = fl === 'P08';
        if (!wide && !cities.size) continue;
        conds.push({
          key: 'p' + code + fl, seo: 'rent_store', roman, ken: code, floor: fl,
          label: pref.replace(/[都府県]$/, '') + ' ' + flLabel + (wide ? '(県全域)' : '(' + cities.size + '市区町村)'),
          p: { basicConditions: basic.join(','), insistenceConditions: fl, gyosyuConditions: GYOSYU, stationCds: '', cityCds: wide ? '' : [...cities.keys()].join(',') },
          cities: wide ? [] : [...new Set([...cities.values()].filter(Boolean))], nCities: cities.size, stations: rows.map((r) => r.name),
        });
      }
    }
    return conds;
  }
  function renderRange() {
    const box = $('plan-range');
    if (!stationsByPref) { box.innerHTML = ''; return; }
    const conds = buildConds();
    let html = '<h3 class="bh">③ 不動産サイト(athome)での検索条件はこちらです</h3><div class="card" style="padding:14px 18px">'
      + '<p class="lead">②で選んだ駅から、athomeで検索する条件に組み直しました。よろしければ、一番下のボタンでathomeの物件を抽出します。</p>';
    html += '<div class="muted" style="font-size:13px;color:var(--ink-2)">条件: ' + esc(wishText(draft.wish)) + '</div>';
    if (!conds.length) html += '<div class="bmsg err" style="margin-top:10px">駅がひとつも選ばれていないか、階が選ばれていません</div>';
    else {
      html += '<table class="list pl-range"><thead><tr><th>検索</th><th>範囲</th><th>駅</th></tr></thead><tbody>' + conds.map((c) => '<tr><td><b>' + esc(c.label) + '</b></td><td>' + (c.cities.length ? esc(c.cities.join('、')) : '県全域') + '</td><td class="muted">' + esc(c.stations.join('、')) + '</td></tr>').join('') + '</tbody></table>';
      html += '<div class="muted">件数は抽出のときに検索ごとに出ます(1検索1,000件まで)</div>';
      html += '<div class="pl-savebox"><div class="pl-savebox-h">この条件に名前を付けて保存(任意)</div><div class="muted" style="margin-bottom:6px">保存すると、次回は上の「保存した条件」から1クリックで開き直せます。保存しなくても抽出はできます</div><div class="pl-save" style="margin:0"><input type="text" id="plan-name" placeholder="例: 埼玉・千葉 1階と地下" value="' + esc(draft.name) + '"><button type="button" class="small" data-act="save">保存する</button></div></div>';
      html += '<button type="button" class="go pl-bigcta" data-act="go">athomeで物件を抽出する →<small>athomeが新しいタブで開き、拡張が自動で集めます</small></button>';
    }
    html += '</div>';
    box.innerHTML = html;
  }
  function b64url(str) {
    const bytes = new TextEncoder().encode(str);
    let s = ''; for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function goAthome() {
    const cr = await loadCityRoman();
    const conds = buildConds();
    if (!conds.length) { msg('探す範囲がありません', true); return; }
    const payload = { v: 1, at: Date.now(), name: draft.name || '条件', desc: draft.wish.prefs.map((c) => PREFS[parseInt(c, 10) - 1].replace(/[都府県]$/, '')).join('・') + ' / ' + wishText(draft.wish), conds: conds.map((c) => ({ key: c.key, label: c.label, seo: c.seo, roman: c.roman, ken: c.ken, p: c.p, stations: c.stations })) };
    // athomeの画面にも1つ目の検索を出す(条件なしの県全件が出て「どの検索か分からない」を防ぐ)。集めるのはブックマークレットが # の条件で行う
    const c0 = conds[0];
    const romans = c0.p.cityCds ? c0.p.cityCds.split(',').map((c) => (cr[c] || [])[0]).filter(Boolean) : [];
    const q = 'pref=' + c0.ken + (romans.length ? '&cities=' + romans.join(',') + '&cityCds=' + c0.p.cityCds : '') + '&basic=' + c0.p.basicConditions + (draft.wish.money === 'tsubo' ? '&tsubo=0&tanka=1' : '') + '&kod=' + c0.p.insistenceConditions + '&ind=' + c0.p.gyosyuConditions + '&q=1&sort=33&limit=30';
    const url = ATHOME + '/rent_store/' + c0.roman + '/list/?' + q + '#bkplan=' + b64url(JSON.stringify(payload));
    if (url.length > 60000) { msg('条件が大きすぎます(駅を減らしてください)', true); return; }
    window.open(url, '_blank', 'noopener');
    msg('athomeを開きました(画面に出ている一覧は1つ目の検索「' + c0.label + '」です)');
    const bm = document.querySelector('#bulk-sec a.bookmarklet');
    const ext = document.documentElement.dataset.bkExt === '1';
    $('plan-next').innerHTML = ext
      ? '<div class="pl-next-h">次にやること(athomeのタブで)</div><div class="flow"><div class="st"><span class="num">1</span><div class="ico"><i class="ic ic-building"></i></div><b>自動で集まる</b><span>右下に「検索 1 / ' + conds.length + '」<br>数分待つ</span></div><div class="st"><span class="num">2</span><div class="ico"><i class="ic ic-check"></i></div><b>「判定ツールで開く」</b><span>集め終わったら押す</span></div><div class="st"><span class="num">3</span><div class="ico"><i class="ic ic-star"></i></div><b>おすすめ順で表示</b><span>「一括リサーチ」に出ます</span></div></div><div class="muted">開かないときはポップアップブロックを解除してもう一度</div>'
      : '<div class="pl-next-h">次にやること(athomeのタブで)</div>'
      + '<div class="flow"><div class="st"><span class="num">1</span><div class="ico"><i class="ic ic-bookmark"></i></div><b>ブックマークを押す</b><span>Chromeのブックマークバー<br>(athomeのお気に入りではない)</span></div><div class="st"><span class="num">2</span><div class="ico"><i class="ic ic-building"></i></div><b>自動で集まる</b><span>右下に「検索 1 / ' + conds.length + '」<br>数分待つ</span></div><div class="st"><span class="num">3</span><div class="ico"><i class="ic ic-check"></i></div><b>「判定ツールで開く」</b><span>おすすめ順で表示</span></div></div>'
      + '<details class="acc"><summary>ブックマークをまだ登録していない</summary><div class="acc-body">⌘+Shift+B でバーを出し、このボタンをドラッグして登録(1回だけ): ' + (bm ? '<a class="bookmarklet" href="' + bm.getAttribute('href').replace(/"/g, '&quot;') + '" style="margin:4px 0">一括リサーチ</a>' : '') + '</div></details>'
      + '<div class="muted">開かないときはポップアップブロックを解除してもう一度</div>';
    $('plan-next').hidden = false;
    $('plan-next').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ===== 保存した条件 =====
  function plans() { return ls.get(PLANS_KEY, []); }
  function savePlan() {
    const name = ($('plan-name').value || '').trim() || '条件 ' + new Date().toLocaleDateString('ja-JP');
    readForm();
    const list = plans();
    const rec = { id: draft.id || 'pl' + Date.now(), name, at: Date.now(), wish: draft.wish, on: draft.on, off: draft.off };
    const i = list.findIndex((p) => p.id === rec.id);
    if (i >= 0) list[i] = rec; else list.push(rec);
    if (!ls.set(PLANS_KEY, list)) { msg('保存できませんでした(ブラウザの保存容量)', true); return; }
    draft.id = rec.id; draft.name = name; ls.set(DRAFT_KEY, draft);
    renderSaved(); msg('保存しました: ' + name);
  }
  function loadPlan(id) {
    const p = plans().find((x) => x.id === id);
    if (!p) return;
    draft = { id: p.id, name: p.name, wish: p.wish, on: p.on || [], off: p.off || [] };
    ls.set(DRAFT_KEY, draft);
    stationsByPref = null;
    renderForm(); renderSaved(); renderStations();
    makeStations();
  }
  function dupPlan(id) {
    const p = plans().find((x) => x.id === id);
    if (!p) return;
    draft = { id: null, name: p.name + ' のコピー', wish: p.wish, on: p.on || [], off: p.off || [] };
    ls.set(DRAFT_KEY, draft);
    renderForm(); renderSaved(); makeStations();
    msg('「' + p.name + '」を複製しました。名前を変えて「この条件を保存」を押すと一覧に増えます');
  }
  function delPlan(id) {
    const p = plans().find((x) => x.id === id);
    if (!p || !confirm('「' + p.name + '」を削除しますか?')) return;
    ls.set(PLANS_KEY, plans().filter((x) => x.id !== id));
    if (draft.id === id) { draft.id = null; ls.set(DRAFT_KEY, draft); }
    renderSaved();
  }
  function renderSaved() {
    const list = plans().slice().sort((a, b) => b.at - a.at);
    $('plan-saved').innerHTML = list.length ? '<div class="pl-saved-h">保存した条件</div>' + list.map((p) => '<div class="pl-saved-row' + (p.id === draft.id ? ' on' : '') + '"><b>' + esc(p.name) + '</b> <span class="muted">' + p.wish.prefs.map((c) => PREFS[parseInt(c, 10) - 1].replace(/[都府県]$/, '')).join('・') + ' / ' + esc(wishText(p.wish)) + '</span> '
      + '<button type="button" class="linkbtn" data-act="load" data-id="' + p.id + '">開く</button><button type="button" class="linkbtn" data-act="dup" data-id="' + p.id + '">複製</button><button type="button" class="linkbtn" data-act="del" data-id="' + p.id + '">削除</button></div>').join('')
      : '<div class="muted">保存した条件はまだありません。下で希望を入れて「おすすめ駅を出す」→ 名前を付けて保存すると、次回からここから開けます</div>';
  }

  async function makeStations(auto) {
    const w = readForm();
    if (!w.prefs.length) { msg('都道府県を選んでください(上の一覧でチェック)', true); return; }
    if (!w.floors.length) { msg('階を選んでください', true); return; }
    if (!w.struct.length) { msg('構造を選んでください', true); return; }
    msg('おすすめ駅を計算しています…');
    try {
      stationsByPref = await scoreStations(w.prefs.slice().sort((a, b) => { const ia = RANK.indexOf(PREFS[+a - 1]), ib = RANK.indexOf(PREFS[+b - 1]); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (+a - +b); }), w);
      const n = Object.values(stationsByPref).reduce((s, r) => s + r.length, 0);
      msg((auto ? '条件が変わったので出し直しました: ' : 'おすすめ駅を出しました: ') + Object.keys(stationsByPref).length + '県・' + n + '駅。チェックを見直してから③へ');
      renderStations();
      if (!auto) $('plan-stations').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { msg('おすすめ駅を計算できませんでした: ' + e.message, true); }
  }

  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'stations') makeStations();
    else if (act === 'torange') $('plan-range').scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (act === 'prefall' || act === 'prefnone') { $('plan-form').querySelectorAll('input[name="pref"]').forEach((i) => { i.checked = act === 'prefall'; }); readForm(); if (stationsByPref) makeStations(true); }
    else if (act === 'save') savePlan();
    else if (act === 'go') { readForm(); goAthome(); }
    else if (act === 'load') loadPlan(b.dataset.id);
    else if (act === 'dup') dupPlan(b.dataset.id);
    else if (act === 'del') delPlan(b.dataset.id);
    else if (act === 'allon' || act === 'alloff') {
      const rows = stationsByPref[b.dataset.pref] || [];
      for (const r of rows) {
        const k = keyOf(r);
        draft.on = draft.on.filter((x) => x !== k); draft.off = draft.off.filter((x) => x !== k);
        if (act === 'alloff') draft.off.push(k);
        else if (!defOn(r)) draft.off.push(k);
      }
      ls.set(DRAFT_KEY, draft); renderStations();
    }
  }
  function onChange(e) {
    const el = e.target;
    if (el.dataset.act === 'st') {
      const k = el.dataset.key;
      draft.on = draft.on.filter((x) => x !== k); draft.off = draft.off.filter((x) => x !== k);
      const r = Object.values(stationsByPref).flat().find((x) => keyOf(x) === k);
      const def = r ? defOn(r) : false;
      if (el.checked !== def) (el.checked ? draft.on : draft.off).push(k);
      ls.set(DRAFT_KEY, draft); renderStations();
      return;
    }
    if (el.closest('#plan-form')) {
      if (el.name === 'money') { $('plan-form').querySelector('select[name="tsubo"]').hidden = el.value !== 'tsubo'; $('plan-form').querySelector('select[name="rent"]').hidden = el.value !== 'rent'; }
      readForm();
      if (stationsByPref) {
        if (['pref', 'riders', 'kinds'].includes(el.name)) { clearTimeout(autoTimer); autoTimer = setTimeout(() => makeStations(true), 400); }
        else renderRange();
      }
    }
  }
  let autoTimer = null;
  let shown = false;
  function show() {
    if (shown) return;
    shown = true;
    renderForm(); renderSaved();
  }
  function init() {
    const sec = $('plan-sec');
    if (!sec) return;
    sec.addEventListener('click', onClick);
    sec.addEventListener('change', onChange);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.Plan = { show, buildConds };
})();
