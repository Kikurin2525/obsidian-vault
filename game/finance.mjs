// Four operating weeks form one game month. Preparation uses a separate clock.
export const WEEKS_PER_MONTH=4, RECOVERY_MONTHS=24, RECOVERY_WEEKS=96;
export const initialInvestment=s=>s.initialInvestment??s.cashInvested;
export function gameResult(s){
 if(s.recoveredAt&&s.recoveredAt<=RECOVERY_WEEKS)return 'clear';
 return s.completedWeeks>=RECOVERY_WEEKS?'gameover':null;
}
export function migrateFinance(s){
 if(s.financeVersion===40)return s;
 const n=structuredClone(s);n.financeVersion=40;
 const opened=!['welcome','genre','area','property','research','setup'].includes(n.phase);
 if(n.initialInvestment==null&&opened){n.initialInvestment=n.cashInvested;n.initialInvestmentEstimated=true;}
 if(gameResult(n)==='gameover'&&n.phase!=='recap'){n.phase='gameover';n.pending=null;}
 if(gameResult(n)==='clear'&&!['recap','goal','epilogue'].includes(n.phase)){n.phase='goal';n.pending=null;}
 n.revision=(n.revision||0)+1;return n;
}
const FIELDS=['gross','fee','rent','rentApplied','rentCash','utility','marketing','directGross','portalGross','staffCost','care','emergency','profit','hours','bookings'];
export function sumReports(reports){return Object.fromEntries(FIELDS.map(k=>[k,reports.reduce((v,r)=>v+(r[k]||0),0)]));}
export function monthlyReports(s){
 const groups=new Map();
 for(const r of s.reports){const month=Math.ceil(r.week/4);if(!groups.has(month))groups.set(month,[]);groups.get(month).push(r);}
 return [...groups].sort(([a],[b])=>a-b).map(([month,rows])=>({month,...sumReports(rows),weeks:rows.length,complete:rows.length===4,partialHistory:rows.length!==Math.min(4,s.completedWeeks-(month-1)*4)}));
}
export function recoveryEstimate(s){
 const remaining=Math.max(0,s.cashInvested-s.operatingCash),recent=s.reports.slice(-4),monthlyProfit=recent.length?sumReports(recent).profit/recent.length*4:null;
 const remainingMonths=remaining===0?0:monthlyProfit>0?remaining/monthlyProfit:null;
 const totalMonths=remainingMonths==null?null:s.completedWeeks/4+remainingMonths;
 return {remaining,monthlyProfit,remainingMonths,totalMonths,sampleWeeks:recent.length,withinDeadline:totalMonths!=null&&totalMonths<=24,monthsLeft:Math.max(0,24-s.completedWeeks/4)};
}
