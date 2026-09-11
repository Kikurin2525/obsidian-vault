import {genreObservation,competitorObservation} from './inspection-observations.mjs?v=051';
import {inspectionContext} from './genre-inspection.mjs?v=051';
export {inspectionContext};
import {gameResult,RECOVERY_WEEKS} from './finance.mjs?v=051';
export * from './finance.mjs?v=051';
import {PROPERTY_MODEL,leaseTerms,danceBuilding,danceBlockers,danceFinding,floorLabel} from './property-rules.mjs?v=051';
export {PROPERTY_MODEL,floorLabel};
import {PORTALS,INSPECTIONS,SETUP_TASKS} from './curriculum.mjs?v=051';
export {PORTALS,INSPECTIONS,SETUP_TASKS};
import {quoteRent,rentMarket,RENT_MODEL} from './rent-market.mjs?v=051';
export {rentMarket,RENT_MODEL};
import {GENRES,ITEMS,STAFF} from './data.mjs?v=051';
export {GENRES,ITEMS,STAFF};
export {INTERIOR_CHECKS} from './equipment-catalog.mjs?v=051';
export const VERSION=3, DAY=86400000, INITIAL_CAPITAL=2000000;
export const money=n=>Math.round(n).toLocaleString('ja-JP')+'円';
export const tsubo=area=>area*0.3025;
export const tsuboRent=p=>p.rentMonthly/tsubo(p.area);
const copy=s=>structuredClone(s), clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const genreOf=s=>GENRES.find(g=>g.id===(typeof s==='string'?s:s.genreId));
export const propertyOf=s=>s.property;
export const staffOf=s=>STAFF.find(p=>p.id===s.staffId);
export const catalog=s=>ITEMS.filter(i=>(!i.legacy||s.owned.includes(i.id))&&(i.genre.includes('all')||i.genre.includes(s.genreId)));
export const currentDay=(s,now=Date.now())=>Math.floor((now+9*3600000)/DAY)+s.debugDays;
export const weeklyRent=p=>(p.rentMonthly+p.managementMonthly)/4;
export const careCost=s=>genreOf(s).visits*200;
export const cleaningFee=(s,staff=staffOf(s))=>staff?staff.visitFee*genreOf(s).visits:0;
export function initialState(seed=Math.floor(Math.random()*4294967295)){
 return {version:VERSION,financeVersion:40,initialInvestment:null,initialInvestmentEstimated:false,revision:0,runNumber:1,pastRuns:[],exploration:null,phase:'welcome',location:null,areaPref:'東京都',research:null,preparation:{},prepDay:0,setupLog:[],furnished:false,equipmentChecked:false,assemblyPaid:false,synced:false,portals:[],publishedDay:null,cashInvested:0,operatingCash:0,recoveredAt:null,epilogueSeen:false,seed:seed>>>0,rolls:0,genreId:null,listings:[],inspected:[],property:null,name:'',equipmentVersion:36,initialCapital:INITIAL_CAPITAL,cash:INITIAL_CAPITAL,deposit:0,rentCredit:0,owned:[],completedWeeks:0,clean:86,supplies:80,reputation:60,rate:1800,staffId:null,manual:false,careDone:false,careSpent:0,capex:0,totalProfit:0,pending:null,reports:[],recap:null,debugDays:0,lastCareDay:null,paused:false};
}
// Older v3 saves began with 1,000,000 yen. Adjust funding once, without changing spending or earnings.
export function migrateInitialCapital(s){
 const previous=s.initialCapital??1000000;
 if(previous===INITIAL_CAPITAL)return s;
 const n=copy(s);
 n.cash+=INITIAL_CAPITAL-previous;
 n.initialCapital=INITIAL_CAPITAL;
 n.revision=(s.revision||0)+1;
 return n;
}
function random(seed){let x=(seed||12345)>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
export function makeListings(genreId,seed,location=null){
 const g=genreOf(genreId),r=random(seed);if(!g)throw Error('用途を選びましょう。');
 const districts=['桜町','南町','緑ヶ丘','本町','青葉台','東町'];
 return [0,1,2].map(i=>{
  const area=g.area+(i===1?5:i===2?9:-2)+Math.floor(r()*5),variation=r();
  const walk=i===1?2+Math.floor(r()*2):6+Math.floor(r()*6);
  const building=g.id==='dance'?danceBuilding(i,seed,rentMarket(location)):null;
  const quote=quoteRent(location,area,walk,i,variation,building),rentMonthly=quote.rentMonthly;
  const managementMonthly=Math.max(i===1?4000:2000,Math.round(rentMonthly*.045/500)*500),terms=leaseTerms(rentMonthly,i,seed),deposit=terms.deposit;
  const breakdown=[[`敷金・保証金（${terms.depositMonths}ヶ月）`,deposit],[`礼金（${terms.keyMoneyMonths}ヶ月・返還なし）`,terms.keyMoney],['仲介料',Math.round(rentMonthly*1.1)],['保証会社初回',rentMonthly],['火災保険',20000],['前家賃・共益費（1ヶ月）',rentMonthly+managementMonthly]];
  return {id:`${seed}-${i}`,propertyModel:PROPERTY_MODEL,existingMirror:g.id==='dance'&&i===0&&seed%7===0,interiorReady:['party','photo'].includes(g.id)&&i===0&&seed%5===0,...terms,danceBuilding:building,name:(location?.name||districts[Math.floor(r()*districts.length)])+'駅周辺'+(building?'・'+floorLabel(building)+'の一室':['の小さな一室','・駅近の一室','・格安5階'][i]),location:copy(location),usableArea:Math.round(area*.79),repairNeeded:i===1,fit:i===2?.55:1,area,walk,...quote,rentMonthly,managementMonthly,deposit,contract:breakdown.reduce((a,x)=>a+x[1],0),breakdown,permitted:building?true:i!==2,demand:(i===1?1.12:i===2?.65:1)*(location?Math.max(.35,Math.min(1.3,.35+Math.log10(Math.max(1000,location.riders||12000)/1000)*.38)):1),light:Math.round(55+r()*40),tag:building?(building.floor<=1?'地下・1階から検討':'空中階・階下を要確認'):['家賃を抑えて育てる','駅近・固定費は重め','用途の条件に注意'][i],checks:!building&&i===2?[`${g.name}の利用許可なし`,'階段のみ・近隣への影響も確認が必要','この用途では見送り']:g.id==='dance'?['ダンス・無人時間貸し用途は相談可能','音・振動・階下は内見で確認',(i===0&&seed%7===0?'既存鏡あり。固定・歪み・幅は内見で確認。':'鏡は別途購入。')+'想定利用時間9:00〜21:00']:[`${g.name}の用途許可あり`,'室内・共用部と近隣条件を確認済み','ライフラインとWi-Fiは契約後に別途手配']};
 });
}
export function chooseGenre(s,id){if(!['welcome','genre','area','property','research'].includes(s.phase)||s.property)throw Error('用途の変更は開業前に行います。');const g=genreOf(id);if(!g)throw Error('用途が見つかりません。');if(s.exploration&&['both','genre'].includes(s.exploration.mode)&&s.exploration.genreId===id)throw Error('今回は別のジャンルを選んで、違いを体験しましょう。');const n=copy(s);Object.assign(n,{genreId:id,phase:'area',location:null,listings:[],research:null,inspected:[],rate:g.rates[1],name:g.concept});return n;}
export function reroll(s){if(s.phase!=='property'||s.property)throw Error('契約前に引き直せます。');const n=copy(s);n.seed=(n.seed+0x9e3779b9)>>>0;n.rolls++;n.listings=makeListings(n.genreId,n.seed,n.location);n.inspected=[];return n;}
export function inspect(s,id){if(s.phase!=='property'||!s.listings.some(p=>p.id===id))throw Error('募集中の物件を選びましょう。');const n=copy(s);if(!n.inspected.includes(id))n.inspected.push(id);return n;}
export const itemPrice=(s,it)=>it.id==='mirror'&&s.property?.existingMirror?0:it.price;
export const requiredItems=s=>catalog(s).filter(i=>genreOf(s).needs.includes(i.id));
export const minimumInterior=(s,p=s.property)=>['party','photo'].includes(s.genreId)?p?.interiorReady?0:s.genreId==='party'?90000:120000:p?.repairNeeded?25000:0;
export const essentialCost=s=>genreOf(s).needs.filter(id=>!s.owned.includes(id)).reduce((sum,id)=>sum+itemPrice(s,ITEMS.find(i=>i.id===id)),0);
export const launchReserve=(s,p)=>essentialCost({...s,property:p})+30000+(p?.danceBuilding?.mobileWeak?22000:12000)+minimumInterior(s,p)+20000;
export function contract(s,id,name,now=Date.now()){
 if(s.phase!=='research'||s.property)throw Error('調査画面から契約します。');const p=s.listings.find(p=>p.id===id);
 if(!p?.permitted)throw Error('選んだ用途では利用できません。');if(!s.research||s.research.propertyId!==id||!inspectionsComplete(s)||s.research.observed.length<5||s.research.rounds<2||!s.research.visited||!s.research.forecastAccepted)throw Error('内見・5店舗の調査・競合視察・利益試算を終えてから契約します。');
 if(s.genreId==='dance'&&danceBlockers(p).length)throw Error('このダンス用途では見送り：'+danceBlockers(p).join('。'));
 if(s.cash-p.contract<launchReserve(s,p))throw Error('必須設備と最初の運営費を残せません。別の物件を探しましょう。');
 const n=copy(s);Object.assign(n,{property:copy(p),phase:'setup',cash:n.cash-p.contract,cashInvested:n.cashInvested+p.contract,deposit:p.deposit,rentCredit:p.rentMonthly+p.managementMonthly,name:(name||n.name).trim().slice(0,24),lastCareDay:currentDay(s,now)});return n;
}
export function assertEditable(s){if(gameResult(s))throw Error('この経営の結果は確定済みです。');if(!['setup','manage'].includes(s.phase))throw Error('この週の運営は確定済みです。次回に変更できます。');}
export const weeklyUtility=s=>['power','water','gas','internet'].reduce((v,id)=>v+(choiceOf(s,id)?.weekly||0),0);
export const weeklyPromotion=s=>(choiceOf(s,'website')?.weekly||0)+(choiceOf(s,'ads')?.weekly||0);
export const cashFixed=s=>Math.max(0,weeklyRent(s.property)-s.rentCredit)+weeklyUtility(s)+weeklyPromotion(s);
export const purchaseReserve=(s,id)=>cashFixed(s)+(s.phase==='setup'?remainingSetupReserve(s):0)+cleaningFee(s)+(!s.careDone?careCost(s):0)+genreOf(s).needs.filter(k=>k!==id&&!s.owned.includes(k)).reduce((a,k)=>a+itemPrice(s,ITEMS.find(i=>i.id===k)),0);
export function buy(s,id){return buyItems(s,[id]);}
export function buyItems(s,ids){
 assertEditable(s);const unique=[...new Set(ids)],items=unique.map(id=>catalog(s).find(i=>i.id===id));
 if(!unique.length||items.some(i=>!i))throw Error('この用途の未購入品を選びましょう。');
 if(unique.some(id=>s.owned.includes(id)))throw Error('購入済みの備品が含まれています。');
 const cost=items.reduce((v,i)=>v+itemPrice(s,i),0),n=copy(s);n.owned.push(...unique);
 const reserve=cashFixed(n)+(n.phase==='setup'?remainingSetupReserve(n):0)+cleaningFee(n)+(!n.careDone?careCost(n):0)+essentialCost(n);
 if(s.cash-cost<reserve)throw Error('必須設備と次週の運転資金を残しましょう。');
 n.cash-=cost;n.capex+=cost;n.cashInvested+=cost;
 if(n.phase==='setup'){n.furnished=false;n.equipmentChecked=false;}return n;
}
export function buyMirror(s,method){
 if(s.genreId!=='dance'||!['panel','contractor','existing'].includes(method))throw Error('鏡の用意方法を選びましょう。');
 if(method==='existing'&&!s.property?.existingMirror)throw Error('この物件には確認済みの既存鏡がありません。');
 const base=itemPrice(s,ITEMS.find(i=>i.id==='mirror')),cost=method==='existing'?0:method==='contractor'?533000:214500;
 if(method!=='existing'&&s.property?.existingMirror)throw Error('確認済みの既存鏡を利用できます。');
 let n=buyItems(s,['mirror']);const extra=cost-base;
 if(n.cash-extra<purchaseReserve(n,'mirror'))throw Error('業者施工後の準備・運転資金を残しましょう。');
 n.cash-=extra;n.capex+=extra;n.cashInvested+=extra;n.mirrorMethod=method;return n;
}
export function migrateEquipment(s){
 if(s.equipmentVersion===36)return s;
 const n=copy(s);n.equipmentVersion=36;
 // The old assembly charge explicitly included keys and basic cleaning supplies.
 if(s.assemblyPaid)for(const id of ['c_keybox','c_vac','c_toilet','c_cons'])if(!n.owned.includes(id))n.owned.push(id);
 return n;
}
export function setupTasksFor(s){return SETUP_TASKS.map(t=>t.id!=='interior'||!['party','photo'].includes(s.genreId)?t:{...t,tip:s.genreId==='party'?'壁のアクセント・木目の床・暖色照明を用意。電球の色だけを変える対応はしません。電気工事は施工店へ。':'壁は2面以上の撮影背景、大理石調の床、シャンデリア用の照明取付口を用意。電気工事は施工店へ。',choices:t.choices.map(c=>c.id==='reuse'?{...c,detail:'このコンセプトの壁・床・照明が既に整い、現地確認済みの候補だけ。'}:c.id==='diy'?{...c,label:'壁・床はDIY、照明工事は施工店へ',cost:s.genreId==='party'?90000:120000,days:7,detail:'のり付き壁紙・水性塗装とクッションフロア。照明配線は業者へ依頼。金額・期間はゲーム用概算。'}:c.id==='local'?{...c,cost:150000,detail:'用途に合わせた壁・床・照明工事を依頼。家具と照明器具の購入費は別。ゲーム用概算。'}:{...c,cost:230000,detail:'背景や照明計画まで依頼。家具・照明器具は別途購入。ゲーム用概算。'})});}

export function prepare(s,now=Date.now()){assertEditable(s);if(s.careDone)throw Error('手配済みです。');const cost=careCost(s);if(s.cash<cost)throw Error('補充費が足りません。');const n=copy(s);Object.assign(n,{clean:96,supplies:100,careDone:true,lastCareDay:currentDay(s,now),cash:s.cash-cost,careSpent:s.careSpent+cost});return n;}
export function setRate(s,rate){assertEditable(s);if(!genreOf(s).rates.includes(rate))throw Error('表示中の料金から選んでください。');const n=copy(s);n.rate=rate;return n;}
export function hire(s,id){assertEditable(s);if(s.completedWeeks<4)throw Error('清掃外注は4Wの営業を終えると解放されます。');const st=STAFF.find(x=>x.id===id);if(!st)throw Error('清掃の依頼先がありません。');if(s.cash<cashFixed(s)+cleaningFee(s,st)+careCost(s))throw Error('清掃委託費と運転資金が足りません。');const n=copy(s);n.staffId=id;return n;}
export function release(s){assertEditable(s);const n=copy(s);n.staffId=null;return n;}
export function makeManual(s){assertEditable(s);if(s.completedWeeks<4||s.manual)throw Error('まだ作成できないか、作成済みです。');if(s.cash-1000<purchaseReserve(s,null))throw Error('運転資金を残しましょう。');const n=copy(s);n.cash-=1000;n.capex+=1000;n.cashInvested+=1000;n.manual=true;return n;}
export function openStore(s){assertEditable(s);if(openingMissing(s).length)throw Error(openingMissing(s).join('・')+'を完了しましょう。');const n=copy(s);n.phase='manage';if(n.initialInvestment==null)n.initialInvestment=n.cashInvested;return n;}
export function guestFor(s,week){const g=genreOf(s);const names={party:['菜月さんたち','沙織さんたち','悠斗さんたち'],photo:['美咲さんたち','彩乃さんたち','葵さんたち'],dance:['梨花さんのチーム','悠斗さんのチーム','結衣さんのレッスン'],meeting:['佐藤さんのチーム','田中さんたち','真由さんの勉強会']};return {name:names[g.id][(week-1)%3],purpose:g.audience,line:g.first,genreId:g.id};}
function eventFor(s,week){
 if(week%4===2&&!s.owned.includes('guide'))return {id:'E01',title:'また電話かよ',question:'すみません、鍵の場所が分からなくて…',inner:'そのための1行目ぇ！',choices:[{id:'help',label:'写真を送り、入室まで確認する',bonus:4,cost:0},{id:'later',label:'案内をもう一度読んでもらう',bonus:-5,cost:0}]};
 if(week%4===3)return {id:'battery',title:'リモコン、沈黙',question:'エアコンのリモコンが反応しません。',inner:'押す指にも、だんだん力が入る。',choices:[{id:'spare',label:'予備電池の場所を案内する',requires:'battery',bonus:6,cost:0},{id:'rush',label:'交換を手配する（2,500円）',bonus:2,cost:2500}]};
 if(week%6===0)return {id:'smoke',title:'香りで上書きするな',question:'前の利用のあと、タバコの匂いが残っています。',inner:'禁煙の文字だけ、見えないのかな。',choices:[{id:'clean',label:'特別清掃と連絡（5,000円）',bonus:2,cost:5000},{id:'air',label:'換気して状況を説明する',bonus:-9,cost:0}]};
 return null;
}
export function endTurn(s,now=Date.now()){assertEditable(s);if(s.phase!=='manage')throw Error('先に開業しましょう。');if(s.cash<cashFixed(s))throw Error('次週の固定費が不足しています。');const n=copy(s),week=s.completedWeeks+1;n.pending={week,closedDay:currentDay(s,now),snapshot:copy({...s,pending:null,reports:[],recap:null,listings:[]}),guest:guestFor(s,week),event:eventFor(s,week),answer:null};n.phase='waiting';return n;}
export function answerCall(s,id){if(s.phase!=='waiting'||!s.pending?.event||s.pending.answer)throw Error('対応待ちの案件はありません。');const a=s.pending.event.choices.find(a=>a.id===id);if(!a)throw Error('対応を選んでください。');if(a.requires&&!s.pending.snapshot.owned.includes(a.requires))throw Error('必要な備品が未設置です。');if(s.cash<cashFixed(s)+a.cost+cleaningFee(s)+(!s.careDone?careCost(s):0))throw Error('対応費が足りません。');const n=copy(s);n.pending.answer=copy(a);return n;}
function settle(s,p,unattended=false){
 const n=copy(s),snap=p.snapshot,g=genreOf(snap),prop=snap.property,st=staffOf(snap),rent=weeklyRent(prop),rentApplied=Math.min(n.rentCredit,rent),rentCash=rent-rentApplied,emergency=p.answer?.cost||0;
 let clean=snap.clean,supplies=snap.supplies,staffCost=0,consumables=snap.careSpent,extraCareCash=0,staffReport=unattended?'巡回清掃と補充の担当が不在です。':snap.careDone?'自分で巡回清掃・補充を手配しました。':'今週の巡回清掃は未手配です。';
 if(st&&n.cash>=rentCash+weeklyUtility(snap)+weeklyPromotion(snap)+cleaningFee(snap)+emergency+(!snap.careDone?careCost(snap):0)){
  staffCost=cleaningFee(snap);extraCareCash=snap.careDone?0:careCost(snap);consumables+=extraCareCash;
  const missed=st.diligence<=3&&!snap.manual&&p.week%5===0;clean=missed?Math.max(clean,66):82+3*st.skill;supplies=95;
  staffReport=missed?`${st.name}さんが巡回。家具の復元に抜けがありました。写真の手順を共有しましょう。`:`${st.name}さんが週${g.visits}回の巡回清掃・補充・写真報告を完了。スキル${st.skill}/5の仕上がりです。`;
  n.lastCareDay=p.closedDay;
 }else if(st)staffReport='委託費を確保できず、清掃を依頼できませんでした。';
 const actualItems=catalog(snap).filter(i=>snap.owned.includes(i.id)),appeal=Math.min(24,actualItems.reduce((a,i)=>a+i.appeal,0)),careBonus=actualItems.filter(i=>i.category==='care'||i.id==='battery').length;
 const prepQuality=['interior','photos','internet','gas'].reduce((a,id)=>a+(choiceOf(snap,id)?.quality||0),0);
 const eventDelta=p.event?(p.answer?.bonus??-8):0,priceIndex=g.rates.indexOf(snap.rate);
 const satisfaction=Math.round(clamp(60+appeal+prepQuality+careBonus*2+(clean-75)*.35+(supplies-65)*.15+eventDelta-(priceIndex===2?5:0),15,98));
 const waves=g.id==='photo'?[1,.65,1.2,.85,1.3,.8]:g.id==='meeting'?[1,1.04,.88,1.08,.98,1.03]:[1,.88,1.08,.97,1.12,.92];
 const repeat=g.id==='dance'?Math.min(p.week*.6,8):0;
 const ad=choiceOf(snap,'ads')?.id,adHours=ad==='search'?(['dance','meeting'].includes(g.id)?5:2):ad==='social'?(['photo','party'].includes(g.id)?5:1):0;
 const fresh=snap.publishedDay!==null&&p.week<=2?Math.max(0,1-(snap.prepDay-snap.publishedDay)/7)*.12:0;
 const photoBoost=1+(choiceOf(snap,'photos')?.quality||0)*.025;
 const baselineAppeal=g.needs.reduce((n,id)=>n+ITEMS.find(i=>i.id===id).appeal,0);
 const hours=Math.round(clamp(adHours+(g.demand+Math.max(0,appeal-baselineAppeal)*.35+(snap.reputation-60)*.12+repeat)*prop.demand*portalReach(snap)*photoBoost*(1+fresh)*waves[(p.week-1)%6]*[1.2,1,.8][priceIndex]*clamp(clean/96*.8+supplies/100*.2,.20,1.05),2,70));
 const gross=hours*snap.rate,direct=directShare(snap,p.week),portalFee=feeRate(snap),directGross=Math.round(gross*direct),portalGross=gross-directGross,fee=Math.round(portalGross*portalFee+directGross*.035),utility=weeklyUtility(snap),marketing=weeklyPromotion(snap),profit=gross-fee-rent-utility-marketing-staffCost-consumables-emergency;
 n.cash+=gross-fee-rentCash-utility-marketing-staffCost-extraCareCash-emergency;n.rentCredit-=rentApplied;n.totalProfit+=profit;n.operatingCash+=profit+rentApplied;if(!n.recoveredAt&&p.week<=RECOVERY_WEEKS&&n.operatingCash>=n.cashInvested)n.recoveredAt=p.week;
 n.clean=clamp(clean-g.wear-Math.round(hours/10)+(snap.owned.includes('restore')?7:0),0,100);n.supplies=clamp(supplies-18,0,100);n.reputation=clamp(n.reputation+(satisfaction-77)*.2,20,95);n.completedWeeks=p.week;n.careSpent=0;n.careDone=false;n.capex=0;
 const previous=s.reports.at(-1)?.owned||[],added=actualItems.filter(i=>!previous.includes(i.id)),helpful=actualItems.filter(i=>['dance_cdp','dance_tripod','dance_yoga','photo_tripod','photo_fitting','chairs','adapter','party_console','guide','wifi','restore'].includes(i.id)),featured=added.filter(i=>i.category==='care').at(-1)||helpful[(p.week-1)%Math.max(1,helpful.length)]||added.at(-1)||actualItems[(p.week-1)%actualItems.length];
 const quote=clean<45?'今日は床の汚れが、ちょっと気になったね。':supplies<30?'必要な消耗品が足りなくて、少し困った。':featured?.quote||'気持ちよく使えたね。';
 const stars=satisfaction>=85?(p.week%3===0?4:5):satisfaction>=70?4:satisfaction>=50?3:2;
 const moments=[{title:'扉を開けた瞬間',line:clean>=55?g.first:'あれ、前の人の片付けが残っているみたい。',reason:clean>=55?`${g.concept}が、最初の印象に。`:'お手入れの未処理が、利用に影響しています。'},{title:'小さな工夫に気づく',line:quote,reason:clean<45||supplies<30?'清掃・補充を整えると、気持ちよく使えます。':`${featured?.name||'部屋づくり'}が役に立ちました。`},{title:'帰りぎわ',line:satisfaction>=78?g.returnLine:'次はもっと気持ちよく使えるといいな。',reason:satisfaction>=78?'よい時間が、また来たい気持ちに。':'実際の改善を重ねると、信頼も戻ります。'}];
 const report={week:p.week,genreId:g.id,guest:p.guest,owned:copy(snap.owned),satisfaction,stars,quote,moments,review:stars>=4?'必要なものがそろっていて、よい時間を過ごせました。':'雰囲気は好きなので、お手入れが行き届くともっと嬉しいです。',hours,bookings:Math.max(1,Math.round(hours/(g.id==='party'?4:2))),gross,fee,rent,rentApplied,rentCash,utility,marketing,directGross,portalGross,direct,portalFee,staffCost,care:consumables,emergency,profit,cash:n.cash,staffReport,staffId:snap.staffId,visits:staffCost?g.visits:0,event:p.event,answer:p.answer,unattended};
 n.reports=[...n.reports,report].slice(-RECOVERY_WEEKS);n.paused=n.cash<cashFixed(n);return {state:n,report};
}
export function beginNextDay(s,now=Date.now()){
 if(gameResult(s))throw Error('この経営の結果は確定済みです。');if(s.phase!=='waiting'||!s.pending)throw Error('営業中の週がありません。');const elapsed=currentDay(s,now)-s.pending.closedDay;if(elapsed<1)throw Error('次の経営は日本時間0時からです。');
 const first=settle(s,s.pending);let n=first.state,skipped=0;for(let i=0;i<Math.min(elapsed-1,RECOVERY_WEEKS)&&!n.paused&&!gameResult(n);i++){
  const day=s.pending.closedDay+i+1,week=n.completedWeeks+1,snap=copy({...n,pending:null,reports:[],recap:null,listings:[]});if(day-(n.lastCareDay??day)>=2&&!staffOf(n)){snap.clean=Math.max(0,snap.clean-10);snap.supplies=Math.max(0,snap.supplies-8);}
  n=settle(n,{week,closedDay:day,snapshot:snap,guest:guestFor(snap,week),event:null,answer:null},true).state;skipped++;
 }
 n.pending=null;n.phase='recap';n.recap={first:first.report,skipped,unlocked:s.completedWeeks<4&&n.completedWeeks>=4};return n;
}
export function advanceWeeks(s,weeks=1){
 if(s.phase!=='waiting'||!s.pending)throw Error('今週の運営を終えてから、時間を進めましょう。');
 if(![1,4].includes(weeks))throw Error('翌週（1週間）か翌月（4週間）を選びましょう。');
 const n=copy(s);n.debugDays+=weeks;
 const anchor=(s.pending.closedDay-s.debugDays)*DAY-9*3600000;
 return beginNextDay(n,anchor);
}
export function debugAdvance(s,days=1,now=Date.now()){if(!Number.isInteger(days)||days<1||days>30)throw Error('日送りは1〜30日です。');const n=copy(s);n.debugDays+=days;return beginNextDay(n,now);}
export function continueManagement(s){if(s.phase!=='recap')throw Error('先に結果を確認しましょう。');const n=copy(s);n.phase=gameResult(n)==='gameover'?'gameover':gameResult(n)==='clear'?'goal':'manage';n.recap=null;return n;}
export function validateState(s){return !!(s&&s.version===VERSION&&['welcome','genre','area','property','research','setup','manage','waiting','recap','goal','gameover','epilogue'].includes(s.phase)&&Number.isFinite(s.cash)&&Number.isFinite(s.cashInvested)&&Number.isFinite(s.operatingCash)&&Number.isInteger(s.completedWeeks)&&s.completedWeeks>=0&&Number.isInteger(s.debugDays)&&Array.isArray(s.owned)&&Array.isArray(s.reports)&&Array.isArray(s.listings)&&Array.isArray(s.inspected)&&s.preparation&&Array.isArray(s.portals)&&Number.isFinite(s.clean)&&Number.isFinite(s.supplies)&&Number.isFinite(s.rentCredit)&&s.owned.every(id=>ITEMS.some(i=>i.id===id))&&(!s.genreId||genreOf(s))&&(['welcome','genre','area','property','research'].includes(s.phase)||s.property?.area>0)&&(s.phase!=='waiting'||s.pending?.week===s.completedWeeks+1)&&(s.phase!=='recap'||s.recap?.first));}
export const choiceOf=(s,id)=>setupTasksFor(s).find(t=>t.id===id)?.choices.find(c=>c.id===s.preparation[id]?.id);
export const feeRate=s=>s.portals.length?s.portals.reduce((a,id)=>a+PORTALS.find(p=>p.id===id).fee,0)/s.portals.length:PORTALS.find(p=>p.genres.includes(s.genreId)).fee;
export const portalReach=s=>s.portals.some(id=>PORTALS.find(p=>p.id===id).genres.includes(s.genreId))?(s.portals.length>1?1.08:1):.6;
export const directShare=(s,week=s.completedWeeks+1)=>choiceOf(s,'website')?.id==='simple'?Math.min(['dance','meeting'].includes(s.genreId)?.6:.25,Math.max(0,week-Math.max(3,s.preparation.website.activatedWeek||1)+1)*.025):0;
export function chooseArea(s,location){if(!['area','property','research'].includes(s.phase)||s.property)throw Error('契約前に出店エリアを選びます。');if(!location?.id||!location.pref||!location.name)throw Error('実在の駅を選びましょう。');if(s.exploration&&['both','area'].includes(s.exploration.mode)&&s.exploration.stationId===location.id)throw Error('今回は別の駅を選んで、立地の違いを体験しましょう。');const n=copy(s);Object.assign(n,{location:copy(location),areaPref:location.pref,phase:'property',listings:makeListings(n.genreId,n.seed,location),research:null,inspected:[]});return n;}
export function startResearch(s,id){if(s.phase!=='property')throw Error('物件一覧から選んでください。');const p=s.listings.find(p=>p.id===id);if(!p)throw Error('物件がありません。');const n=copy(s);n.phase='research';n.research={propertyId:id,checks:[],observed:[],rounds:0,visited:null,benchmark:'c0',forecastAccepted:false};return n;}
export function researchProperty(s){return s.listings.find(p=>p.id===s.research?.propertyId)||s.property;}
export function inspectionsFor(s){
 const p=researchProperty(s);
 if(s.genreId!=='dance'){const context=inspectionContext(s);return INSPECTIONS.map(c=>context?.[c.id]?{...c,title:context[c.id][0],tip:context[c.id][1],source:c.source+' / 付録⑬（用途別備品から確認場面を構成）'}:c);}
 const extra=[{id:'neighbors',title:'上下左右の用途と、階下の有無を確かめる',tip:'地下・1階を中心に検討。1階でも地下にテナントがあれば階下です。空中階は倉庫・楽器教室・空室などの名前だけで判断しません。',source:'教材 第2部2-5・2-7・2-8'},
 {id:'vibration',title:'仲介担当と分かれて、ジャンプ・足音を確かめる',tip:'室内でジャンプ・足踏みをし、階下・上下左右で伝わり方を確認。下が音を出す業種でも、苦情が出た実例があります。',source:'教材 第2部2-5・2-7'},
 ...(p?.floor<0?[{id:'basement',title:'地下の湿気・換気・携帯電波を確認する',tip:'日当たりより、湿気やカビ跡・換気・入口から室内までの通信を確認。回線や入室案内が使えるかを確かめます。',source:'教材 第2部2-8 / ブログ 2026-08-29'}]:[])];
 return [INSPECTIONS[0],INSPECTIONS[1],extra[0],INSPECTIONS[2],...extra.slice(1),INSPECTIONS[3],INSPECTIONS[4]];
}
export const inspectionsComplete=s=>inspectionsFor(s).every(x=>s.research?.checks.includes(x.id));
export function inspectionFinding(s,id){
 const p=researchProperty(s);
 if(s.genreId==='dance'&&['neighbors','noise','vibration','basement'].includes(id))return danceFinding(p,id);
 if(id==='route')return `実際の徒歩は約${p.walk+2}分。${p.elevator?'エレベーターと搬入口の寸法を確認。':p.floor===1?'1階の入口と搬入口の幅を確認。':floorLabel(p)+'まで階段。家具・機材の寸法と搬入経路を照合。'}`;
 const observation=genreObservation(s,p,id);if(observation)return observation;
 if(id==='measure')return `使える室内は約${p.usableArea}㎡。${p.repairNeeded?'床の表面に傷。表層の補修費を見込む。':'床・壁は現状利用可能。'}${['party','photo'].includes(s.genreId)?p.interiorReady?'この用途向けの壁・床・照明が既に整っています。':'用途に合わせた壁・床・照明の整備が必要です。':''}${s.genreId==='dance'?'長方形で、鏡を貼る平らな壁面を確認。'+(p.existingMirror?'既存の壁面鏡6.5mの固定・歪みを確認し、再利用可能。':'鏡を6.5m新設する費用を見込む。')+'個人練習20㎡・教室35㎡という教材の目安と、有効面積を比べます。':''}`;
 if(id==='noise')return p.permitted?'仲介担当と想定する利用時の音・振動を確認。利用条件を記録。':'隣室への音の伝わりが大きく、用途条件も合わない。';
 if(id==='permission')return (p.permitted?'無人・時間貸しと具体的な用途を説明し、貸主承認を確認。エアコンは設備。原状回復範囲を記録。':'この用途では貸主承認なし。契約は見送り。')+` 敷金${money(p.deposit)}・礼金${money(p.keyMoney??p.breakdown.find(([k])=>k.startsWith('礼金'))?.[1]??0)}。`+(p.propertyModel?`敷引き${p.deductionMonths}ヶ月（${money(p.depositDeduction)}）は返還されません。解約予告${p.noticeMonths}ヶ月。残る敷金も原状回復等の精算で変わります。`:'敷引き・解約予告の詳細は旧募集に未記録です。');
 return '予備鍵・キーボックスの設置場所と、事業ゴミの処理ルールを確認。';
}
export function inspectionBlockers(s){
 if(s.genreId!=='dance')return [];
 const p=researchProperty(s),b=p?.danceBuilding,r=s.research;
 if(!b)return r.checks.includes('neighbors')?danceBlockers(p):[];
 return danceBlockers({...p,danceBuilding:{...b,
 vibration:r.checks.includes('vibration')?b.vibration:'pass',
 sound:r.checks.includes('noise')?b.sound:'pass',
 moisture:r.checks.includes('basement')?b.moisture:'dry'}});
}
export function survey(s,id){if(s.phase!=='research'||!inspectionsFor(s).some(i=>i.id===id))throw Error('内見の項目を選びましょう。');const n=copy(s);if(!n.research.checks.includes(id))n.research.checks.push(id);n.research.forecastAccepted=false;return n;}
export function competitors(s){const p=s.listings.find(p=>p.id===s.research?.propertyId),g=genreOf(s);if(!p)return [];return ['条件の近い主役','上位店・写真が強い','上位店・リピート型','下位店・案内に課題','下位店・価格が強気'].map((role,i)=>{const hours=Math.round(g.demand*p.demand*[1,1.45,1.25,.62,.40][i]),rate=g.rates[i===4?2:1];return {id:'c'+i,name:s.location.name+' '+['ひだまり','アトリエ青','リズム','こもれび','ひととき'][i],role,hours,rate,firstHours:Math.max(1,Math.round(hours*.65)),blocked:4,buffer:3,area:p.area+[0,8,3,-2,4][i],walk:p.walk+[0,-2,1,3,0][i],review:['荷物置きが助かる','写真の通りで気分が上がる','毎週同じ時間に使いやすい','入口が分かりにくかった','値段の割に設備が少ない'][i],lesson:['使える広さ・料金・客層が近いので基準に向く。','上位の売上をそのまま自店の売上にしない。','定期客や直予約の存在を確認。','案内と動線を改善する余地を探す。','高い時間料金でも、稼働しないと利益は残らない。'][i]};});}
export function observe(s,id){if(s.phase!=='research'||!competitors(s).some(c=>c.id===id))throw Error('調査対象がありません。');const n=copy(s);if(!n.research.observed.includes(id))n.research.observed.push(id);n.research.forecastAccepted=false;return n;}
export function repeatSurvey(s){if(s.phase!=='research'||s.research.observed.length<5)throw Error('まず5店舗を比較します。');const n=copy(s);n.research.rounds=Math.min(2,n.research.rounds+1);n.research.forecastAccepted=false;return n;}
export function visitCompetitor(s,id){if(s.phase!=='research'||!s.research.observed.includes(id))throw Error('調査した店を視察しましょう。');if(s.research.visited)throw Error('視察済みです。');const c=competitors(s).find(c=>c.id===id),cost=c.rate;if(s.cash<cost+50000)throw Error('視察費用を確保しましょう。');const n=copy(s);n.cash-=cost;n.cashInvested+=cost;n.research.visited=id;return n;}
export function setBenchmark(s,id){if(s.phase!=='research'||!s.research.observed.includes(id))throw Error('調査した店を選びます。');const n=copy(s);n.research.benchmark=id;n.research.forecastAccepted=false;return n;}
export function forecast(s){const p=s.listings.find(p=>p.id===s.research?.propertyId)||s.property,g=genreOf(s),c=competitors(s).find(c=>c.id===s.research?.benchmark)||{hours:g.demand},fee=PORTALS.find(p=>p.genres.includes(g.id)).fee;const investment=(s.phase==='research'?s.cashInvested:0)+p.contract+essentialCost({...s,property:p,owned:[]})+30000+(p.danceBuilding?.mobileWeak?22000:12000)+minimumInterior(s,p),prepDays=Math.max(p.danceBuilding?.mobileWeak?14:1,minimumInterior(s,p)>25000?7:p.repairNeeded?4:0)+1,fixed=p.rentMonthly+p.managementMonthly+(p.danceBuilding?.mobileWeak?11800:11000)+g.visits*1500*4;return {prepDays,investment,netInvestment:investment-p.deposit+(p.depositDeduction||0),fee,fixed,cases:[['弱気',.65],['標準',1],['好調',1.25]].map(([name,f])=>{const hours=Math.round(c.hours*f),gross=hours*g.rates[1]*4,profit=Math.round(gross*(1-fee)-fixed);return {name,hours,gross,profit,months:profit>0?Math.ceil((investment-p.rentMonthly-p.managementMonthly+Math.round(weeklyRent(p)/7)*prepDays)/profit):null};}),breakevenHours:Math.ceil(fixed/(g.rates[1]*(1-fee))/4)};}
export function researchRequirements(s){
 const r=s.research;if(s.phase!=='research'||!r)return [];
 return [
  {id:'inspection',done:inspectionsComplete(s),label:`内見 ${inspectionsFor(s).filter(x=>r.checks.includes(x.id)).length}/${inspectionsFor(s).length}`,action:'research-tab',target:'inspection',cta:'残りの内見を確認する'},
  {id:'observe',done:r.observed.length>=5,label:`競合の初回調査 ${r.observed.length}/5`,action:'research-tab',target:'market',cta:'未調査の競合を見る'},
  {id:'repeat',done:r.rounds>=2,label:`別日・利用直前の確認 ${r.rounds}/2`,action:'repeat-survey',target:'',cta:r.rounds===0?'別日のカレンダーを確認する':'利用直前のカレンダーを確認する',disabled:r.observed.length<5},
  {id:'visit',done:!!r.visited,label:`競合を1店利用して視察 ${r.visited?'1':'0'}/1`,action:'visit-competitor',target:r.benchmark,cta:'試算の基準店を1時間利用して視察',disabled:!r.observed.includes(r.benchmark)}
 ];
}
export function acceptForecast(s){if(s.phase!=='research')throw Error('調査画面で確認してください。');const missing=researchRequirements(s).filter(x=>!x.done);if(missing.length)throw Error('残っている確認：'+missing.map(x=>x.label).join('、'));const n=copy(s);n.research.forecastAccepted=true;return n;}
export function remainingSetupReserve(s){let v=0;if(!s.preparation.internet)v+=s.property?.danceBuilding?.mobileWeak?22000:12000;if(!s.preparation.interior)v+=minimumInterior(s);if(!s.assemblyPaid)v+=30000;return v;}
export function chooseSetup(s,id,choice){assertEditable(s);if(s.phase==='manage'&&!['website','ads'].includes(id))throw Error('開業後に変更できるのはHP・広告です。');const task=setupTasksFor(s).find(t=>t.id===id),c=task?.choices.find(c=>c.id===choice);if(!c)throw Error('プランを選びましょう。');if(s.preparation[id]&&!['website','ads'].includes(id))throw Error('手配済みです。');if(s.preparation[id]?.id===choice)throw Error('選択済みです。');if(id==='internet'&&choice==='router'&&s.property.danceBuilding?.mobileWeak)throw Error('内見で携帯電波が弱いと判明した地下物件です。光回線を選びましょう。');if(id==='interior'&&choice==='reuse'&&['party','photo'].includes(s.genreId)&&!s.property.interiorReady)throw Error('この用途には壁・床・照明の整備が必要です。DIYと照明工事、または施工店を選びましょう。');if(id==='photos'&&!s.furnished)throw Error('設営してから撮影します。');if(id==='interior'&&choice==='reuse'&&s.property.repairNeeded)throw Error('この物件には床の修繕が必要です。');
 const n=copy(s);n.preparation[id]={id:choice,activatedWeek:s.completedWeeks+1,readyDay:n.prepDay+(s.phase==='manage'?0:c.days)};const reserve=essentialCost(n)+remainingSetupReserve(n)+5000;if(n.cash-c.cost<reserve)throw Error('開業必須品と運転資金を残せません。');n.cash-=c.cost;n.cashInvested+=c.cost;n.setupLog.push({day:n.prepDay,task:task.title,choice:c.label,cost:c.cost});return n;}
export function finishPreparation(s){if(s.phase!=='setup')throw Error('開業準備中に進めます。');const day=Math.max(s.prepDay,...Object.values(s.preparation).map(x=>x.readyDay));if(day<=s.prepDay)throw Error('待っている作業はありません。');const n=copy(s),rent=Math.round(EPS(weeklyRent(s.property)/7*(day-s.prepDay))),credit=Math.min(n.rentCredit,rent),pay=rent-credit;if(n.cash-pay<5000)throw Error('待機中の家賃が足りません。');n.cash-=pay;n.cashInvested+=pay;n.rentCredit-=credit;n.prepDay=day;n.setupLog.push({day,task:'待機中の賃料',choice:`${day-s.prepDay}日分（前払い充当 ${money(credit)}）`,cost:pay});return n;}
const EPS=n=>Math.round(n*100)/100;
export function equipmentCheckMissing(s){return [['power','電気'],['water','水道'],['internet','回線']].filter(([id])=>!s.preparation[id]||s.preparation[id].readyDay>s.prepDay).map(([,label])=>label+'の利用開始・開通');}
export function equipmentChecked(s){return s.equipmentChecked??s.furnished;}
export function verifyEquipment(s){assertEditable(s);if(!s.furnished)throw Error('先に備品の組立・固定を行います。');const missing=equipmentCheckMissing(s);if(missing.length)throw Error('動作確認の前に必要：'+missing.join('、'));if(equipmentChecked(s))throw Error('動作確認済みです。');const n=copy(s);n.equipmentChecked=true;n.setupLog.push({day:n.prepDay,task:'開通後の動作確認',choice:'通電・通水・Wi-Fi接続・音源・入室案内を確認',cost:0});return n;}
export function assemble(s){if(s.phase!=='setup'||s.furnished)throw Error('開業前の設営を行います。');if(requiredItems(s).some(i=>!s.owned.includes(i.id)))throw Error('開業セットの家具・備品を先に購入します。');if(!s.preparation.interior||s.preparation.interior.readyDay>s.prepDay)throw Error('内装の手配・完了を先に確認します。');const n=copy(s),cost=s.assemblyPaid?0:30000;if(n.cash-cost<5000)throw Error('設営・動作確認費が足りません。');n.cash-=cost;n.cashInvested+=cost;n.furnished=true;n.equipmentChecked=equipmentCheckMissing(n).length===0;n.assemblyPaid=true;n.setupLog.push({day:n.prepDay,task:n.equipmentChecked?'設営・動作確認':'組立・固定（動作確認は開通後）',choice:n.equipmentChecked?'組立・固定・通電・通水・通信・音源を確認':'購入済み備品の組立・固定。電気・水道・回線の開通後に動作確認が必要',cost});return n;}
export function registerPortal(s,id){assertEditable(s);if(!PORTALS.some(p=>p.id===id))throw Error('掲載先を選びましょう。');if(s.portals.includes(id))throw Error('登録済みです。');if(!s.furnished||!s.preparation.photos)throw Error('設営と掲載写真の手配を先に行います。');const n=copy(s);n.portals.push(id);n.synced=false;if(n.publishedDay===null)n.publishedDay=n.prepDay;return n;}
export function syncCalendar(s){assertEditable(s);if(!s.portals.length)throw Error('掲載先を先に登録します。');const n=copy(s);n.synced=true;return n;}
export function openingMissing(s){const miss=[];for(const t of SETUP_TASKS)if(!s.preparation[t.id])miss.push(t.title);if(Object.values(s.preparation).some(v=>v.readyDay>s.prepDay))miss.push('工事・手配の完了');if(requiredItems(s).some(i=>!s.owned.includes(i.id)))miss.push('開業セットの設備・備品');if(!s.furnished)miss.push('設営');if(s.furnished&&!equipmentChecked(s))miss.push('開通後の動作確認');if(!s.portals.length)miss.push('ポータル登録');if(!s.synced)miss.push('予約カレンダー連携');return miss;}
export function epilogue(s,id){if(!['goal','epilogue'].includes(s.phase)||gameResult(s)!=='clear')throw Error('2年以内の回収後に選べます。');const n=copy(s);n.phase='epilogue';n.epilogueChoice=id;n.epilogueSeen=true;return n;}

export function startNextExperience(s,mode='both'){
 if(!['goal','epilogue'].includes(s.phase)||gameResult(s)!=='clear')throw Error('2年以内に初期費用を回収したあとに、次の出店を体験できます。');
 if(!['both','area','genre'].includes(mode))throw Error('次に学ぶ条件を選びましょう。');
 const n=initialState((s.seed+0x9e3779b9)>>>0),record={run:s.runNumber||1,name:s.name,genreId:s.genreId,location:copy(s.location),recoveredAt:s.recoveredAt,cashInvested:s.cashInvested,operatingCash:s.operatingCash,endingCash:s.cash,owned:copy(s.owned)};
 n.pastRuns=[...(s.pastRuns||[]),record];n.runNumber=(s.runNumber||1)+1;n.exploration={mode,genreId:s.genreId,stationId:s.location.id,stationName:s.location.name,pref:s.location.pref};n.phase='genre';
 if(mode==='area'){const next=chooseGenre(n,s.genreId);next.exploration=n.exploration;return next;}
 return n;
}

export function recapReports(s){if(!s.recap)return [];const first=s.recap.first;return [first,...s.reports.filter(r=>r.week>first.week&&r.week<=first.week+s.recap.skipped)];}

export const visitFinding=s=>competitorObservation(s.genreId,competitors(s).find(c=>c.id===s.research?.visited));
