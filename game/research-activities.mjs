import * as E from './engine.mjs?v=053';
import {nextResearchStep} from './research-guide.mjs?v=053';
// Short fictional decisions adapted from the existing textbook inspection checklist.
export function inspectionQuestion(s,id){
 if(id==='measure'&&E.inspectionContext(s))return E.inspectionContext(s);
 if(id==='permission')return {
  question:'「事務所利用OK」なら、時間貸しもOK？',
  scene:'貸主には、時間貸しで使うことをまだ伝えていません。',
  choices:['そのまま時間貸ししてよい','時間貸ししてよいか、貸主に確認する'],answer:1,
  explanation:'事務所の許可だけでは、時間貸しの許可にはなりません。'};
 if(id==='key'&&s.genreId==='meeting')return {
  question:'Wi-Fiが使えるか、いつ確認する？',
  scene:'この部屋のインターネット回線は、まだ未開通です。',
  choices:['Wi-Fi機器を置いたとき','インターネット回線が開通したあと'],answer:1,
  explanation:'回線が開通したら、実際にWi-Fiにつないで確認します。'};
 if(id==='key')return {
  question:'鍵の場所を伝えるなら、どちら？',
  scene:{party:'誕生日会のお客さんが、鍵の場所を探しています。',photo:'撮影に来たお客さんが、鍵の場所を探しています。',dance:'レッスンの先生が、鍵の場所を探しています。'}[s.genreId],
  choices:['鍵の場所が分かる写真を送る','鍵の番号だけを送る'],answer:0,
  explanation:'鍵の番号だけでは、場所は分かりません。写真があると見つけやすくなります。'};
 if(id==='vibration'){
  const lower=E.researchProperty(s)?.danceBuilding?.lower||'未確認',none=lower==='下にフロアなし';
  return {question:'ダンスの振動は、どう確かめる？',
   scene:none?'この物件は「下にフロアなし」です。':`この物件の階下は「${lower}」です。`,
   choices:['階数だけで判断する',none?'足踏みして、上や隣への響きを確認する':'足踏みして、階下への響きを確認する'],answer:1,
   explanation:'振動の伝わり方は、現地で足踏みして確かめます。'};
 }
 return null;
}
export function answerInspection(s,id,answer){
 if(s.phase!=='research'||s.research.checks.includes(id))throw Error('この確認は完了済みです。次の案内を開いてください。');
 const q=inspectionQuestion(s,id);if(!q||Number(answer)!==q.answer)throw Error(q?.explanation||'質問を確認してください。');
 return E.survey(s,id);
}
export function completeComparison(s,id){
 if(nextResearchStep(s)?.action!=='observe')throw Error('今の調査段階を確認してください。');
 if(!E.competitors(s).some(c=>c.id===id))throw Error('比較する店を選んでください。');
 // All five are visible together; one selection records the comparison, not five repeated clicks.
 let n=s;for(const c of E.competitors(s))n=E.observe(n,c.id);return E.setBenchmark(n,id);
}
export function completeCalendar(s,answer){
 if(nextResearchStep(s)?.action!=='repeat-survey')throw Error('今の調査段階を確認してください。');
 const c=E.competitors(s).find(c=>c.id===s.research.benchmark);
 if(Number(answer)!==c.hours)throw Error('売上になるのは、お客さんが利用する時間だけです。');
 let n=s;while(n.research.rounds<2)n=E.repeatSurvey(n);n.research.calendarLearned=true;return n;
}
