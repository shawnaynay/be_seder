/* העוזר של "הסדר שלי": מבין פקודות בעברית בלי אינטרנט, ואם יש מפתח של Claude, מדבר חופשי */
(function(){
var KK='seder_key',MODEL='claude-haiku-5-5';
function key(){try{return localStorage.getItem(KK)||''}catch(e){return ''}}
function chat(){if(!S.chat)S.chat=[];return S.chat}
function say(r,t){chat().push({r:r,t:t,at:Date.now()});if(S.chat.length>60)S.chat=S.chat.slice(-60)}
var busy=false;
var DAYS=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
var nf=function(n){return Math.round(n).toLocaleString('he-IL')+' ₪'};

/* ---------- פעולות ---------- */
var ACT={
  task:function(a){S.tk.unshift({i:uid(),t:a.text,g:a.category||'אישי',d:false});return 'נוספה משימה: '+a.text},
  idea:function(a){S.id.unshift({i:uid(),t:a.text,g:a.category||'אחר'});return 'נשמר רעיון: '+a.text},
  reminder:function(a){S.rm.push({i:uid(),t:a.text,at:a.at.slice(0,16),rep:a.repeat||'',d:false});return 'תזכורת נקבעה ל'+fdt(a.at)+': '+a.text},
  event:function(a){S.ev.push({i:uid(),t:a.text,dt:a.date,tm:a.time||''});return 'נוסף ללוז, '+fd(a.date)+(a.time?' ב־'+a.time:'')+': '+a.text},
  money:function(a){if(!S.exp)S.exp=[];var o={i:uid(),t:a.text,a:+a.amount,dt:a.date||today(),g:a.category||'אחר'};(a.kind==='expense'?S.exp:S.inc).unshift(o);return (a.kind==='expense'?'נרשמה הוצאה ':'נרשמה הכנסה ')+nf(o.a)+': '+a.text}
};
function summaryToday(){
  var t=today(),ev=S.ev.filter(function(e){return e.dt===t}).sort(function(a,b){return (a.tm||'').localeCompare(b.tm||'')});
  var rm=S.rm.filter(function(r){return !r.d&&r.at.slice(0,10)<=t}),tk=S.tk.filter(function(x){return !x.d});
  var s=[];
  s.push(ev.length?'בלוז היום: '+ev.map(function(e){return (e.tm?e.tm+' ':'')+e.t}).join(', ')+'.':'אין אירועים בלוז היום.');
  if(rm.length)s.push('תזכורות: '+rm.map(function(r){return r.t}).join(', ')+'.');
  s.push(tk.length?'יש '+tk.length+' משימות פתוחות'+(tk.length?', למשל: '+tk.slice(0,3).map(function(x){return x.t}).join(', '):'')+'.':'אין משימות פתוחות.');
  return s.join('\n');
}
function money(){
  var ym=today().slice(0,7),cy=ym.slice(0,4),i=0,o=0,iy=0;
  S.inc.forEach(function(x){if(x.dt.slice(0,7)===ym)i+=x.a;if(x.dt.slice(0,4)===cy)iy+=x.a});
  (S.exp||[]).forEach(function(x){if(x.dt.slice(0,7)===ym)o+=x.a});
  var cap=parseFloat(S.cap)||122833;
  return 'החודש: הכנסות '+nf(i)+', הוצאות '+nf(o)+', נשאר '+(i-o<0?'−':'')+nf(Math.abs(i-o))+'.\nמתחילת השנה נכנסו '+nf(iy)+', שזה '+Math.round(iy/cap*100)+'% מתקרת העוסק הפטור.';
}

/* ---------- הבנת עברית בלי אינטרנט ---------- */
function parseWhen(s){
  var d=new Date(),hasDay=false,hasTime=false,m;
  s=' '+s+' ';
  if((m=s.match(/בעוד\s+(חצי שעה|שעה|שעתיים|רבע שעה|(\d+)\s*(דקות|דק׳|דק'|דקה|שעות|ימים|יום))/))){
    var q=m[1];
    if(q==='חצי שעה')d=new Date(Date.now()+30*6e4);else if(q==='רבע שעה')d=new Date(Date.now()+15*6e4);else if(q==='שעה')d=new Date(Date.now()+36e5);else if(q==='שעתיים')d=new Date(Date.now()+72e5);
    else{var n=+m[2],u=m[3];d=new Date(Date.now()+(/שעות/.test(u)?n*36e5:/ימים|יום/.test(u)?n*864e5:n*6e4))}
    s=s.replace(m[0],' ');return {d:d,rest:s,time:true,day:true};
  }
  if(/מחרתיים/.test(s)){d.setDate(d.getDate()+2);s=s.replace('מחרתיים',' ');hasDay=true}
  else if(/מחר/.test(s)){d.setDate(d.getDate()+1);s=s.replace(/מחר/,' ');hasDay=true}
  else if(/היום|הערב|הלילה/.test(s)){s=s.replace(/היום|הערב|הלילה/,' ');hasDay=true}
  else{for(var k=0;k<7;k++){var re=new RegExp('(ב?יום\\s+)?'+DAYS[k]+'(?=\\s)');if(re.test(s)&&!(DAYS[k]==='שני'&&!/יום\s+שני/.test(s))){var diff=(k-d.getDay()+7)%7;d.setDate(d.getDate()+diff);s=s.replace(re,' ');hasDay=true;break}}}
  if((m=s.match(/(?:בשעה\s*|ב[-־]?\s*)(\d{1,2})(?::(\d{2}))?(?=\s)/))){
    var h=+m[1],mi=+(m[2]||0);if(h<24){if(h<8&&/ערב|לילה/.test(s+' '))h+=12;d.setHours(h,mi,0,0);hasTime=true;s=s.replace(m[0],' ')}
  }
  if(!hasTime){d.setHours(hasDay?10:d.getHours()+1,0,0,0)}
  return {d:d,rest:s,time:hasTime,day:hasDay};
}
function clean(s){return s.replace(/\s+/g,' ').replace(/^[\s:,\-–]+|[\s:,\-–.]+$/g,'').trim()}
function offline(q){
  var s=q.trim(),m;
  if(/^(עזרה|מה אתה (יודע|יכול)|help)/.test(s))return {say:HELP};
  if(/מה (יש|קורה|בלוז|על הלוז)|הלוז (שלי|להיום)|מה התוכנית/.test(s))return {say:summaryToday()};
  if(/כמה (הרווחתי|הכנסתי|הוצאתי|כסף|נשאר)|מצב (הכסף|כספי)|רווח/.test(s))return {say:money()};
  if((m=s.match(/^(תזכיר(?:\s+לי)?|תזכורת)\s*[:\-]?\s*(.+)$/))){
    var w=parseWhen(m[2]),t=clean(w.rest.replace(/^\s*ש/,' '));if(!t)return null;
    var rep=/כל יום/.test(m[2])?'d':/כל שבוע/.test(m[2])?'w':/כל חודש/.test(m[2])?'m':'';t=clean(t.replace(/כל (יום|שבוע|חודש)/,''));
    return {act:'reminder',a:{text:t,at:lstr(w.d),repeat:rep}};
  }
  if((m=s.match(/^(?:תוסיף\s+|תכניס\s+)?(?:ללוז|לוז|אירוע|גיג)\s*[:\-]?\s*(.+)$/))){
    var w2=parseWhen(m[1]),t2=clean(w2.rest);if(!t2)return null;
    return {act:'event',a:{text:t2,date:dstr(w2.d),time:w2.time?pad(w2.d.getHours())+':'+pad(w2.d.getMinutes()):''}};
  }
  if((m=s.match(/^(?:תוסיף\s+)?משימה\s*[:\-]?\s*(.+)$/))||(m=s.match(/^(?:אני\s+)?צריך\s+(.+)$/)))return {act:'task',a:{text:clean(m[1])}};
  if((m=s.match(/^(?:רעיון|תשמור רעיון)\s*[:\-]?\s*(.+)$/)))return {act:'idea',a:{text:clean(m[1])}};
  if((m=s.match(/^(הוצאתי|שילמתי|הוצאה|קיבלתי|הכנסה|הרווחתי)\s*[:\-]?\s*(\d[\d,.]*)\s*(?:₪|ש"ח|שח|שקל(?:ים)?)?\s*(?:על|מ|עבור|בשביל)?\s*(.*)$/))){
    var exp=/הוצאתי|שילמתי|הוצאה/.test(m[1]);
    return {act:'money',a:{kind:exp?'expense':'income',amount:parseFloat(m[2].replace(/,/g,'')),text:clean(m[3])||(exp?'הוצאה':'הכנסה'),date:today(),category:guessCat(m[3]||'',exp)}};
  }
  return null;
}
function guessCat(t,exp){
  if(!exp)return /גיג|סט|מסיבה|הופעה|אירוע/.test(t)?'גיג':/ממומן|תוכן|רילס|סטורי|פוסט/.test(t)?'תוכן ממומן':/כרטיס|עמלה/.test(t)?'עמלות כרטיסים':/הפקה|ביט|מיקס|מאסטר/.test(t)?'הפקה':'אחר';
  return /מונית|דלק|רכבת|אוטובוס|חניה|נסיעה/.test(t)?'נסיעות':/מנוי|splice|ספוטיפיי|תוכנה|אפליקציה|plugin|פלאגין|rekordbox/i.test(t)?'תוכנה ומנויים':/אוזניות|רמקול|כבל|קונטרולר|ציוד|מחשב|מיקרופון/.test(t)?'ציוד':/פרסום|קידום|ממומן/.test(t)?'פרסום ושיווק':/קורס|שיעור|סדנה/.test(t)?'לימודים':'אחר';
}
var HELP='אפשר לכתוב לי למשל:\n• תזכיר לי מחר ב־10 להתקשר לאמא\n• תזכיר לי בעוד שעה לשלוח סט\n• ללוז שישי ב־23:00 סט בבארבי\n• משימה: לערוך רילס מהגיג\n• רעיון: מעבר טרייבל לטראנס\n• הוצאתי 45 על Splice\n• קיבלתי 1800 על סט\n• מה יש לי היום? / כמה הרווחתי החודש?';

/* ---------- Claude ---------- */
var TOOLS=[
 {name:'add_task',description:'הוספת משימה',input_schema:{type:'object',properties:{text:{type:'string'},category:{type:'string',enum:['מוזיקה','תוכן','עבודה','בית','אישי']}},required:['text']}},
 {name:'add_idea',description:'שמירת רעיון',input_schema:{type:'object',properties:{text:{type:'string'},category:{type:'string',enum:['רילס','סט','טראק','עסקים','אחר']}},required:['text']}},
 {name:'add_reminder',description:'תזכורת בזמן מסוים. at בפורמט YYYY-MM-DDTHH:MM בשעון מקומי',input_schema:{type:'object',properties:{text:{type:'string'},at:{type:'string'},repeat:{type:'string',enum:['','d','w','m'],description:'d=כל יום, w=כל שבוע, m=כל חודש'}},required:['text','at']}},
 {name:'add_event',description:'אירוע בלוז (גיג, פגישה, צילום). date בפורמט YYYY-MM-DD, time בפורמט HH:MM או ריק',input_schema:{type:'object',properties:{text:{type:'string'},date:{type:'string'},time:{type:'string'}},required:['text','date']}},
 {name:'add_money',description:'רישום הכנסה או הוצאה בשקלים',input_schema:{type:'object',properties:{kind:{type:'string',enum:['income','expense']},amount:{type:'number'},text:{type:'string'},date:{type:'string'},category:{type:'string',description:'הכנסה: גיג, תוכן ממומן, עמלות כרטיסים, הפקה, אחר. הוצאה: ציוד, תוכנה ומנויים, נסיעות, פרסום ושיווק, לימודים, אחר'}},required:['kind','amount','text']}}
];
var MAP={add_task:'task',add_idea:'idea',add_reminder:'reminder',add_event:'event',add_money:'money'};
function context(){
  var n=new Date(),t=today();
  var up=S.ev.filter(function(e){return e.dt>=t}).sort(function(a,b){return (a.dt+a.tm).localeCompare(b.dt+b.tm)}).slice(0,15).map(function(e){return e.dt+' '+(e.tm||'')+' '+e.t}).join('\n');
  var rm=S.rm.filter(function(r){return !r.d}).slice(0,15).map(function(r){return r.at+' '+r.t}).join('\n');
  var tk=S.tk.filter(function(x){return !x.d}).slice(0,20).map(function(x){return '- '+x.t+' ('+x.g+')'}).join('\n');
  var id=S.id.slice(0,10).map(function(x){return '- '+x.t}).join('\n');
  return 'עכשיו: יום '+DAYS[n.getDay()]+', '+t+' '+pad(n.getHours())+':'+pad(n.getMinutes())+' (שעון ישראל).\n'+
  'שם המשתמש: '+(S.name||'לא ידוע')+'. תקליטן, מפיק מוזיקה ויוצר תוכן שיוצא לעצמאות.\n\nלוז קרוב:\n'+(up||'ריק')+'\n\nתזכורות פתוחות:\n'+(rm||'אין')+'\n\nמשימות פתוחות:\n'+(tk||'אין')+'\n\nרעיונות אחרונים:\n'+(id||'אין')+'\n\nכסף:\n'+money();
}
var SYS='אתה העוזר הקטן בתוך אפליקציית "הסדר שלי". עונים תמיד בעברית, קצר, חם וענייני, בלי חנופה. כשהמשתמש מבקש להוסיף או לרשום משהו, משתמשים בכלים. כשחסר פרט חשוב (למשל שעה לתזכורת), בוחרים ברירת מחדל הגיונית ואומרים מה בחרת. אל תמציא מידע שלא מופיע בנתונים. בנושאי מס וכסף נותנים מידע כללי ולא ייעוץ מקצועי.';
async function claude(q){
  var hist=chat().slice(-14).map(function(m){return {role:m.r==='u'?'user':'assistant',content:m.t}});
  while(hist.length&&hist[0].role!=='user')hist.shift();
  var msgs=hist.length?hist:[{role:'user',content:q}],done=[];
  for(var step=0;step<5;step++){
    var res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key(),'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:MODEL,max_tokens:700,system:SYS+'\n\n'+context(),tools:TOOLS,messages:msgs})});
    if(!res.ok){var er='';try{er=(await res.json()).error.message}catch(e){}throw new Error(res.status===401?'המפתח לא תקין':res.status===429?'יותר מדי בקשות, נסה שוב עוד רגע':(er||'שגיאה '+res.status))}
    var j=await res.json(),uses=j.content.filter(function(c){return c.type==='tool_use'});
    if(!uses.length||j.stop_reason!=='tool_use'){var txt=j.content.filter(function(c){return c.type==='text'}).map(function(c){return c.text}).join('\n').trim();return (done.length?done.join('\n')+(txt?'\n\n':''):'')+txt}
    msgs=msgs.concat([{role:'assistant',content:j.content},{role:'user',content:uses.map(function(u){var r;try{r=ACT[MAP[u.name]](u.input);done.push('✓ '+r)}catch(e){r='שגיאה: '+e.message}return {type:'tool_result',tool_use_id:u.id,content:r}})}]);
    persist();
  }
  return done.join('\n');
}

/* ---------- שליחה ---------- */
async function send(q){
  q=(q||'').trim();if(!q||busy)return;
  say('u',q);
  var k=key(),online=navigator.onLine!==false;
  if(k&&online){
    busy=true;render();
    try{say('a',await claude(q))}
    catch(e){var o=offline(q);if(o){say('a',run(o)+'\n(בלי Claude: '+e.message+')')}else say('a','לא הצלחתי להגיע ל־Claude: '+e.message)}
    busy=false;
  }else{
    var r=offline(q);
    say('a',r?run(r):'לא הבנתי עד הסוף.'+(k?' אין חיבור לאינטרנט, אז אני עובד במצב בסיסי.':'')+'\n\n'+HELP);
  }
  persist();render();
}
function run(o){if(o.say)return o.say;return '✓ '+ACT[o.act](o.a)}

/* ---------- מסך ---------- */
function bubble(m){var u=m.r==='u';return '<div style="display:flex;justify-content:'+(u?'flex-start':'flex-end')+';margin:8px 0"><div style="max-width:85%;white-space:pre-wrap;padding:10px 14px;border-radius:18px;'+(u?'background:var(--ac);color:#fff;border-bottom-right-radius:6px':'background:var(--sf);border:1px solid var(--ln);border-bottom-left-radius:6px')+'">'+esc(m.t)+'</div></div>'}
window.vAi=function(){
  var c=chat(),k=key();
  var sug=['מה יש לי היום?','כמה הרווחתי החודש?','תזכיר לי מחר ב־10 ','הוצאתי '];
  return '<h1>העוזר ✨</h1><p class="sub">'+(k?'מחובר ל־Claude · מבין כל ניסוח':'מצב בסיסי, עובד גם בלי אינטרנט')+'</p>'+
  '<div id="chatbox" style="min-height:40vh">'+(c.length?c.map(bubble).join(''):'<div class="tip">'+esc(HELP).replace(/\n/g,'<br>')+'</div>')+(busy?'<div style="display:flex;justify-content:flex-end"><div class="tip" style="margin:6px 0">חושב…</div></div>':'')+'</div>'+
  '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:14px 0 8px">'+sug.map(function(s){return '<button class="tag" style="border:0;cursor:pointer;font:inherit;font-size:.8rem;padding:6px 12px" data-a="aiSug" data-k="'+esc(s)+'">'+esc(s.trim())+'</button>'}).join('')+'</div>'+
  '<div class="add" style="flex-wrap:nowrap"><input type="text" id="aiq" placeholder="כתוב לי מה צריך…" aria-label="הודעה לעוזר" style="flex:1 1 auto"><button class="go" style="flex:0 0 auto;padding:0 18px" data-a="aiSend">שלח</button></div>'+
  (c.length?'<div style="margin-top:10px;text-align:center"><button class="ib" style="width:auto;padding:0 10px;font-size:.85rem;margin:0 auto" data-a="aiClear">ניקוי השיחה</button></div>':'')+
  (k?'':'<p class="note">רוצה עוזר שמבין כל ניסוח ונותן עצות? אפשר לחבר מפתח של Claude ב<a href="#set" data-a="tab" data-k="set" style="color:var(--ac)">הגדרות</a>.</p>');
};
var _vSet=window.vSet;
window.vSet=function(){var k=key();return _vSet()+'<h2>העוזר החכם (לא חובה)</h2><div class="add"><input type="password" id="aikey" class="full" autocomplete="off" placeholder="מפתח API של Claude (מתחיל ב־sk-ant-)" value="'+(k?'••••••••'+esc(k.slice(-4)):'')+'"><button class="go soft" data-a="aiKeySave">שמירת המפתח</button>'+(k?'<button class="go soft" data-a="aiKeyDel">מחיקת המפתח</button>':'')+'</div><p class="note">בלי מפתח העוזר מבין פקודות בסיסיות ועובד גם בלי אינטרנט. עם מפתח הוא מבין כל ניסוח. מפתח יוצרים באתר console.anthropic.com, ושם גם משלמים לפי שימוש (העוזר משתמש במודל זול). המפתח נשמר רק בטלפון הזה ולא נכלל בגיבוי. אל תשתף אותו עם אף אחד.</p>'};
var _render=window.render;
window.render=function(){
  _render();
  var f=document.getElementById('aifab');
  if(!f){f=document.createElement('button');f.id='aifab';f.setAttribute('aria-label','העוזר');f.dataset.a='tab';f.dataset.k='ai';f.textContent='✨';
    f.style.cssText='position:fixed;left:18px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:54px;height:54px;border-radius:50%;border:0;background:var(--hero);color:#fff;font-size:1.45rem;box-shadow:0 12px 30px -8px rgba(110,70,255,.8);z-index:6;cursor:pointer';document.body.appendChild(f)}
  f.style.display=tab==='ai'?'none':'';
  if(tab==='ai'){var cb=document.getElementById('chatbox');if(cb&&cb.lastElementChild)cb.lastElementChild.scrollIntoView({block:'end'});var i=document.getElementById('aiq');if(i&&!busy&&window.__aiFocus){i.focus();window.__aiFocus=0}}
};
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a;
  if(a==='aiSend'){var i=document.getElementById('aiq');window.__aiFocus=1;send(i&&i.value)}
  else if(a==='aiSug'){var k=b.dataset.k;if(/ $/.test(k)){var i2=document.getElementById('aiq');i2.value=k;i2.focus()}else send(k)}
  else if(a==='aiClear'){S.chat=[];persist();render()}
  else if(a==='aiKeySave'){var v=(document.getElementById('aikey').value||'').trim();if(/^sk-ant-/.test(v)){try{localStorage.setItem(KK,v)}catch(x){}flash('המפתח נשמר ✓');render()}else flash('המפתח צריך להתחיל ב־sk-ant-')}
  else if(a==='aiKeyDel'){try{localStorage.removeItem(KK)}catch(x){}flash('המפתח נמחק');render()}
});
render();
})();
