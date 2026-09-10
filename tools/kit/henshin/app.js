/* 返信ジェネレーター v1.0 — 外部送信なし・保存はlocalStorage */
(function () {
  'use strict';
  const GATE_WORD = 'kit2026';
  const GATE_KEY = 'kit-gate-ok';
  const SAVE_KEY = 'kit-henshin-v1';
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 容量超過など */ } },
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
  const SCENES = window.KIT_TEMPLATES.SCENES;
  let tone = 'polite';
  let patternIdx = 0;
  const TONE_LABEL = { polite: 'ていねい', soft: 'やわらかい', firm: 'きっぱり' };

  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._h); toast._h = setTimeout(() => t.classList.remove('show'), 1600); }

  function currentScene() { return SCENES.find((s) => s.id === $('scene').value) || SCENES[0]; }

  function fmtAmount(raw) {
    const s = (raw || '').trim();
    if (!s) return '《金額》';
    const digits = s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[,，円¥￥\s]/g, '');
    if (/^\d+$/.test(digits)) return Number(digits).toLocaleString('ja-JP') + '円';
    return s; // 「1時間分」など文字列はそのまま
  }

  function values() {
    const shop = ($('shop').value || '').trim() || '当店';
    const name = ($('name').value || '').trim() || 'お客様';
    const fact = ($('fact').value || '').trim() || '《事実を書いてください》';
    return { shop, name, fact, amount: fmtAmount($('amount').value), amountRaw: ($('amount').value || '').trim() };
  }

  function tfn(p, s, f) { return tone === 'soft' ? s : tone === 'firm' ? f : p; }

  function build() {
    const sc = currentScene();
    if (patternIdx >= sc.patterns.length) patternIdx = 0;
    const text = sc.patterns[patternIdx].body(values(), tfn).replace(/\n{3,}/g, '\n\n').trim();
    $('out-text').value = text;
    renderPatterns(sc);
    $('out').style.display = 'block';
    checkDraft();
    save();
  }

  function checkDraft() {
    const pending = /《[^》]*》/.test($('out-text').value);
    $('draft-warning').textContent = pending ? '《 》の未記入箇所があります。事実と対応状況を確認し、本文を編集してからコピーしてください。' : '送る前に、事実・日時・金額・対応状況を確認してください。';
    $('copy').disabled = pending;
    return !pending;
  }

  function renderPatterns(sc) {
    const box = $('patterns');
    box.innerHTML = '';
    sc.patterns.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip' + (i === patternIdx ? ' on' : ''); b.textContent = (i + 1) + '. ' + p.name;
      b.addEventListener('click', () => { patternIdx = i; build(); });
      box.appendChild(b);
    });
  }

  function renderScenes() {
    const sel = $('scene');
    let group = null, og = null;
    SCENES.forEach((s) => {
      if (s.group !== group) { group = s.group; og = document.createElement('optgroup'); og.label = group; sel.appendChild(og); }
      const o = document.createElement('option'); o.value = s.id; o.textContent = s.label; og.appendChild(o);
    });
  }

  function onSceneChange(resetPattern = true) {
    const sc = currentScene();
    $('fact').placeholder = sc.factHint || '';
    $('scene-hint').textContent = '「事実」の書き方: ' + (sc.factHint || '');
    const al = $('amount-label');
    if (sc.amountLabel) { al.style.display = ''; $('amount').style.display = ''; al.firstChild.textContent = sc.amountLabel.replace(/\(任意\)$/, ''); }
    else { al.style.display = 'none'; $('amount').style.display = 'none'; }
    if(resetPattern) patternIdx = 0;
    if ($('out').style.display === 'block') build();
  }

  async function copyText(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(okMsg); } catch (e2) { toast('コピーできませんでした。長押しで選択してください'); }
      document.body.removeChild(ta);
    }
  }

  function aiPrompt() {
    const sc = currentScene(); const v = values();
    return [
      'あなたはレンタルスペース運営者の返信文を整える編集者です。次の下書きを、条件に沿って磨いてください。',
      '',
      '【場面】' + sc.label,
      '【店名】' + v.shop,
      '【相手】' + v.name,
      '【事実】' + v.fact,
      '【金額】' + (v.amountRaw || 'なし'),
      '【トーン】' + TONE_LABEL[tone],
      '',
      '【下書き】',
      $('out-text').value,
      '',
      '【磨く条件】',
      '- お客様が主役。相手を責める表現は使わない',
      '- 事実だけを書く。金額・日時は下書きにあるもの以外を足さない',
      '- 法的な責任や過失を断定しない(「規約に基づき」まで)',
      '- 《 》の箇所はそのまま残す(あとで本人が埋める)',
      '- 長さは下書きの±2割。絵文字は使わない',
      '- 完成文だけを出力する(説明は不要)',
    ].join('\n');
  }

  function download() {
    const sc = currentScene();
    const blob = new Blob([$('out-text').value], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = '返信_' + sc.label.replace(/[\s/]/g, '_') + '.txt'; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function save() {
    ls.set(SAVE_KEY, { scene: $('scene').value, shop: $('shop').value, name: $('name').value, fact: $('fact').value, amount: $('amount').value, tone, patternIdx, templateVersion: 2 });
  }
  function restore() {
    const d = ls.get(SAVE_KEY, null); if (!d) return;
    if (d.scene && SCENES.some((s) => s.id === d.scene)) $('scene').value = d.scene;
    $('shop').value = d.shop || ''; $('name').value = d.name || ''; $('fact').value = d.fact || ''; $('amount').value = d.amount || '';
    tone = ['polite','soft','firm'].includes(d.tone) ? d.tone : 'polite'; patternIdx = Number.isInteger(d.patternIdx) && d.patternIdx >= 0 ? d.patternIdx : 0;
    if (d.scene === 'rev1' && d.templateVersion !== 2) patternIdx = 0;
    document.querySelectorAll('#tone button').forEach((b) => b.classList.toggle('on', b.dataset.tone === tone));
  }

  function init() {
    $('gate-btn').addEventListener('click', checkGate);
    $('gate-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkGate(); });
    if (gateOk()) showApp();

    renderScenes();
    restore();
    onSceneChange(false);
    $('scene').addEventListener('change', () => { onSceneChange(); save(); });
    document.querySelectorAll('#tone button').forEach((b) => b.addEventListener('click', () => {
      tone = b.dataset.tone;
      document.querySelectorAll('#tone button').forEach((x) => x.classList.toggle('on', x === b));
      save();
      if ($('out').style.display === 'block') build();
    }));
    ['shop', 'name', 'fact', 'amount'].forEach((id) => $(id).addEventListener('input', save));
    $('gen').addEventListener('click', () => { build(); $('out').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('out-text').addEventListener('input', checkDraft);
    $('copy').addEventListener('click', () => { if(checkDraft()) copyText($('out-text').value, '確認した文をコピーしました'); });
    $('ai').addEventListener('click', () => copyText(aiPrompt(), 'AI用プロンプトをコピーしました。Claude/ChatGPTに貼ってください'));
    $('dl').addEventListener('click', download);
    $('clear').addEventListener('click', () => { ['name', 'fact', 'amount'].forEach((id) => { $(id).value = ''; }); $('out').style.display = 'none'; save(); toast('入力をクリアしました(店名は残しています)'); });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
