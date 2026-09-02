// ブラウザ版パーサー(athome HTML / ブックマークレットの取り込みデータ / athome印刷PDFのテキスト / 手入力)
// Node版 lib/parseAthome.js・lib/parsePdf.js の移植。判定に必要な prop オブジェクトを返す
(function (root) {
  'use strict';

  function parseYen(str) {
    if (!str) return null;
    const m = String(str).match(/([\d,.]+)\s*万円/);
    if (m) return Math.round(parseFloat(m[1].replace(/,/g, '')) * 10000);
    const y = String(str).match(/([\d,]+)\s*円/);
    if (y) return parseInt(y[1].replace(/,/g, ''), 10);
    return null;
  }
  function parseMonths(str) {
    str = String(str || '');
    if (!str.trim()) return { months: 0 };
    const m = str.match(/([\d.]+)\s*(?:ヶ月|カ月|か月)/);
    if (m) return { months: parseFloat(m[1]) };
    if (/なし|無|－|^-$/.test(str.trim())) return { months: 0 };
    const yen = parseYen(str);
    if (yen) return { yen };
    return { months: 0 };
  }
  function parseStations(text) {
    const out = [];
    const re = /([^\s\/／]+(?:線|ライン|ライナー|エクスプレス|鉄道))\s*[\/／]?\s*([^\s\/／]+?)駅?\s*徒歩\s*(\d+)\s*分/g;
    let m;
    while ((m = re.exec(text || '')) !== null) out.push({ line: m[1], station: m[2].replace(/駅$/, ''), walk: parseInt(m[3], 10) });
    return out;
  }
  function findKey(map, ...cands) {
    for (const c of cands) { const hit = Object.keys(map).find((k) => k.includes(c)); if (hit) return map[hit]; }
    return null;
  }

  // ブックマークレット/HTMLから抽出した生データ {title, pairs, trafficText, pointText, comment, url} → prop
  function fromCapture(cap) {
    const map = cap.pairs || {};
    const rentStr = findKey(map, '賃料');
    const mgmtStr = findKey(map, '管理費', '共益費');
    const prop = {
      source: cap.source || 'athome',
      url: cap.url || null,
      title: (cap.title || '').replace(/\s+/g, ' ').trim(),
      address: (findKey(map, '所在地') || '').replace(/地図で見る/g, '').trim() || null,
      rentYen: parseYen(rentStr),
      mgmtYen: parseYen(mgmtStr) || 0,
      areaSqm: (() => { const s = findKey(map, '使用部分面積', '面積'); const m = s && s.match(/([\d.]+)\s*(?:m|㎡)/); return m ? parseFloat(m[1]) : null; })(),
      tsubo: (() => { const s = findKey(map, '坪数'); const m = s && s.match(/([\d.]+)\s*坪/); return m ? parseFloat(m[1]) : null; })(),
      tsuboTankaYen: parseYen(findKey(map, '坪単価')),
      shikikin: null, hoshokin: null,
      reikin: parseMonths(findKey(map, '礼金') || ''),
      shikibiki: findKey(map, '敷引'),
      built: findKey(map, '築年月'),
      structure: findKey(map, '構造'),
      floors: findKey(map, '階建') || Object.values(map).find((v) => /\d+階建\s*[\/／]/.test(v)) || null,
      stations: parseStations(cap.trafficText || findKey(map, '交通') || ''),
      genkyo: findKey(map, '現況'),
      contract: findKey(map, '契約期間'),
      tokki: [findKey(map, '特記事項'), cap.pointText].filter(Boolean).join('、'),
      equip: findKey(map, '設備'),
      comment: cap.comment || null,
    };
    const sh = findKey(map, '敷金');
    if (sh) {
      const parts = sh.split(/[\/／]/).map((s) => s.trim());
      prop.shikikin = parseMonths(parts[0] || '');
      prop.hoshokin = parts.length > 1 ? parseMonths(parts[1]) : { months: 0 };
    }
    if (!prop.rentYen || !prop.areaSqm) throw new Error('物件データを読み取れませんでした(賃料か面積が見つかりません)。手入力をお試しください');
    return prop;
  }

  // athomeのHTML文字列 → capture形式(DOMParser)
  function captureFromHtml(html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return captureFromDocument(doc, url);
  }
  function captureFromDocument(doc, url) {
    const pairs = {};
    doc.querySelectorAll('tr').forEach((tr) => {
      const cells = [...tr.children].filter((c) => /^(TH|TD)$/.test(c.tagName));
      for (let i = 0; i < cells.length - 1; i++) {
        if (cells[i].tagName === 'TH' && cells[i + 1].tagName === 'TD') {
          const key = cells[i].textContent.replace(/\s+/g, '');
          const val = cells[i + 1].textContent.replace(/\s+/g, ' ').trim();
          if (key && val && !(key in pairs)) pairs[key] = val;
          i++;
        }
      }
    });
    let trafficText = '';
    const th = [...doc.querySelectorAll('th')].find((el) => el.textContent.includes('交通'));
    if (th && th.nextElementSibling) trafficText = [...th.nextElementSibling.querySelectorAll('p, li, div')].map((p) => p.textContent).join('\n') || th.nextElementSibling.textContent;
    const dt = [...doc.querySelectorAll('dt')].find((el) => el.textContent.includes('ポイント'));
    const pointText = dt && dt.nextElementSibling ? dt.nextElementSibling.textContent.replace(/\s+/g, ' ').trim() : '';
    const cm = doc.querySelector('.shop-comment__comment');
    const h1 = doc.querySelector('h1');
    return { source: 'athome', url: url || null, title: (h1 ? h1.textContent : doc.title || '').trim(), pairs, trafficText, pointText, comment: cm ? cm.textContent.trim() : null };
  }

  // athome印刷PDFのテキスト → prop
  function fromPdfText(rawText) {
    const t = rawText.normalize('NFKC');
    const grab = (label) => { const m = t.match(new RegExp('(?:' + label + ')[\\s:：\\t]*([^\\n\\t]+)')); return m ? m[1].trim() : null; };
    const rentLine = grab('賃料[\\/／]?管理費等?') || grab('賃料');
    const tokkiMatch = t.match(/特記事項[\s:：\t]*([\s\S]*?)(?=\n(?:バス|設備|その他|契約期間|現況)|\n\n)/);
    const prop = {
      source: 'pdf', url: null,
      title: (t.match(/^.*(?:の貸店舗|の貸事務所|貸店舗・事務所).*$/m) || [null])[0],
      address: grab('所在地'),
      rentYen: parseYen(rentLine || ''), mgmtYen: 0,
      areaSqm: (() => { const m = t.match(/(?:使用部分面積|面積)[\s:：\t]*([\d.]+)\s*(?:m|㎡)/); return m ? parseFloat(m[1]) : null; })(),
      tsubo: (() => { const m = t.match(/坪数[\s:：\t]*([\d.]+)/); return m ? parseFloat(m[1]) : null; })(),
      tsuboTankaYen: parseYen(grab('坪単価') || ''),
      shikikin: null, hoshokin: null,
      reikin: parseMonths(grab('礼金') || ''),
      built: grab('築年月'), structure: grab('建物構造|構造・工法|構造'),
      floors: (t.match(/(\d+階建\s*[\/／]\s*(?:地下)?\d+階)/) || [null])[0],
      stations: parseStations(t.split(/情報提供会社/)[0]),
      genkyo: grab('現況'), contract: grab('契約期間'),
      tokki: tokkiMatch ? tokkiMatch[1].replace(/\s+/g, '') : '',
      equip: grab('設備・サービス|設備'), comment: null,
    };
    if (rentLine) { const parts = rentLine.split(/[\/／]/); if (parts[1] && !/なし|無/.test(parts[1])) prop.mgmtYen = parseYen(parts[1]) || 0; }
    const sh = grab('敷金[\\/／]保証金|敷金');
    if (sh) { const parts = sh.split(/[\/／]/).map((s) => s.trim()); prop.shikikin = parseMonths(parts[0] || ''); prop.hoshokin = parts.length > 1 ? parseMonths(parts[1]) : { months: 0 }; }
    if (!prop.floors) { const z = t.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)); const m = z.match(/ビルの\s*(\d+)\s*階|(\d+)\s*階部分/); if (m) prop.floors = '階建不明 / ' + (m[1] || m[2]) + '階(資料コメントから推定)'; }
    if (!prop.rentYen || !prop.areaSqm) throw new Error('PDFから物件データを読み取れませんでした。athome形式の物件資料PDFか確認してください');
    return prop;
  }

  // 手入力フォーム → prop
  function fromManual(f) {
    const num = (v) => { const n = Number(String(v || '').replace(/[,，]/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };
    const stations = [];
    if (f.station && f.walk) stations.push({ line: f.line || '', station: String(f.station).replace(/駅$/, '').trim(), walk: Number(f.walk) });
    const floorsStr = (f.building ? f.building + '階建' : '階建不明') + ' / ' + (f.floor === 'B1' ? '地下1階' : f.floor === 'M2' ? '中2階' : (f.floor || '?') + '階');
    const prop = {
      source: 'manual', url: null, title: f.title || '手入力の物件',
      address: (f.pref || '') + (f.city || '') + (f.addr || ''),
      rentYen: num(f.rentMan) ? Math.round(num(f.rentMan) * 10000) : null,
      mgmtYen: num(f.mgmtMan) ? Math.round(num(f.mgmtMan) * 10000) : 0,
      areaSqm: num(f.area), tsubo: num(f.area) ? Math.round(num(f.area) / 3.30578 * 100) / 100 : null,
      tsuboTankaYen: null,
      shikikin: { months: num(f.shikikin) || 0 }, hoshokin: { months: num(f.hoshokin) || 0 }, reikin: { months: num(f.reikin) || 0 },
      shikibiki: null, built: f.built || null, structure: f.structure || '', floors: floorsStr,
      stations, genkyo: f.genkyo || '', contract: f.contract || '',
      tokki: [f.oneTenant ? '1フロア1テナント' : '', f.h24 ? '24時間利用可' : ''].filter(Boolean).join('、'),
      equip: '', comment: null,
    };
    if (!prop.rentYen || !prop.areaSqm) throw new Error('家賃と面積は必須です');
    return prop;
  }

  root.Parsers = { parseYen, parseMonths, parseStations, fromCapture, captureFromHtml, captureFromDocument, fromPdfText, fromManual };
})(typeof self !== 'undefined' ? self : this);
