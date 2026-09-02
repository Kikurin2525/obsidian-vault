// 損益分岐シミュレーション(Node/ブラウザ共用)
// 単価=公式HPの時間単価。ポータル経由は価格1.1倍・手数料35%、公式HP経由は手数料3.5%。
// 稼働率 = 予約時間 ÷ 営業時間(1日の営業時間×日数)。
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
    const sim = [20, 25, 30, 35, 40, 50, 60].map((occ) => ({
      occ,
      hours: Math.round((occ / 100) * monthlyHours),
      gross: Math.round((occ / 100) * fullGross),
      net: Math.round((occ / 100) * fullNet),
      profit: Math.round((occ / 100) * fullNet - fixed),
    }));
    return {
      rent, params: p, monthlyHours,
      netWeekday: Math.round(netPerHour(p.weekdayRate, share)),
      netWeekend: Math.round(netPerHour(p.weekendRate, share)),
      breakevenOcc: Math.round(breakevenOcc * 10) / 10,
      breakevenHours: Math.round((breakevenOcc / 100) * monthlyHours),
      sim,
      constants: { PORTAL_PRICE_MULT, PORTAL_FEE, OFFICIAL_FEE, WEEKDAYS_PER_MONTH, WEEKEND_DAYS_PER_MONTH },
    };
  }

  return { calc, suggestRates, DEFAULTS };
});
