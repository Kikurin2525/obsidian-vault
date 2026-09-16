// 使い方タブ + 問い合わせに使う情報(プロフィール)の事前登録。プロフィールはこのブラウザ(localStorage)にだけ保存する
(function () {
  const $ = (id) => document.getElementById(id);
  const PROFILE_KEY = 'bukken-profile';
  const ls = { get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (_) { return fb; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } } };
  const DEFAULT_MSG = '大変お世話になります。\n{会社名}の{氏名}と申します。\n\nこちらの物件ですが、ダンスやヨガの練習ができるレンタルスタジオとして賃貸は可能でしょうか？\nもし可能でしたら内見をさせていただけましたら幸いです。\n内見時に音の響き方も確認し、近隣にご迷惑をかけない運営をいたします。\n\n何卒よろしくお願いいたします。';
  function profile() { return ls.get(PROFILE_KEY, { company: '', name: '', kana: '', email: '', tel: '', msg: DEFAULT_MSG }); }
  function renderProfile() {
    const p = profile();
    const f = $('guide-profile');
    f.querySelector('[name=company]').value = p.company || '';
    f.querySelector('[name=name]').value = p.name || '';
    f.querySelector('[name=kana]').value = p.kana || '';
    f.querySelector('[name=email]').value = p.email || '';
    f.querySelector('[name=tel]').value = p.tel || '';
    f.querySelector('[name=msg]').value = p.msg || DEFAULT_MSG;
  }
  function saveProfile() {
    const f = $('guide-profile');
    const v = (n) => f.querySelector('[name=' + n + ']').value.trim();
    const p = { company: v('company'), name: v('name'), kana: v('kana'), email: v('email'), tel: v('tel'), msg: f.querySelector('[name=msg]').value };
    if (!ls.set(PROFILE_KEY, p)) { $('guide-saved').textContent = '保存できませんでした'; return; }
    $('guide-saved').style.color = ''; $('guide-saved').textContent = profileOk(p) ? '保存しました' : '保存しました(氏名・メール・電話の3つが揃うと問い合わせに使えます)';
    renderCheck(); renderPreview();
    setTimeout(() => { $('guide-saved').textContent = ''; }, 2500);
  }
  // 会社名が空なら「{会社名}の{氏名}」→「{氏名}」に自動調整
  function fillMsg(p) {
    let m = p.msg || DEFAULT_MSG;
    if (!(p.company || '').trim()) m = m.replace(/\{会社名\}の\{氏名\}/g, '{氏名}').replace(/\{会社名\}/g, '');
    return m.replace(/\{会社名\}/g, p.company || '').replace(/\{氏名\}/g, p.name || '(氏名)');
  }
  function formProfile() {
    const f = $('guide-profile'); const v = (n) => f.querySelector('[name=' + n + ']').value.trim();
    return { company: v('company'), name: v('name'), kana: v('kana'), email: v('email'), tel: v('tel'), msg: f.querySelector('[name=msg]').value };
  }
  function renderPreview() { const el = $('guide-preview'); if (el) el.textContent = fillMsg(formProfile()); }
  function profileOk(p) { return !!(p.name && p.email && p.tel); }
  function renderCheck() {
    const box = $('guide-check'); if (!box) return;
    const ext = document.documentElement.dataset.bkExt === '1';
    const p = profile(); const prof = profileOk(p);
    const row = (done, title, sub, btn) => '<div class="chk-row' + (done ? ' done' : '') + '"><span class="mark">' + (done ? '✓' : '') + '</span><span class="t">' + title + '<small>' + sub + '</small></span>' + (done ? '' : btn) + '</div>';
    box.innerHTML = '<div class="chk-list">'
      + row(ext, '1. Chrome拡張を入れる', ext ? '入っています。athomeが開いたら自動で集まります' : 'まだです。これを入れないと、athomeで集める・問い合わせの自動入力が動きません', '<button type="button" class="small" data-act="open-ext">入れ方を見る</button>')
      + row(prof, '2. 問い合わせに使う情報を登録する', prof ? p.name + ' さん / ' + p.email + ' / ' + p.tel : '氏名・メール・電話の3つ(必須)。athomeの問い合わせフォームに自動で入ります', '<button type="button" class="small" data-act="open-profile">登録する</button>')
      + '</div>'
      + (ext && prof
        ? '<div class="done-banner"><b>設定は完了です。</b><span>次は「条件づくり」で希望を入れて、おすすめ駅を出します</span><button type="button" class="go" onclick="showMode(\'plan\')">条件づくりへ進む →</button></div>'
        : '<div class="todo-banner">2つが済むと、ここに「条件づくりへ進む」ボタンが出ます。先に試したいときは上の「条件づくり」タブからどうぞ(集めるには拡張が要ります)</div>');
  }
  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'profile-save') saveProfile();
    else if (b.dataset.act === 'open-ext') { const d = $('guide-ext-howto'); d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (b.dataset.act === 'open-profile') { $('guide-profile').closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => $('guide-profile').querySelector('[name=name]').focus(), 400); }
    else if (b.dataset.act === 'profile-reset') { $('guide-profile').querySelector('[name=msg]').value = DEFAULT_MSG; renderPreview(); }

  }
  let shown = false;
  function show() {
    if (shown) return;
    shown = true;
    renderProfile(); renderCheck(); renderPreview();
    const ext = document.documentElement.dataset.bkExt === '1';
    const el = $('guide-ext');
    if (el) el.innerHTML = ext ? '<span class="flag f-good">入っています</span>' : '<span class="flag f-bad">入っていません(必須)</span>';
  }
  function init() { const sec = $('guide-sec'); if (!sec) return; sec.addEventListener('click', onClick); sec.addEventListener('input', (e) => { if (e.target.closest('#guide-profile')) renderPreview(); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  function focusProfile(text) {
    show();
    const f = $('guide-profile');
    $('guide-saved').textContent = text || '';
    $('guide-saved').style.color = 'var(--bad)';
    f.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => f.querySelector('[name=name]').focus(), 400);
  }
  window.Guide = { show, profile, fillMsg, DEFAULT_MSG, focusProfile };
})();
