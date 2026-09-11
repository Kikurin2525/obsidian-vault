// Keep the monthly ledger and weekly guest story on the same period, including past months.
export function recapSelection(s,selectedMonth=null,selectedWeek=null){
 const all=[...new Map([...(s.reports||[]),...(s.recap?.first?[s.recap.first]:[])].map(r=>[r.week,r])).values()].sort((a,b)=>a.week-b.week);
 const months=[...new Set(all.map(r=>Math.ceil(r.week/4)))];
 const month=months.includes(selectedMonth)?selectedMonth:months.at(-1);
 const period=all.filter(r=>Math.ceil(r.week/4)===month);
 const report=period.find(r=>r.week===selectedWeek)||period.at(-1);
 return {month,period,report};
}
