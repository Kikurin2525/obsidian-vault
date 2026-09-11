import * as E from './engine.mjs?v=051';
// The guide never skips a required check or makes a financial choice silently.
export function nextResearchStep(s){
 if(s.phase!=='research'||!s.research)return null;
 const r=s.research,p=s.listings.find(x=>x.id===r.propertyId),inspections=E.inspectionsFor(s);
 const cost=E.competitors(s).find(x=>x.id===r.benchmark)?.rate||0;
 const reserve=E.launchReserve(s,p),gap=p.contract+reserve+(r.visited?0:cost)-s.cash;
 const done=r.checks.length+r.observed.length+r.rounds+(r.visited?1:0)+(r.forecastAccepted?1:0);
 const common={done,total:inspections.length+10};
 if(!p.permitted&&r.checks.includes('permission'))return {...common,key:'permission',title:'この用途では契約できません',body:'貸主の用途承認がない物件です。別の候補に戻って、使える物件を選びましょう。',label:'別の物件を選ぶ',action:'back-properties'};
 const blockers=E.inspectionBlockers(s);
 if(blockers.length)return {...common,key:'unsuitable',title:'現地で分かった条件から、この物件は見送ろう',body:blockers.join('。')+'。確認した結果を使って、より条件に合う候補を探しましょう。',label:'理由を記録して、別の物件へ',action:'back-properties',section:'inspection'};
 if(gap>0)return {...common,key:'budget',title:`開業予算が${E.money(gap)}不足しています`,body:`手元 ${E.money(s.cash)}に対し、契約金 ${E.money(p.contract)}＋最低準備・運転資金 ${E.money(reserve)}${r.visited?'':`＋利用視察 ${E.money(cost)}`}が必要です。家賃の低い候補を比べましょう。`,label:'予算に合う候補を見る',action:'back-properties'};
 const c=inspections.find(x=>!r.checks.includes(x.id));
 if(c)return {...common,key:`survey:${c.id}`,title:c.title,body:c.tip,label:`内見する（${r.checks.length+1}/${inspections.length}）`,action:'survey',id:c.id,section:'inspection'};
 const other=E.competitors(s).find(x=>!r.observed.includes(x.id));
 if(other)return {...common,key:`observe:${other.id}`,title:'5店を並べて、自分の店の基準を選ぼう',body:'広さ・駅距離・料金・お客さんの声を一覧で比較します。気になる店を選ぶと、試算の基準にする際のヒントが出ます。',label:'5店を並べて比較する',action:'observe',id:other.id,section:'market'};
 if(r.rounds<2)return {...common,key:`repeat:${r.rounds}`,title:'予約カレンダーの変化を見つけよう',body:r.rounds===0?'5店舗の初回調査は完了です。次は別日のカレンダーを見て、あとから増えた予約を追います。ゲーム内の調査なので、現実の日付を待つ必要はありません。':'直前に入った予約を確認します。オーナーが押さえた時間や入替の余白を、売上に数えないことも確認しましょう。',label:'3つの時点の予約を見比べる',action:'repeat-survey',section:'market'};
 if(!r.visited)return {...common,key:'visit',title:'競合を1店、お客さんとして使ってみよう',body:`試算の基準店を1時間利用します。${E.inspectionContext(s)?.visit||'写真では分からない鏡の見え方・足音・音響・動線を確かめましょう。'}視察費 ${E.money(cost)}をゲーム内の資金から支払います。`,label:`1時間利用して視察する · ${E.money(cost)}`,action:'visit-competitor',id:r.benchmark,section:'market'};
 if(!r.forecastAccepted){const f=E.forecast(s);return {...common,key:'forecast',title:'調査完了。利益と回収の見通しを確認しよう',body:`標準ケースの月間利益は${E.money(f.cases[1].profit)}。弱気の場合も比べ、回収期間と必要な資金を見て判断しましょう。`,label:'試算を確認して、契約の判断へ',action:'accept-forecast',section:'forecast'};}
 return {...common,key:'contract',title:'最後に、契約するかを決めよう',body:`契約金は${E.money(p.contract)}。支払ったあとの手元資金は${E.money(s.cash-p.contract)}です。${p.propertyModel?`敷金${p.depositMonths}ヶ月・礼金${p.keyMoneyMonths}ヶ月、敷引き${p.deductionMonths}ヶ月。解約予告${p.noticeMonths}ヶ月です。`:""}この物件で進めると、次は電気・水道・回線などの開業準備です。`,label:`この物件を契約する · ${E.money(p.contract)}`,action:'contract',id:p.id,section:'forecast'};
}
export function completeGuidedStep(s,key){
 const step=nextResearchStep(s);if(!step||step.key!==key)throw Error('進行が更新されました。現在の案内を確認してください。');
 switch(step.action){
 case 'survey':return E.survey(s,step.id);
 case 'observe':return E.observe(s,step.id);
 case 'repeat-survey':return E.repeatSurvey(s);
 case 'visit-competitor':return E.visitCompetitor(s,step.id);
 case 'accept-forecast':return E.acceptForecast(s);
 case 'contract':return E.contract(s,step.id,s.name);
 case 'back-properties':return {...s,phase:'property',research:null,lastPropertyLesson:step.body};
 default:throw Error('案内を読み直してください。');
 }
}
