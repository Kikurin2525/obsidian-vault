// Fictional listing scenarios, based on textbook 2-5/2-6/2-8 and 4-1.
// Scenario frequencies and prices are game settings, not measured market probabilities.
export const PROPERTY_MODEL='property-v035';
export const floorLabel=p=>p.floor<0?`地下${Math.abs(p.floor)}階`:`${p.floor}階`;
export function leaseTerms(rent,index,seed){
 const n=seed>>>0;
 const depositMonths=[[0,1,2],[2,3,6],[1,0,3]][index][n%3];
 const keyMoneyMonths=(n+index)%3;
 const deductionMonths=depositMonths>0&&(n+index)%2===0?1:0;
 return {depositMonths,keyMoneyMonths,deductionMonths,deposit:rent*depositMonths,keyMoney:rent*keyMoneyMonths,depositDeduction:rent*deductionMonths,noticeMonths:(n+index)%2===0?6:2};
}
export function danceBuilding(index,seed,market){
 const n=seed>>>0,urban=market.base>=7500;
 const floor=index===0?(urban?-1:1):index===1?1:[2,3,5][n%3];
 const variant=n%4;
 const lower=index===2?['楽器教室','事務所','倉庫','空室（次の入居用途は未定）'][variant]:index===1&&variant===0?'地下の事務所':'下にフロアなし';
 const vibration=lower==='下にフロアなし'?'no-lower':lower==='倉庫'?'pass':lower.startsWith('空室')?'unverified':'fail';
 return {floor,elevator:index===2&&n%2===0,structure:index===1?'鉄骨造':'RC造',oneTenant:true,
  lower,upper:floor<0?'事務所':'事務所',adjacent:'同じ階に別テナントなし',vibration,
  sound:index===1&&variant===1?'fail':'pass',
  moisture:floor<0&&n%5===0?'damp':'dry',mobileWeak:floor<0&&n%2===0,
  mirrorWall:'平らな壁面あり',shape:'長方形',hours:'9:00〜21:00',floorFactor:floor<0?.84:floor===1?1.08:.70};
}
export function danceBlockers(p){
 const b=p.danceBuilding;
 if(!b)return ['階下・音・振動の具体的な記録がない旧募集です。新しい募集で条件を確かめましょう。'];
 const reasons=[];
 if(b.vibration==='fail')reasons.push(`階下の${b.lower}でジャンプの振動が響き、想定する練習では支障がある`);
 if(b.vibration==='unverified')reasons.push('階下は空室で、次の入居用途と振動の影響を確認できていない');
 if(b.sound==='fail')reasons.push('想定音量の音楽が道路・上階へ強く漏れ、利用条件に合わない');
 if(b.moisture==='damp')reasons.push('地下の壁際に湿気・カビ跡があり、原因と対策費を確認できていない');
 return reasons;
}
export function danceFinding(p,id){
 const b=p.danceBuilding;
 if(!b)return '旧募集では具体的な条件が未記録です。新しい募集を探し、階下と現地の状態を確かめましょう。';
 if(id==='neighbors')return `${floorLabel(p)}・${b.structure}。下：${b.lower}。上：${b.upper}。隣：${b.adjacent}。階数や業種だけでは合否を決めず、実際の音と振動を確認します。`;
 if(id==='noise')return b.sound==='fail'?'仲介担当と想定音量で音楽を流すと、開口部から道路・上階へ強く漏れました。1階でも音漏れは起きます。この条件では見送りです。':`仲介担当と想定音量で音楽を流し、上階・隣接区画・廊下への音を確認。この内見では${b.hours}の利用条件内に収まりました。RC造や地下であること自体が安全の保証ではありません。`;
 if(id==='vibration')return b.vibration==='no-lower'?'図面と現地で、下にフロアがないことを確認。ジャンプ・足踏みをして、上階・隣接区画でも響きを確認しました。階下がなくても、周囲への伝わり方は調べます。':b.vibration==='fail'?`仲介担当に階下の${b.lower}へ入ってもらい、上でジャンプ・足踏み。振動が響き、利用に支障がありました。音を出す業種でも安心できません。工事で解決できると決めつけず、見送ります。`:b.vibration==='unverified'?'階下が空室のため、次の入居者への影響は未確認です。「今は誰もいない」を合格にせず、この候補は保留して別の物件を探します。':`階下の${b.lower}にも入ってもらい、ジャンプ・足踏みと音楽を同時に確認。今回の使い方では支障なし。空中階の例外として、利用時間${b.hours}と確認条件を記録しました。将来の入居者変更時には再確認が必要です。`;
 if(id==='basement')return (b.moisture==='damp'?'壁際に湿気・カビ跡。原因と対策費は未確認なので、契約前に保留。':'壁際のカビ跡・湿気と換気を確認。この内見では目立つ問題なし。')+(b.mobileWeak?' 携帯電波が弱く、ホームルーターは不適合。光回線の引込み可否を確認済み。開業前に光回線を手配し、接続と入室案内を確認します。':' 携帯の通信と、入口で予約・入室案内を表示できることを確認。');
 return '';
}
