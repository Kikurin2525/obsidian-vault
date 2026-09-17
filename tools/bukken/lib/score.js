// 判定ロジック(Node/ブラウザ共用)。データは setData() で注入する
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./breakeven'));
  else root.Score = factory(root.Breakeven);
})(typeof self !== 'undefined' ? self : this, function (Breakeven) {
'use strict';
// stationData=おすすめ駅フラグ(+概算乗降客数)の手作りリスト / statsIndex=国土数値情報から前処理した駅指標(駅名→候補配列)
let stationData = {};
let statsIndex = null;
function setData(d) {
  if (d.stationData) stationData = d.stationData;
  if (d.statsIndex !== undefined) statsIndex = d.statsIndex;
}

const PREFS = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

// 駅名から候補を引き、物件住所(都道府県・市区町村)で同名駅を絞る
function lookupStats(name, address) {
  if (!statsIndex) return null;
  const norm = (s) => String(s || '').replace(/駅$/, '').replace(/ヶ/g, 'ケ').replace(/[\s　]/g, '');
  let cands = statsIndex[name] || statsIndex[norm(name)] || null;
  if (!cands) {
    const key = Object.keys(statsIndex).find((k) => norm(k) === norm(name));
    cands = key ? statsIndex[key] : null;
  }
  if (!cands || !cands.length) return null;
  if (cands.length === 1) return cands[0];
  const addr = String(address || '');
  const pref = PREFS.find((p) => addr.startsWith(p));
  let pool = cands.filter((c) => c.city && addr.includes(c.city));
  if (!pool.length && pref) pool = cands.filter((c) => c.pref === pref);
  if (!pool.length) pool = cands;
  return pool.slice().sort((a, b) => (b.riders || 0) - (a.riders || 0))[0];
}

// 黒字ラインは「黒字に必要な時間(1日あたり)」で判定する(2026-09-17 本人指示。基準は lib/breakeven.js の HOURS_LIMITS)
// %で切ると、24時間営業で入力したときに割る数が大きくなって判定が甘く出るため
function breakevenGrade(hoursPerDay) {
  return Breakeven.gradeHours(hoursPerDay);
}

function lookupStation(name, address) {
  const legacy = stationData[name] ? { name, ...stationData[name] }
    : (() => { const hit = Object.keys(stationData).find((k) => k === name); return hit ? { name: hit, ...stationData[hit] } : null; })();
  const st = lookupStats(name, address);
  if (st) {
    return {
      name: st.name,
      riders: st.riders || (legacy && legacy.riders) || null,
      line: (st.lines || []).join('・') || (legacy && legacy.line) || '',
      ridersSource: st.riders ? `国土数値情報S12・${st.ridersYear || 2023}年` : (legacy ? '内蔵の概算値' : null),
      priority: !!(legacy && legacy.priority),
      stats: st,
    };
  }
  if (legacy) return { ...legacy, ridersSource: '内蔵の概算値', stats: null };
  return null;
}

// ===== 住宅地性(15点)の採点 =====
// A 住居系用途地域の比率(500m圏)0〜5 / B 夜間人口(1km圏)0〜4 / C 年少人口比率(0-14歳)0〜3 / D 乗降客数÷夜間人口(ビジネス街・繁華街度、低いほど良い)0〜3
// ペナルティ: 大学至近(学生街)・商業地域主体(繁華街)。加点: ユーザーのおすすめ駅リスト(+2)
function residentialFromStats(st, priority) {
  const parts = [];
  let pts = 0, max = 0;
  const hasZoning = st.zoning_cov != null && st.zoning_cov >= 0.3;
  if (hasZoning) {
    const r = st.res_share;
    const a = r >= 0.7 ? 5 : r >= 0.6 ? 4 : r >= 0.5 ? 3 : r >= 0.35 ? 2 : r >= 0.2 ? 1 : 0;
    pts += a; max += 5; parts.push(`住居系用途地域 ${Math.round(r * 100)}%(${a}/5)`);
  }
  const p = st.pop1km || 0;
  const b = p >= 30000 ? 4 : p >= 20000 ? 3 : p >= 12000 ? 2 : p >= 6000 ? 1 : 0;
  pts += b; max += 4; parts.push(`1km圏人口 ${p.toLocaleString()}人(${b}/4)`);
  if (st.kidsRatio != null) {
    const k = st.kidsRatio;
    const c = k >= 0.13 ? 3 : k >= 0.11 ? 2 : k >= 0.09 ? 1 : 0;
    pts += c; max += 3; parts.push(`子ども(0-14歳)比率 ${(k * 100).toFixed(1)}%(${c}/3)`);
  }
  if (p > 0 && st.riders) {
    const ratio = st.riders / p;
    const d = ratio <= 1.0 ? 3 : ratio <= 2.0 ? 2 : ratio <= 4.0 ? 1 : 0;
    pts += d; max += 3; parts.push(`乗降客÷住民 ${ratio.toFixed(1)}倍(${d}/3・低いほど住宅街)`);
  }
  let scaledPts = max > 0 ? (pts / max) * 15 : 7;
  const pen = [];
  // P29は学部・キャンパス単位で1点になるので件数が膨らむ。8件以上=学生街、4件以上=学生街寄り、2件以上=軽い減点
  if (st.univ1km >= 8) { scaledPts -= 3; pen.push(`大学施設が1km圏に${st.univ1km}件(学生街) -3`); }
  else if (st.univ1km >= 4) { scaledPts -= 2; pen.push(`大学施設が1km圏に${st.univ1km}件(学生街寄り) -2`); }
  else if (st.univ1km >= 2) { scaledPts -= 1; pen.push(`大学施設が1km圏に${st.univ1km}件 -1`); }
  if (hasZoning && st.com_share >= 0.7) { scaledPts -= 3; pen.push('商業地域が7割超(繁華街) -3'); }
  else if (hasZoning && st.com_share >= 0.55) { scaledPts -= 1; pen.push('商業地域が5.5割超(駅前は商業色) -1'); }
  if (priority) { scaledPts += 2; pen.push('おすすめ駅リスト +2'); }
  const finalPts = Math.max(0, Math.min(15, Math.round(scaledPts)));
  const grade = finalPts >= 12 ? '◎' : finalPts >= 9 ? '○' : finalPts >= 6 ? '△' : '✕';
  const summary = grade === '◎' ? '住宅街の駅。住民が多く、ダンス需要の土台がある'
    : grade === '○' ? 'おおむね住宅地。内見で街の雰囲気を確認'
    : grade === '△' ? '住宅地性は弱め(商業・業務・学生街の色がある)。客層を要確認'
    : '住宅地性が低い(繁華街・ビジネス街・学生街)。近隣住民の需要に頼れない';
  return { pts: finalPts, grade, summary, detail: parts.concat(pen).join(' / '), source: 'stats' };
}

// Phase 0: データが無い駅は本人の観察(3問)で暫定採点
// ===== 駅力15点と駅の性格(条件づくり・全国一覧・1件判定で共通。2026-09-17 実態に合わせて改定) =====
// 大都市圏(首都圏4都県+大阪・兵庫)は乗降客数の線=4万人。それ以外(地方・京都など)は車やバスの街で駅の利用が少ないので、線を1万人下げる(改定A)
const METRO_PREFS = ['東京都', '神奈川県', '埼玉県', '千葉県', '大阪府', '兵庫県'];
function isLocalPref(pref) { return !!pref && METRO_PREFS.indexOf(pref) < 0; }
function ridersShift(pref) { return isLocalPref(pref) ? 10000 : 0; }
// 改定① 線の1段下(大都市圏=3万人台/地方=2万人台)でも、住宅地性が13点以上なら線の上と同じ13点(○まで)。住宅地として満点級なのに乗降客数の線だけで落ちる駅(例: 緑地公園・桃山台・香椎)を拾う
// 用途地域のデータが無い駅(大阪市内など)は住宅地性が甘く出るので、格上げの対象にしない(hasZoning=false のとき)
function isRidersUpgraded(riders, residPts, hasZoning, pref) {
  const sh = ridersShift(pref);
  return hasZoning !== false && riders >= 30000 - sh && riders < 40000 - sh && residPts != null && residPts >= 13;
}
function eki15(riders, residPts, hasZoning, pref) {
  const sh = ridersShift(pref);
  if (riders >= 50000 - sh) return 15;
  if (riders >= 40000 - sh) return 13;
  if (riders >= 30000 - sh) return isRidersUpgraded(riders, residPts, hasZoning, pref) ? 13 : 10;
  return 3;
}
// 駅の性格: 学生街(大学施設4件以上) > オフィス街(乗降客が住民の4倍超) > 商業・繁華街(商業地域5.5割超、または住民比2倍超で商業3.5割以上) > 住宅街(住居系6割以上) > 混在
// 改定② 「商業」と出ても、商業地域が7割未満・1km圏の住民3万人以上・子ども11%以上・合計23点以上なら「混在」に戻す(ベッドタウンやニュータウンの中心駅。例: 千里中央・東川口・津田沼)
// 改定B 「学生街」と出ても、大学施設が8件未満・住民3万人以上・子ども11%以上・合計23点以上なら「混在」に戻す(大学施設はキャンパスや学部ごとに数えるので、大きな住宅地ではすぐ4件を超える。例: 西宮北口・駒沢大学)
function kindOfStation(st, total) {
  const p = st.pop1km || 0, ratio = p > 0 && st.riders ? st.riders / p : null;
  const z = st.zoning_cov != null && st.zoning_cov >= 0.3;
  let kind;
  if ((st.univ1km || 0) >= 4) kind = 'stu';
  else if (ratio != null && ratio > 4) kind = 'biz';
  else if (z && st.com_share >= 0.55) kind = 'com';
  else if (ratio != null && ratio > 2 && z && st.com_share >= 0.35) kind = 'com';
  else if (z ? st.res_share >= 0.6 : (ratio != null && ratio <= 1)) kind = 'res';
  else kind = 'mix';
  let relaxed = '';
  const family = p >= 30000 && (st.kidsRatio || 0) >= 0.11 && total != null && total >= 23;
  if (kind === 'com' && !(z && st.com_share >= 0.7) && family) { kind = 'mix'; relaxed = 'com'; }
  else if (kind === 'stu' && (st.univ1km || 0) < 8 && family) { kind = 'mix'; relaxed = 'stu'; }
  return { kind, relaxed };
}
// きくりん式のおすすめ駅の判定(◎○参考)。mark=null は対象外
function stationMark(st, priority) {
  const resid = residentialFromStats(st, priority);
  const hasZoning = st.zoning_cov != null && st.zoning_cov >= 0.3;
  const pref = st.pref || '';
  const sh = ridersShift(pref);
  const eki = eki15(st.riders || 0, resid.pts, hasZoning, pref);
  const total = resid.pts + eki;
  const upgraded = isRidersUpgraded(st.riders || 0, resid.pts, hasZoning, pref);
  const k = kindOfStation(st, total);
  let mark = null;
  if (upgraded) mark = total >= 23 ? '○' : null;            // 格上げ組は○まで(◎にはしない)
  else if (total >= 26 && eki >= 13) mark = '◎';
  else if (total >= 23 && total <= 25 && eki >= 13) mark = '○';
  else if (eki < 13 && resid.pts >= 11) mark = '参考';
  const man = (n) => (n / 10000) + '万人';
  const notes = [];
  if (sh && eki >= 13) notes.push('地方の駅は乗降客数の線を1万人下げて判定');
  if (upgraded) notes.push('乗降' + man(30000 - sh) + '台だが住宅地性が高い(13点以上)ので○');
  if (k.relaxed === 'com') notes.push('駅前は商業地だが、まわりは住民と子どもが多い住宅地');
  if (k.relaxed === 'stu') notes.push('大学はあるが、まわりは住民と子どもが多い住宅地');
  if (!hasZoning) notes.push('用途地域データなし(住宅地かどうかは現地で確認)');
  return { resid, eki, total, mark, kind: k.kind, relaxed: k.relaxed, upgraded, local: !!sh, lineRiders: 40000 - sh, note: notes.join(' / ') };
}

function residentialFromManual(m) {
  const TYPE = { residential: [10, '住宅街'], mixed: [7, '商店街・住宅混在'], student: [5, '学生街'], tourist: [4, '観光地'], business: [3, 'ビジネス街'], downtown: [3, '繁華街'] };
  const t = TYPE[m.type] || [6, '不明'];
  let pts = t[0];
  const parts = [`駅前の性格: ${t[1]}(${t[0]})`];
  if (m.kids === 'many') { pts += 3; parts.push('子育て世帯が多い +3'); }
  else if (m.kids === 'normal') { pts += 1; parts.push('子育て世帯ふつう +1'); }
  else parts.push('子育て世帯が少ない +0');
  if (m.night) { pts -= 2; parts.push('夜の街(飲み屋・深夜営業が目立つ) -2'); }
  pts = Math.max(0, Math.min(15, pts));
  const grade = pts >= 12 ? '◎' : pts >= 9 ? '○' : pts >= 6 ? '△' : '✕';
  return { pts, grade, summary: '本人の観察による暫定採点(データ未登録の駅)', detail: parts.join(' / '), source: 'manual' };
}

function parseUnitFloor(floorsStr) {
  // "4階建 / 1階" → {building: 4, unit: 1} / "地下1階" → unit: -1 / "中2階" → unit: 1.5
  if (!floorsStr) return { building: null, unit: null };
  const b = floorsStr.match(/(\d+)階建/);
  const rest = floorsStr.split(/[\/／]/).pop() || floorsStr;
  let unit = null;
  if (/地下\s*(\d+)階/.test(rest)) unit = -parseInt(RegExp.$1, 10);
  else if (/中\s*2\s*階/.test(rest)) unit = 1.5;
  else if (/(\d+)階/.test(rest)) unit = parseInt(RegExp.$1, 10);
  return { building: b ? parseInt(b[1], 10) : null, unit };
}

function monthsToYen(m, rentYen) {
  if (!m) return 0;
  if (m.yen) return m.yen;
  return Math.round((m.months || 0) * rentYen);
}

// 配点(2026-09-02改定・合計100): エリア駅力15 / 住宅地性15 / 家賃坪単価15 / 家賃リスク15 / 初期費用10 / 面積12 / 階数音振動12 / 内装費6
// 各項目の段階点は旧配点(20/15/10)で作ってあるので、新配点にスケーリングする
function scaled(pts, oldMax, newMax) {
  return { pts: Math.round((pts / oldMax) * newMax), max: newMax };
}

function stationPoints(r) {
  if (r >= 50000) return 20;
  if (r >= 40000) return 16;
  if (r >= 30000) return 10;
  return 3;
}
function prefOf(address) { const a = String(address || ''); return PREFS.find((p) => a.startsWith(p)) || ''; }

function judge(prop, opts = {}) {
  const rent = (prop.rentYen || 0) + (prop.mgmtYen || 0);
  const ridersOverride = opts.riders != null && opts.riders !== '' ? Number(opts.riders) : null;

  const items = [];
  const ng = [];
  const questions = [];
  const breakdown = {};

  // ===== 1. 駅力(乗降客数) 20点 =====
  const enriched = (prop.stations || []).map((s) => ({ ...s, data: lookupStation(s.station, prop.address) }));
  // 判定に使う駅 = 徒歩10分以内で最も乗降客数が多い駅(データがある駅優先)
  const candidates = enriched.filter((s) => s.walk <= 10);
  const best = candidates
    .slice()
    .sort((a, b) => ((b.data && b.data.riders) || -1) - ((a.data && a.data.riders) || -1))[0] || enriched[0];

  let stationPts = 10;
  const stationName = best ? (best.data ? best.data.name : best.station) : null;
  const riders = ridersOverride != null && best ? ridersOverride : (best && best.data ? best.data.riders : null);
  if (best && riders != null) {
    const r = riders;
    const sh = ridersShift(prefOf(prop.address));   // 地方は線を1万人下げる(改定A)
    const man = (n) => (n / 10000) + '万人';
    stationPts = stationPoints(r + sh);
    const src = ridersOverride != null ? '手入力値' : `${best.data.line ? best.data.line + '・' : ''}${best.data.ridersSource || '内蔵の概算値'}`;
    items.push({
      key: 'station', label: '駅力(乗降客数)',
      value: `${stationName}駅 約${(r / 10000).toFixed(1)}万人/日 (${src})`,
      grade: r + sh >= 50000 ? '◎' : r + sh >= 40000 ? '○' : r + sh >= 30000 ? '△' : '✕',
      comment: (r + sh >= 40000 ? '基準(' + man(40000 - sh) + '以上)クリア' : r + sh >= 30000 ? man(30000 - sh) + '台。住宅地性と物件条件が良ければ可の水準' : '基準(' + man(30000 - sh) + '以上)を大きく下回る') + (sh ? '。地方の駅なので、乗降客数の線を1万人下げて見ています' : ''),
      station: stationName, ridersSource: ridersOverride != null ? 'manual' : 'builtin',
    });
    if (r + sh < 30000) ng.push(`最寄駅の駅力不足(${stationName}駅 約${(r / 10000).toFixed(1)}万人/日 < 基準${man(30000 - sh)})`);
  } else if (best) {
    items.push({
      key: 'station', label: '駅力(乗降客数)',
      value: `${best.station}駅 — 乗降客数が内蔵データ(約90駅)に未登録`,
      grade: '?',
      comment: '下の欄に1日乗降客数を入力すると駅力を採点します(基準: 4万人以上=○、5万人以上=◎、3万人台=△)。暫定10/20点',
      station: best.station, ridersSource: 'none',
    });
    questions.push(`${best.station}駅の1日乗降客数を確認(基準: 4万人以上)`);
  } else {
    items.push({ key: 'station', label: '駅力(乗降客数)', value: '交通情報を読み取れず', grade: '?', comment: '手動確認が必要' });
  }
  breakdown['エリア駅力'] = scaled(stationPts, 20, 15);

  // ===== 2. 駅徒歩 =====
  if (best) {
    const w = best.walk;
    items.push({
      key: 'walk', label: '駅徒歩',
      value: `${best.station}駅 徒歩${w}分`,
      grade: w <= 5 ? '◎' : w <= 7 ? '○' : '✕',
      comment: w <= 5 ? '理想(5分以内)' : w <= 7 ? '許容範囲(7分以内)' : '基準外(7分超はNG)',
    });
    if (w > 7) ng.push(`駅徒歩${w}分(基準: 7分以内)`);
  }

  // ===== 3. 賃料・坪単価 20点 =====
  const tt = prop.tsuboTankaYen || (prop.tsubo ? Math.round(rent / prop.tsubo) : null);
  let tsuboPts = 8;
  if (tt) {
    if (tt <= 10000) tsuboPts = 20;
    else if (tt <= 12000) tsuboPts = 18;
    else if (tt <= 13000) tsuboPts = 14;
    else if (tt <= 14000) tsuboPts = 8;
    else tsuboPts = 0;
    items.push({
      key: 'tsubo', label: '坪単価',
      value: `${tt.toLocaleString()}円/坪 (賃料${(rent / 10000).toFixed(1)}万円・${prop.tsubo || '?'}坪)`,
      grade: tt <= 12000 ? '◎' : tt <= 13000 ? '○' : tt <= 14000 ? '△' : '✕',
      comment: tt <= 12000 ? '優良(1.2万以下)' : tt <= 13000 ? '基準内(1.3万以下)' : tt <= 14000 ? '上限ぎりぎり(1.4万以下)' : '基準超過(1.4万超はNG)',
    });
    if (tt > 14000) ng.push(`坪単価${tt.toLocaleString()}円(基準: 1.4万円以内)`);
  } else {
    items.push({ key: 'tsubo', label: '坪単価', value: '算出不可', grade: '?', comment: '坪数データなし' });
  }
  // 損益分岐(単価・ポータル比率・営業時間はopts.simで上書き可)。家賃判定の「兼ね合い」に使う
  // 単価は広さ連動の初期値をベースに、手動指定(opts.sim.weekdayRate等)があればそれを優先
  const suggested = Breakeven.suggestRates(prop.areaSqm);
  const simParams = Object.assign({ weekdayRate: suggested.weekdayRate, weekendRate: suggested.weekendRate }, opts.sim || {});
  const be = Breakeven.calc(rent, simParams);
  be.suggested = suggested;
  const breakevenOcc = be.breakevenOcc;
  const beGrade = breakevenGrade(be.breakevenHoursPerDay);
  const beText = `黒字に必要な時間が1日${be.breakevenHoursPerDay.toFixed(1)}時間`;

  // 賃料上限: 20万以内=基準クリア / 20〜25万=許容だが損益分岐との兼ね合いで判定 / 25万超=NG
  const rentMan = (rent / 10000).toFixed(1);
  if (rent > 250000) {
    ng.push(`賃料(管理費込)${rentMan}万円(上限: 25万円)`);
    items.push({ key: 'rent', label: '賃料上限', value: `${rentMan}万円/月(管理費込)`, grade: '✕', comment: '25万円超はNG。家賃が重いほど利益構造が厳しく、少し稼働が落ちただけで赤字になる' });
  } else if (rent > 200000) {
    if (beGrade === '✕') ng.push(`賃料(管理費込)${rentMan}万円は許容内(25万以内)だが、${beText}で黒字ラインが高すぎる`);
    items.push({
      key: 'rent', label: '賃料上限(20〜25万は損益分岐と兼ね合い)', value: `${rentMan}万円/月(管理費込)`,
      grade: beGrade,
      comment: beGrade === '◎' || beGrade === '○'
        ? `20万超だが${beText}で、家賃負担に見合う稼働が現実的`
        : beGrade === '△'
        ? `20万超で${beText}。ふつうに回っている店の稼働が前提になる。立ち上がりの資金余力があれば検討`
        : `20万超で${beText}。繁盛店クラスの稼働が前提になるためNG(単価・営業時間の設定を変えると再判定されます)`,
    });
  } else {
    items.push({ key: 'rent', label: '賃料上限', value: `${rentMan}万円/月(管理費込)`, grade: rent <= 180000 ? '◎' : '○', comment: '基準(20万円以内)クリア' });
  }
  items.push({
    key: 'breakeven', label: '損益分岐(黒字に必要な時間)', value: `1日${be.breakevenHoursPerDay.toFixed(1)}時間(週${be.breakevenHoursPerWeek}時間)の予約・稼働率${breakevenOcc.toFixed(1)}%`,
    grade: beGrade,
    comment: `黒字ラインの${Breakeven.GRADE_GUIDE}。単価${be.params.weekdayRate}/${be.params.weekendRate}円・ポータル${Math.round(be.params.portalShare * 100)}%・営業${be.params.openHours}h/日で計算`,
  });
  breakdown['家賃坪単価'] = scaled(tsuboPts, 20, 15);
  // 家賃リスク15点: 家賃(管理費込)10万以下=満点、25万以上=0。その間は家賃が高いほど直線的に減点(本人指示 2026-09-02)
  const rentRiskPts = Math.round(Math.max(0, Math.min(1, (250000 - rent) / 150000)) * 15);
  breakdown['家賃リスク'] = { pts: rentRiskPts, max: 15 };

  // ===== 4. 面積 15点(業態判定つき) =====
  const a = prop.areaSqm;
  let areaPts = 0, bizType = null;
  if (a != null) {
    if (a >= 50) { areaPts = 15; bizType = '教室利用型(広め・高評価)'; }
    else if (a >= 40) { areaPts = 13; bizType = '教室利用型'; }
    else if (a >= 35) { areaPts = 11; bizType = '教室利用型(最低ライン)'; }
    else if (a >= 30) { areaPts = 8; bizType = '個人練習型(少人数教室も可)'; }
    else if (a >= 20) { areaPts = 5; bizType = '個人練習特化型のみ'; }
    else { areaPts = 0; bizType = null; }
    items.push({
      key: 'area', label: '広さ・想定業態',
      value: `${a}㎡(${prop.tsubo || (a / 3.306).toFixed(1)}坪)`,
      grade: a >= 35 ? '◎' : a >= 20 ? '△' : '✕',
      comment: bizType ? `${bizType}として成立` : '20㎡未満は個人練習でも不可',
    });
    if (a < 20) ng.push(`面積${a}㎡(基準: 個人練習20㎡以上/教室35㎡以上)`);
  }
  breakdown['面積'] = scaled(areaPts, 15, 12);

  // ===== 5. 階数・音振動 15点 =====
  const fl = parseUnitFloor(prop.floors);
  let floorPts = 7;
  if (fl.unit != null) {
    if (fl.unit <= 1 || fl.unit === 1.5) {
      floorPts = 15;
      items.push({
        key: 'floor', label: '階数(音振動リスク)',
        value: `${prop.floors}${fl.unit === -1 ? '(地下)' : ''}`,
        grade: '◎',
        comment: fl.unit === 1 ? '1階=階下リスクなし。優先条件に合致' : fl.unit < 0 ? '地下=音振動に最も強い(湿気・排水臭は要内見確認)' : '中2階=優先条件',
      });
      if (fl.unit < 0) questions.push('地下の湿気・カビ・排水臭・換気の状態(内見必須)');
    } else if (fl.unit === 2) {
      floorPts = 8;
      items.push({ key: 'floor', label: '階数(音振動リスク)', value: prop.floors, grade: '△', comment: '2階=階下用途次第。階下が駐車場・倉庫・店舗共用部なら可、住居・クリニック等はNG' });
      questions.push('【最重要】直下(1階)のテナント用途を確認(住居・事務所・クリニック・整体・サロンならNG)');
    } else {
      floorPts = 4;
      items.push({ key: 'floor', label: '階数(音振動リスク)', value: prop.floors, grade: '✕', comment: `${fl.unit}階=下階への音振動リスク大。原則見送り水準` });
      questions.push('直下テナントの用途と建物の床スラブ厚(高層階は音振動クレームリスク大)');
    }
  } else {
    items.push({ key: 'floor', label: '階数(音振動リスク)', value: prop.floors || '不明', grade: '?', comment: '階数を読み取れず。要確認' });
    questions.push('所在階と直下テナントの用途を確認');
  }
  if (prop.tokki && /1フロア1テナント|ワンフロア/.test(prop.tokki)) {
    items.push({ key: 'oneTenant', label: 'ワンフロアワンテナント', value: 'あり(特記事項に明記)', grade: '◎', comment: '同一階の隣接クレームリスクなし。優先条件' });
  }
  breakdown['階数音振動'] = scaled(floorPts, 15, 12);

  // ===== 6. 構造 =====
  const st = prop.structure || '';
  if (/木造/.test(st)) {
    ng.push(`木造(${st})— 音振動NG`);
    items.push({ key: 'structure', label: '構造', value: st, grade: '✕', comment: '木造はNG(音・振動が伝わりやすい)' });
  } else if (/SRC|RC|鉄筋/.test(st.replace(/[Ｓ]/g, 'S').replace(/[Ｒ]/g, 'R').replace(/[Ｃ]/g, 'C'))) {
    items.push({ key: 'structure', label: '構造', value: st, grade: '◎', comment: 'SRC/RC=音・振動に最も強い構造' });
  } else if (/鉄骨|Ｓ造|S造/.test(st)) {
    items.push({ key: 'structure', label: '構造', value: st, grade: '○', comment: '鉄骨造=可。RC/SRCより音が伝わりやすいので階下用途は要確認' });
  } else if (!st) {
    items.push({ key: 'structure', label: '構造', value: '不明', grade: '?', comment: '構造を確認(SRC/RC=◎、鉄骨=○、それ以外=✕)' });
    questions.push('建物構造を確認(SRC/RC/鉄骨のみ可、木造・その他はNG)');
  } else {
    ng.push(`構造(${st})— SRC/RC/鉄骨以外はNG`);
    items.push({ key: 'structure', label: '構造', value: st, grade: '✕', comment: 'SRC/RC/鉄骨以外はNG' });
  }

  // ===== 7. 内装費 10点(カード表示なし。掲載文のキーワードのみで採点: スケルトン=0点+NG / 居抜き=9点 / 記載なし=5点) =====
  const genkyoAll = [prop.genkyo, prop.tokki, prop.comment].filter(Boolean).join(' ');
  let interiorPts = 5;
  if (/スケルトン/.test(genkyoAll)) {
    interiorPts = 0;
    ng.push('スケルトン物件(原則NG・内装費過大)');
  } else if (/居抜き/.test(genkyoAll)) {
    interiorPts = 9;
  } else {
    questions.push('内装の現況(床材・壁・天井高・電気容量)と原状回復条件');
  }
  breakdown['内装費'] = scaled(interiorPts, 10, 6);

  // ===== 8. 住宅地性 15点(国土数値情報の駅指標から自動採点。無ければ本人の3問で暫定、それも無ければ?) =====
  let res = null;
  if (best && best.data && best.data.stats && best.data.stats.pop1km != null) {
    res = residentialFromStats(best.data.stats, best.data.priority);
  } else if (opts.residential && opts.residential.type) {
    res = residentialFromManual(opts.residential);
  }
  if (res) {
    items.push({
      key: 'residential', label: '住宅地性・エリア', value: `${stationName || ''}駅: ${res.summary}`, grade: res.grade,
      comment: `${res.detail}${res.source === 'stats' ? '(駅1km圏の国勢調査メッシュ・用途地域・学校データから算出。現地の雰囲気は内見で確認)' : ''}`,
      residentialSource: res.source, station: stationName,
    });
    breakdown['住宅地性'] = { pts: res.pts, max: 15 };
    // 改定①(2026-09-17): 乗降3万人台でも住宅地性13点以上なら、駅力は4万人台と同じ扱い(○)
    if (riders != null && res.source === 'stats' && isRidersUpgraded(riders, res.pts, best.data.stats.zoning_cov != null && best.data.stats.zoning_cov >= 0.3, prefOf(prop.address))) {
      const it = items.find((x) => x.key === 'station');
      if (it) { it.grade = '○'; it.comment = '乗降客数は線の1段下だが、住宅地性が高い(13点以上)ので基準クリア扱い'; }
      breakdown['エリア駅力'] = scaled(16, 20, 15);
    }
  } else {
    items.push({
      key: 'residential', label: '住宅地性・エリア', value: `${stationName || '最寄駅'}: データ未登録`, grade: '?',
      comment: 'この駅の人口・用途地域データがありません。下の3問に答えると暫定採点します(暫定7/15点)',
      residentialSource: 'none', station: stationName,
    });
    questions.push('駅周辺の住宅地性・客層(ファミリー層が多いか、繁華街色が強くないか)');
    breakdown['住宅地性'] = { pts: 7, max: 15 };
  }

  // ===== 9. 24時間利用・用途柔軟性 =====
  if (/24\s*時間/.test(prop.tokki)) {
    items.push({ key: 'h24', label: '24時間利用', value: '可(特記事項に明記)', grade: '◎', comment: '24時間営業なら深夜早朝の売上が確保できる' });
  } else {
    items.push({ key: 'h24', label: '24時間利用', value: '記載なし', grade: '?', comment: '要確認。24時間利用不可なら売上構造が大きく変わる' });
    questions.push('24時間利用可否(深夜・早朝の利用制限の有無)');
  }

  // ===== 10. 初期費用 =====
  const shikiYen = monthsToYen(prop.shikikin, rent);
  const hoshoYen = monthsToYen(prop.hoshokin, rent);
  const reiYen = monthsToYen(prop.reikin, rent);
  const chukaiYen = rent; // 仲介手数料1ヶ月と仮定
  const hoshoGaishaYen = rent; // 保証会社初回1ヶ月と仮定
  const maeYachin = rent; // 前家賃1ヶ月
  const initTotal = shikiYen + hoshoYen + reiYen + chukaiYen + hoshoGaishaYen + maeYachin;
  const initMonths = rent ? initTotal / rent : 0;
  items.push({
    key: 'initial', label: '初期費用(概算)',
    value: `約${(initTotal / 10000).toFixed(0)}万円(賃料${initMonths.toFixed(1)}ヶ月分)`,
    grade: initMonths <= 4 ? '◎' : initMonths <= 6 ? '○' : initMonths <= 8 ? '△' : '✕',
    comment: `内訳: 敷金${(shikiYen / 10000).toFixed(1)}万+保証金${(hoshoYen / 10000).toFixed(1)}万+礼金${(reiYen / 10000).toFixed(1)}万+仲介1ヶ月+保証会社1ヶ月+前家賃1ヶ月(仮定)。敷金・保証金は返還前提だが償却条項は要確認`,
  });
  if (hoshoYen > 0) questions.push(`保証金${(hoshoYen / 10000).toFixed(0)}万円の償却(敷引)条件を確認`);
  // 初期費用10点: 賃料何ヶ月分か(4ヶ月以内=10 / 6ヶ月以内=8 / 8ヶ月以内=5 / それ以上=2)。総額200万超はさらに-2
  let initPts = initMonths <= 4 ? 10 : initMonths <= 6 ? 8 : initMonths <= 8 ? 5 : 2;
  if (initTotal > 2000000) initPts = Math.max(0, initPts - 2);
  breakdown['初期費用'] = { pts: initPts, max: 10 };

  // 表示順を固定(家賃まわりを上に)+ 各項目の説明(画面のⓘで表示)
  const DESC = {
    'エリア駅力': '最寄駅(徒歩10分以内で最大)の1日乗降客数。5万人以上=満点、4万人台=16/20相当、3万人台=半分、3万人未満=ほぼ0(3万未満は必須NG)。内蔵の概算データか手入力値',
    '住宅地性': '駅1km圏の国勢調査メッシュ人口・年少人口比率・乗降客数÷住民(ビジネス街度)と、500m圏の用途地域(住居系比率)から合成(15点)。大学至近(学生街)・商業地域主体(繁華街)は減点、自分の「おすすめ駅」登録は+2。データ未登録の駅は3問の手入力で暫定採点',
    '家賃坪単価': '賃料(管理費込)÷坪数。1万円以下=満点、1.2万以下=ほぼ満点、1.3万以下=7割、1.4万以下=4割、1.4万超=0(必須NG)',
    '家賃リスク': '家賃(管理費込)の絶対額。10万円以下=満点15、25万円以上=0。その間は家賃が高いほど直線的に減点(例: 15万=10点、20万=5点)。家賃が重いほど利益構造が厳しく、稼働が少し落ちただけで赤字になる',
    '初期費用': '敷金+保証金+礼金+仲介1ヶ月+保証会社1ヶ月+前家賃1ヶ月の概算が賃料の何ヶ月分か。4ヶ月以内=10、6ヶ月以内=8、8ヶ月以内=5、それ以上=2。総額200万円超はさらに-2',
    '面積': '50㎡以上=満点(教室・大人数向け)、40㎡以上=13/15相当、35㎡以上=11/15相当、30㎡以上=個人練習型で8/15相当、20㎡以上=5/15相当、20㎡未満=0(必須NG)',
    '階数音振動': '地下1階・1階・中2階=満点(階下への音振動リスクなし)。2階=半分(階下用途次第)。3階以上=約1/4(音振動クレームリスク大)',
    '内装費': '掲載文のキーワードのみで採点。「居抜き」=ほぼ満点、記載なし=中間、「スケルトン」=0(必須NG)。実際の内装状態は内見で確認',
  };
  const ordered = {};
  for (const k of ['エリア駅力', '住宅地性', '家賃坪単価', '家賃リスク', '初期費用', '面積', '階数音振動', '内装費']) if (breakdown[k]) ordered[k] = { ...breakdown[k], desc: DESC[k] || '' };
  for (const k of Object.keys(breakdown)) if (!ordered[k]) ordered[k] = breakdown[k];
  for (const k of Object.keys(breakdown)) delete breakdown[k];
  Object.assign(breakdown, ordered);

  // ===== 損益分岐シミュレーション(算出は賃料判定の手前で実施済み。ブラウザ側でも同じ式で再計算) =====
  const breakeven = {
    ...be,
    grade: beGrade,
    comment: be.hoursComment,
  };

  // ===== 定番の確認質問 =====
  questions.push(
    'ダンススタジオ利用・音楽再生の可否(音量制限)',
    'キッズ/ヨガ/ピラティス教室利用の可否',
    '鏡・クッションフロア・音響設備の設置可否と原状回復範囲',
    '上階・隣接テナントの用途(音に敏感なテナントの有無)',
    '天井高(2.4m以上が望ましい)',
    '換気・エアコン・トイレ・給湯の状態',
    '看板・入口案内の掲出可否'
  );
  if (prop.contract && /定期/.test(prop.contract)) questions.unshift('【重要】定期借家の再契約可否(内装投資の回収期間に直結)');

  // ===== 総合 =====
  const total = Object.values(breakdown).reduce((s, b) => s + b.pts, 0);
  // 総合判定: 必須NGあり=見送り / 80点以上=即問い合わせ / 70〜79=問い合わせる価値あり / 60〜69=条件次第 / 59以下=見送り
  let verdict, verdictClass, verdictNote;
  if (ng.length > 0) {
    verdict = '✕ 見送り(必須条件NG)'; verdictClass = 'ng';
    verdictNote = '点数に関係なく、必須条件に引っかかる物件は見送り。NGの内容が交渉で解消できる(家賃など)なら再判定を';
  } else if (total >= 80) {
    verdict = '◎ 即問い合わせ'; verdictClass = 'go';
    verdictNote = `${total}点。条件がそろった物件は取り合いになります。今日中に問い合わせて内見の予約を`;
  } else if (total >= 70) {
    verdict = '○ 問い合わせる価値あり'; verdictClass = 'maybe';
    verdictNote = `${total}点。有力候補。減点されている項目(下の内訳)が許容できるか確認したうえで問い合わせを`;
  } else if (total >= 60) {
    verdict = '△ 条件次第'; verdictClass = 'cond';
    verdictNote = `${total}点。そのままでは弱い。家賃交渉・フリーレント・単価設定などで数字が改善するなら検討`;
  } else {
    verdict = '✕ 見送り'; verdictClass = 'ng';
    verdictNote = `${total}点。基準に届かない。この物件に時間を使うより次を探すほうが早い`;
  }

  return { property: prop, items, breakdown, total, verdict, verdictClass, verdictNote, ng, questions, breakeven };
}

return { judge, setData, residentialFromStats, _residentialFromStats: residentialFromStats, eki15, isRidersUpgraded, kindOfStation, stationMark, isLocalPref };
});
