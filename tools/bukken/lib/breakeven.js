// 損益分岐シミュレーション(Node/ブラウザ共用)
// 単価=公式HPの時間単価。ポータル経由は価格1.1倍・手数料35%、公式HP経由は手数料3.5%。
// 稼働率 = 予約時間 ÷ 営業時間(1日の営業時間×日数)。
// 判定は「黒字に必要な時間(1日あたり)」で行う(2026-09-17 本人指示)。%は営業時間で割る数が変わるだけで、必要な時間そのものは営業時間に左右されないため。
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Breakeven = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PORTAL_PRICE_MULT = 1.1;
  const PORTAL_FEE = 0.35;
  const OFFICIAL_FEE = 0.035;
  const WEEKDAYS_PER_MONTH = 22;
  const WEEKEND_DAYS_PER_MONTH = 8;

  const DEFAULTS = {
    weekdayRate: 1000,   // 平日 公式単価(円/h)
    weekendRate: 1000,   // 休日 公式単価(円/h)
    portalShare: 0.7,    // 予約時間のうちポータル経由の割合(0〜1)
    openHours: 18,       // 1日の営業時間(h)。例: 6:00〜24:00
    otherCosts: 20000,   // 家賃以外の月次固定費(円)
  };

  // 単価の初期値は広さに比例させる(本人ルール 2026-09-02): 広い部屋は大人数で割れるので高くても「安い」と言われる=リピートする価格
  // 個人〜少人数サイズ(50㎡未満)=平日1,000/休日1,500、50㎡以上=平日1,500/休日2,000。エリア差は手動で上書き
  function suggestRates(areaSqm) {
    if (areaSqm != null && areaSqm >= 70) return { weekdayRate: 2000, weekendRate: 2500, basis: '70㎡以上(大教室・イベント向け)' };
    if (areaSqm != null && areaSqm >= 50) return { weekdayRate: 1500, weekendRate: 2000, basis: '50〜70㎡(教室・大人数向け)' };
    return { weekdayRate: 1000, weekendRate: 1500, basis: areaSqm != null ? '50㎡未満(個人〜少人数向け)' : '広さ不明のため少人数向け単価' };
  }

  // 1予約時間あたりの手取り(手数料控除後)
  function netPerHour(rate, portalShare) {
    const portalNet = rate * PORTAL_PRICE_MULT * (1 - PORTAL_FEE);
    const officialNet = rate * (1 - OFFICIAL_FEE);
    return portalShare * portalNet + (1 - portalShare) * officialNet;
  }
  // 1予約時間あたりのお客様支払額(売上)
  function grossPerHour(rate, portalShare) {
    return portalShare * rate * PORTAL_PRICE_MULT + (1 - portalShare) * rate;
  }

  // 黒字に必要な時間(1日あたり)の目安: 5.5時間まで=◎ / 6.5時間まで=○ / 7.2時間まで=△ / それ以上=✕
  // 根拠: 運営中のダンススタジオ5店の実測(2026年4〜8月)で、型どおりの単価の店のいちばん低い月が1日6.5時間、ふつうの店が1日8時間前後、いちばん強い店が1日11時間超。
  // 旧基準(18時間営業での30/35/40%)を時間に直した値でもある
  const HOURS_LIMITS = { best: 5.5, good: 6.5, fair: 7.2 };
  // 実測の目安(回収や月損益の試算に使う3通り)
  const ACTUAL_HOURS = [
    { h: 6.5, label: 'きくりんの店の実測: いちばん低い月' },
    { h: 8, label: 'きくりんの店の実測: ふつうの店' },
    { h: 11, label: 'きくりんの店の実測: いちばん強い店' },
  ];
  function gradeHours(h) {
    if (!Number.isFinite(h)) return '?';
    return h <= HOURS_LIMITS.best ? '◎' : h <= HOURS_LIMITS.good ? '○' : h <= HOURS_LIMITS.fair ? '△' : '✕';
  }
  function commentHours(h) {
    return h <= HOURS_LIMITS.best ? 'きくりんの店でいちばん低かった月(1日6.5時間)と同じ結果でも黒字になる水準。家賃リスク小'
      : h <= HOURS_LIMITS.good ? '定期利用が入れば十分届く水準。立ち上がり数ヶ月の赤字は覚悟しておく'
      : h <= HOURS_LIMITS.fair ? 'きくりんのふつうの店の実測(1日8時間前後)が黒字の前提。立ち上がりに時間がかかると赤字が続くリスク'
      : 'ずっと好調でないと黒字にならない。家賃が重すぎるか、単価が低すぎる';
  }
  const GRADE_GUIDE = '目安: 1日5.5時間まで=◎ / 6.5時間まで=○ / 7.2時間まで=△ / それ以上=✕';

  function calc(rent, params) {
    const p = Object.assign({}, DEFAULTS, params || {});
    const share = Math.min(1, Math.max(0, Number(p.portalShare)));
    const hoursWd = Number(p.openHours) * WEEKDAYS_PER_MONTH;
    const hoursWe = Number(p.openHours) * WEEKEND_DAYS_PER_MONTH;
    const monthlyHours = hoursWd + hoursWe;
    // 100%稼働時の月間手取り・売上
    const fullNet = hoursWd * netPerHour(p.weekdayRate, share) + hoursWe * netPerHour(p.weekendRate, share);
    const fullGross = hoursWd * grossPerHour(p.weekdayRate, share) + hoursWe * grossPerHour(p.weekendRate, share);
    const fixed = rent + Number(p.otherCosts);
    const breakevenOcc = fullNet > 0 ? (fixed / fullNet) * 100 : Infinity;
    // 1日あたりの予約時間ごとの月損益(30日換算)。実測の3通り(6.5/8/11時間)にはラベルを付ける
    const daysPerMonth = WEEKDAYS_PER_MONTH + WEEKEND_DAYS_PER_MONTH;
    const perDayList = [4, 5, 6.5, 8, 9.5, 11].filter((h) => h <= Number(p.openHours));
    const sim = perDayList.map((perDay) => {
      const occ = monthlyHours > 0 ? (perDay * daysPerMonth / monthlyHours) * 100 : 0;
      const actual = ACTUAL_HOURS.find((a) => a.h === perDay);
      return {
        perDay, perWeek: Math.round(perDay * 7), label: actual ? actual.label : '',
        occ: Math.round(occ * 10) / 10,
        hours: Math.round(perDay * daysPerMonth),
        gross: Math.round((occ / 100) * fullGross),
        net: Math.round((occ / 100) * fullNet),
        profit: Math.round((occ / 100) * fullNet - fixed),
      };
    });
    const hoursPerDayRaw = Number.isFinite(breakevenOcc) ? (breakevenOcc / 100) * monthlyHours / daysPerMonth : Infinity;
    const hoursPerDay = Math.round(hoursPerDayRaw * 10) / 10;
    return {
      rent, params: p, monthlyHours,
      netWeekday: Math.round(netPerHour(p.weekdayRate, share)),
      netWeekend: Math.round(netPerHour(p.weekendRate, share)),
      breakevenOcc: Math.round(breakevenOcc * 10) / 10,
      breakevenHours: Math.round((breakevenOcc / 100) * monthlyHours),
      breakevenHoursPerDay: hoursPerDay,
      breakevenHoursPerWeek: Number.isFinite(hoursPerDayRaw) ? Math.round(hoursPerDayRaw * 7) : Infinity,
      hoursGrade: gradeHours(hoursPerDay),
      hoursComment: commentHours(hoursPerDay),
      sim,
      constants: { PORTAL_PRICE_MULT, PORTAL_FEE, OFFICIAL_FEE, WEEKDAYS_PER_MONTH, WEEKEND_DAYS_PER_MONTH },
    };
  }

  return { calc, suggestRates, DEFAULTS, gradeHours, commentHours, HOURS_LIMITS, ACTUAL_HOURS, GRADE_GUIDE };
});
