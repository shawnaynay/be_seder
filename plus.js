/* הסדר שלי · תוספות: עריכה, תוכן, שת״פים, פוקוס יומי, מסך פתיחה */
(function(){
var STG=['רעיון','תסריט','צילום','עריכה','מוכן','פורסם'];
var PLT=['רילס','טיקטוק','סטורי','פוסט','יוטיוב','שורטס'];
var DST=['פנייה','מו״מ','סגור','בוצע','שולם'];
var TKC=['מוזיקה','תוכן','עבודה','בית','אישי'],IDC=['רילס','סט','טראק','עסקים','אחר'];
var nf=function(n){return Math.round(n).toLocaleString('he-IL')+' ₪'};
function L(k){if(!S[k])S[k]=[];return S[k]}
function find(k,id){return L(k).filter(function(x){return x.i===id})[0]}
function opt(a,v){return a.map(function(o){return '<option'+(o===v?' selected':'')+'>'+o+'</option>'}).join('')}
function ed(k,id){return ' data-a="edit" data-k="'+k+'" data-id="'+id+'" role="button" tabindex="0" style="cursor:pointer"'}
function weekStart(){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return dstr(d)}
function addDays(s,n){var d=new Date(s+'T00:00');d.setDate(d.getDate()+n);return dstr(d)}

/* ---------- סגנון ---------- */
var css=document.createElement('style');css.textContent=
'.ov{position:fixed;inset:0;background:rgba(5,3,15,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:40;display:flex;align-items:flex-end;justify-content:center}'+
'.sheet{width:min(620px,100%);max-height:88vh;overflow:auto;background:var(--bg2);border:1px solid var(--ln);border-radius:26px 26px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -20px 50px -20px rgba(0,0,0,.6)}'+
'.sheet h3{margin:4px 4px 12px;font-size:1.2rem;font-weight:800}.sheet label{display:block;font-size:.8rem;color:var(--mu);margin:10px 4px 4px}'+
'.sheet input,.sheet select,.sheet textarea{width:100%;font:inherit;font-size:16px;color:var(--ink);background:var(--field);border:1px solid var(--ln);border-radius:14px;padding:10px 12px;min-height:46px}'+
'.sheet textarea{min-height:80px;resize:vertical}.sheet .r2{display:flex;gap:8px}.sheet .r2>div{flex:1}'+
'.sheet .btns{display:flex;gap:8px;margin-top:16px}.sheet .btns .go{flex:1}.go.del{background:transparent;color:var(--hot);box-shadow:none;border:1px solid var(--ln)}'+
'.stg{font-size:.72rem;padding:2px 9px;border-radius:99px;background:var(--acs);color:var(--ac);font-weight:700;white-space:nowrap}'+
'.stg.s5{background:rgba(95,224,176,.15);color:var(--ok)}.stg.s4{background:rgba(255,197,107,.16);color:var(--gold)}'+
'.star{border:0;background:none;font-size:1.05rem;cursor:pointer;min-width:30px;min-height:30px;opacity:.35;filter:grayscale(1)}.star.on{opacity:1;filter:none}'+
'.nx{border:0;background:var(--acs);color:var(--ac);font:inherit;font-size:.75rem;font-weight:700;border-radius:10px;padding:5px 9px;cursor:pointer;white-space:nowrap}';
document.head.appendChild(css);

/* ---------- שורות עם עריכה ---------- */
window.evRow=function(e){return '<li class="row"><span class="time">'+(e.tm||'כל היום')+'</span><span class="tx"'+ed('ev',e.i)+'>'+esc(e.t)+'</span>'+cb('ev',e.i)+xb('ev',e.i)+'</li>'};
window.tkRow=function(t){return '<li class="row'+(t.d?' done':'')+'"><button class="ck" aria-label="סימון" data-a="tog" data-k="tk" data-id="'+t.i+'">'+(t.d?'✓':'')+'</button><span class="tx"'+ed('tk',t.i)+'>'+esc(t.t)+'</span>'+(t.d?'':'<button class="star'+(t.f?' on':'')+'" aria-label="פוקוס להיום" data-a="star" data-id="'+t.i+'">⭐</button>')+'<span class="tag">'+esc(t.g)+'</span>'+xb('tk',t.i)+'</li>'};
window.rmRow=function(r){var late=!r.d&&r.at<=nowL();return '<li class="row'+(r.d?' done':'')+(late?' late':'')+'"><button class="ck" aria-label="סימון" data-a="rmtog" data-id="'+r.i+'">'+(r.d?'✓':'')+'</button><span class="tx"'+ed('rm',r.i)+'>'+esc(r.t)+'<small class="time" style="color:inherit;opacity:.85">'+fdt(r.at)+(r.rep?' · 🔁 '+REP[r.rep]:'')+'</small></span>'+cb('rm',r.i)+xb('rm',r.i)+'</li>'};
function idRow(x){return '<li class="row" style="align-items:flex-start"><span class="tx"'+ed('id',x.i)+'>'+esc(x.t).replace(/\n/g,'<br>')+'</span>'+(x.g?'<span class="tag">'+esc(x.g)+'</span>':'')+'<button class="nx" data-a="toCt" data-id="'+x.i+'">להפקה ←</button>'+xb('id',x.i)+'</li>'}
function ctRow(c){var si=STG.indexOf(c.st);return '<li class="row"><span class="tx"'+ed('ct',c.i)+'><b style="font-weight:500">'+esc(c.t)+'</b><small>'+esc(c.pl)+(c.dt?' · '+fd(c.dt)+(c.tm?' '+c.tm:''):' · בלי תאריך')+'</small></span><span class="stg s'+si+'">'+esc(c.st)+'</span>'+(si<5?'<button class="nx" data-a="ctNext" data-id="'+c.i+'" aria-label="לשלב הבא">'+STG[si+1]+' ←</button>':'')+'</li>'}
function dlRow(d){var late=d.due&&d.due<today()&&d.st!=='שולם';return '<li class="row'+(late?' late':'')+'"><span class="time"'+(d.st==='שולם'?' style="color:var(--ok)"':'')+'>'+nf(d.a||0)+'</span><span class="tx"'+ed('dl',d.i)+'>'+esc(d.t)+'<small>'+esc(d.st)+(d.due?' · '+(d.st==='שולם'?'':'תשלום עד ')+fd(d.due):'')+'</small></span><span class="stg'+(d.st==='שולם'?' s5':d.st==='בוצע'?' s4':'')+'">'+esc(d.st)+'</span></li>'}

/* ---------- חלון עריכה ---------- */
var cur=null;
function F(lb,html){return '<label>'+lb+'</label>'+html}
function inp(id,v,t){return '<input id="'+id+'" type="'+(t||'text')+'" value="'+esc(v||'')+'"'+(t==='number'?' inputmode="decimal"':'')+'>'}
function sel(id,a,v){return '<select id="'+id+'">'+opt(a,v)+'</select>'}
function ta(id,v,ph){return '<textarea id="'+id+'" placeholder="'+(ph||'')+'">'+esc(v||'')+'</textarea>'}
function openEdit(k,id){
  var x=id?find(k,id):null,isNew=!x,h='';
  if(isNew){x={i:uid()};if(k==='ct'){x.st='רעיון';x.pl='רילס'}if(k==='dl'){x.st='פנייה'}}
  cur={k:k,x:x,isNew:isNew};
  var T={ev:'אירוע בלוז',tk:'משימה',id:'רעיון',rm:'תזכורת',ct:'תוכן',dl:'שת״פ / עבודה'}[k];
  if(k==='ev')h=F('מה קורה',inp('f_t',x.t))+'<div class="r2"><div>'+F('תאריך',inp('f_d',x.dt||today(),'date'))+'</div><div>'+F('שעה',inp('f_tm',x.tm,'time'))+'</div></div>';
  if(k==='tk')h=F('מה צריך לעשות',inp('f_t',x.t))+F('קטגוריה',sel('f_g',TKC,x.g||'אישי'));
  if(k==='id')h=F('הרעיון',ta('f_t',x.t))+F('סוג',sel('f_g',IDC,x.g||'אחר'));
  if(k==='rm')h=F('על מה להזכיר',inp('f_t',x.t))+F('מתי',inp('f_at',(x.at||nowL()).slice(0,16),'datetime-local'))+F('חזרה',sel('f_rep',['פעם אחת','כל יום','כל שבוע','כל חודש'],REP[x.rep||'']));
  if(k==='ct')h=F('שם / נושא',inp('f_t',x.t))+'<div class="r2"><div>'+F('פלטפורמה',sel('f_pl',PLT,x.pl))+'</div><div>'+F('שלב',sel('f_st',STG,x.st))+'</div></div>'+
    '<div class="r2"><div>'+F('תאריך פרסום',inp('f_d',x.dt,'date'))+'</div><div>'+F('שעה',inp('f_tm',x.tm,'time'))+'</div></div>'+
    F('הוק (3 השניות הראשונות)',ta('f_hook',x.hook,'מה יעצור את הגלילה?'))+F('כיתוב והאשטאגים',ta('f_cap',x.cap,'הכיתוב שיעלה עם הפוסט'))+F('הערות / שוט ליסט',ta('f_n',x.n,'לוקיישן, שוטים, סאונד, מי מצלם…'))+
    (x.cap?'<button class="go soft" style="margin-top:10px;width:100%" data-a="copyCap">העתקת הכיתוב</button>':'')+
    (x.dt?'<button class="go soft" style="margin-top:8px;width:100%" data-a="ctCal">📲 תזכורת פרסום ביומן הטלפון</button>':'');
  if(k==='dl')h=F('עם מי / מה',inp('f_t',x.t))+'<div class="r2"><div>'+F('סכום (₪)',inp('f_a',x.a,'number'))+'</div><div>'+F('סטטוס',sel('f_st',DST,x.st))+'</div></div>'+F('תאריך תשלום צפוי',inp('f_due',x.due,'date'))+F('הערות (מה סוכם, איש קשר, חשבונית)',ta('f_n',x.n));
  var ov=document.createElement('div');ov.className='ov';ov.id='ov';
  ov.innerHTML='<div class="sheet" role="dialog" aria-label="'+T+'"><h3>'+(isNew?'חדש: ':'עריכת ')+T+'</h3>'+h+'<div class="btns"><button class="go" data-a="edSave">שמירה</button>'+(isNew?'':'<button class="go del" data-a="edDel">מחיקה</button>')+'<button class="go soft" data-a="edClose">ביטול</button></div></div>';
  document.body.appendChild(ov);
  var f=document.getElementById('f_t');if(f&&isNew)setTimeout(function(){f.focus()},50);
}
function closeEdit(){var o=document.getElementById('ov');if(o)o.remove();cur=null}
function v(id){var e=document.getElementById(id);return e?e.value.trim():''}
function saveEdit(){
  var k=cur.k,x=cur.x,t=v('f_t');if(!t){flash('חסר טקסט');return}
  x.t=t;
  if(k==='ev'){x.dt=v('f_d')||today();x.tm=v('f_tm')}
  if(k==='tk'){x.g=v('f_g');if(x.d==null)x.d=false}
  if(k==='id'){x.g=v('f_g')}
  if(k==='rm'){var at=v('f_at');if(!at){flash('חסר מועד');return}if(at!==x.at)x.n=0;x.at=at.slice(0,16);var rv=v('f_rep');x.rep={'פעם אחת':'','כל יום':'d','כל שבוע':'w','כל חודש':'m'}[rv]||'';if(x.d==null)x.d=false}
  if(k==='ct'){x.pl=v('f_pl');setStage(x,v('f_st'));x.dt=v('f_d');x.tm=v('f_tm');x.hook=v('f_hook');x.cap=v('f_cap');x.n=v('f_n')}
  if(k==='dl'){x.a=parseFloat(v('f_a'))||0;x.due=v('f_due');x.n=v('f_n');setDeal(x,v('f_st'))}
  if(cur.isNew)L(k).unshift(x);
  closeEdit();save();flash('נשמר ✓');
}
function setStage(c,st){c.st=st;if(st==='פורסם'&&!c.pub)c.pub=today();if(st!=='פורסם')c.pub=''}
function setDeal(d,st){d.st=st;if(st==='שולם'&&!d.inc&&d.a>0){S.inc.unshift({i:uid(),t:d.t,a:d.a,dt:today(),g:/תוכן|רילס|ממומן|קמפיין/.test(d.t)?'תוכן ממומן':'גיג'});d.inc=1;setTimeout(function(){flash('נרשם גם בהכנסות ✓')},900)}}

/* ---------- מסך תוכן ---------- */
var cv='pipe';
function weekly(){var ws=weekStart();return L('ct').filter(function(c){return c.st==='פורסם'&&c.pub&&c.pub>=ws}).length}
window.vId=function(){
  var goal=+S.goal||3,w=weekly(),pct=Math.min(100,Math.round(w/goal*100));
  var seg='<div class="add" style="padding:8px"><div class="seg">'+[['pipe','🎬 בהפקה'],['ideas','💡 רעיונות'],['pub','✅ פורסם']].map(function(s){return '<button class="'+(cv===s[0]?'on':'')+'" data-a="cv" data-k="'+s[0]+'">'+s[1]+'</button>'}).join('')+'</div></div>';
  var h='<h1>תוכן</h1><p class="sub">מרעיון ועד פרסום, בלי לאבד כלום</p>'+
    '<div class="hero" style="padding:16px 20px"><div class="lb">היעד השבועי</div><div class="big">'+w+' מתוך '+goal+' פרסומים</div><div class="bar" style="background:rgba(255,255,255,.25);margin-top:8px"><i style="width:'+pct+'%;background:#fff"></i></div><div class="when" style="margin-top:6px">'+(w>=goal?'עמדת ביעד השבוע 🔥':'עוד '+(goal-w)+' עד היעד. שבוע מתחיל ביום ראשון.')+'</div></div>'+seg;
  if(cv==='ideas'){
    return h+'<div class="add" style="margin-top:12px"><textarea id="a1" placeholder="רעיון לרילס, לסט, לטראק..."></textarea><select id="a2" aria-label="סוג">'+opt(IDC,'רילס')+'</select><button class="go" data-a="addId">שמירת רעיון</button></div>'+
      '<h2>הרעיונות שלי · לחיצה לעריכה</h2>'+card(L('id').map(idRow),'עדיין אין רעיונות.');
  }
  if(cv==='pub'){
    var p=L('ct').filter(function(c){return c.st==='פורסם'}).sort(function(a,b){return (b.pub||'').localeCompare(a.pub||'')}).slice(0,40);
    return h+'<h2>פורסמו</h2>'+card(p.map(function(c){return '<li class="row"><span class="tx"'+ed('ct',c.i)+'>'+esc(c.t)+'<small>'+esc(c.pl)+' · '+(c.pub?fd(c.pub):'')+'</small></span><span class="stg s5">פורסם</span></li>'}),'עוד לא סימנת פרסומים.');
  }
  var act=L('ct').filter(function(c){return c.st!=='פורסם'}).sort(function(a,b){return (a.dt||'9999').localeCompare(b.dt||'9999')||STG.indexOf(b.st)-STG.indexOf(a.st)});
  var t=today(),wk=addDays(t,7),soon=act.filter(function(c){return c.dt&&c.dt<=wk}),later=act.filter(function(c){return !(c.dt&&c.dt<=wk)});
  return h+'<div class="add" style="margin-top:12px"><input type="text" id="c1" placeholder="על מה התוכן הבא?"><select id="c2" aria-label="פלטפורמה">'+opt(PLT,'רילס')+'</select><input type="date" id="c3" aria-label="תאריך פרסום"><button class="go" data-a="addCt">הוספה להפקה</button></div>'+
    '<h2>מתוכנן לשבוע הקרוב</h2>'+card(soon.map(ctRow),'אין משהו מתוזמן לשבוע הקרוב.')+
    '<h2>בתהליך</h2>'+card(later.map(ctRow),'אין תוכן בתהליך. אפשר להעביר רעיון להפקה.')+
    '<p class="note">לחיצה על פריט פותחת אותו: הוק, כיתוב, שוט ליסט ותזכורת פרסום. הכפתור בצד מקדם לשלב הבא.</p>';
};

/* ---------- שת״פים ---------- */
window.XV=window.XV||{};
XV.deal=function(){
  var d=L('dl'),open=d.filter(function(x){return x.st==='סגור'||x.st==='בוצע'}),owed=0,paidM=0,ym=today().slice(0,7);
  d.forEach(function(x){if(x.st==='בוצע'||x.st==='סגור')owed+=x.a||0;if(x.st==='שולם'&&x.due&&x.due.slice(0,7)===ym)paidM+=x.a||0});
  var grp=function(sts){return d.filter(function(x){return sts.indexOf(x.st)>=0}).sort(function(a,b){return (a.due||'9').localeCompare(b.due||'9')}).map(dlRow)};
  return back()+'<h1>שת״פים ועבודות</h1><p class="sub">גיגים, תוכן ממומן ומי חייב לך כסף</p>'+
  '<div class="stats"><div class="stat"><b style="color:var(--gold)">'+nf(owed)+'</b><span>סגור ועוד לא שולם</span></div><div class="stat"><b>'+open.length+'</b><span>עבודות פתוחות</span></div></div>'+
  '<button class="go" style="width:100%" data-a="new" data-k="dl">+ שת״פ או עבודה חדשה</button>'+
  '<h2>מחכה לתשלום</h2>'+card(grp(['בוצע']),'אין חובות פתוחים 👌')+
  '<h2>סגור, לפני ביצוע</h2>'+card(grp(['סגור']),'אין.')+
  '<h2>בשיחות</h2>'+card(grp(['פנייה','מו״מ']),'אין פניות פתוחות.')+
  '<h2>שולם</h2>'+card(grp(['שולם']).slice(0,20),'עוד אין.')+
  '<p class="note">כשמסמנים ״שולם״, הסכום נרשם אוטומטית גם בהכנסות. כדאי לסגור תנאים בכתב ולהוציא קבלה על כל תשלום.</p>';
};
SUB.deal=1;

/* ---------- היום: פוקוס, תוכן, כסף שמחכה ---------- */
var _vToday=window.vToday;
window.vToday=function(){
  var html=_vToday(),t=today(),wk=addDays(t,7);
  var fo=S.tk.filter(function(x){return x.f&&!x.d});
  var posts=L('ct').filter(function(c){return c.st!=='פורסם'&&c.dt&&c.dt<=wk}).sort(function(a,b){return (a.dt+(a.tm||'')).localeCompare(b.dt+(b.tm||''))});
  var owed=L('dl').filter(function(x){return x.st==='בוצע'}),ow=owed.reduce(function(s,x){return s+(x.a||0)},0);
  var add='<h2>⭐ הפוקוס של היום</h2>'+card(fo.map(tkRow),'סמן ⭐ על עד 3 משימות חשובות, והן יופיעו כאן.')+
    (posts.length?'<h2>🎬 לפרסם בשבוע הקרוב</h2>'+card(posts.slice(0,4).map(ctRow),''):'')+
    (ow?'<div class="tip" data-a="tab" data-k="deal" role="button" style="cursor:pointer;margin-top:14px"><b>💸 מחכים לך '+nf(ow)+'</b> מ־'+owed.length+' עבודות שבוצעו ועוד לא שולמו ←</div>':'');
  var mk='<h2>זריקה מהירה</h2>';
  return html.indexOf(mk)>=0?html.replace(mk,add+mk):html+add;
};
var _vMore=window.vMore;
window.vMore=function(){
  return _vMore().replace('<div class="card menu"><ul>','<div class="card menu"><ul><li class="row" data-a="tab" data-k="deal" role="button" tabindex="0"><span class="ic">🤝</span><span class="tx"><b>שת״פים ועבודות</b><small>גיגים, תוכן ממומן ותשלומים</small></span><span class="chev">‹</span></li>');
};
var _vSet=window.vSet;
window.vSet=function(){
  var st=S.start||'today';
  return _vSet()+'<h2>גישה מהירה</h2><div class="add"><label style="flex:1 1 100%;font-size:.85rem;color:var(--mu)">האפליקציה נפתחת ישר ל:</label><select id="startScr" class="full">'+[['today','היום'],['ai','העוזר ✨'],['id','תוכן'],['tk','משימות'],['rm','תזכורות']].map(function(o){return '<option value="'+o[0]+'"'+(o[0]===st?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>'+
  '<label style="flex:1 1 100%;font-size:.85rem;color:var(--mu)">יעד פרסומים בשבוע:</label><input id="goal" type="number" inputmode="numeric" class="full" value="'+(+S.goal||3)+'"></div>'+
  '<div class="tip"><b>שיהיה תמיד ביד:</b> גרור את האייקון לשורה התחתונה (Dock) כדי שיופיע בכל מסך. אפשר גם להחליק למטה במסך הבית ולכתוב ״הסדר״ בחיפוש. מספר התזכורות שהגיע זמנן יופיע על האייקון, אם תאשר התראות במסך התזכורות.</div>';
};

/* ---------- לחיצות ---------- */
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,k=b.dataset.k,id=b.dataset.id;
  if(a==='edit'){openEdit(k,id)}
  else if(a==='new'){openEdit(k,null)}
  else if(a==='edSave'){saveEdit()}
  else if(a==='edDel'){var kk=cur.k;S[kk]=L(kk).filter(function(x){return x.i!==cur.x.i});closeEdit();save();flash('נמחק')}
  else if(a==='edClose'){closeEdit()}
  else if(a==='star'){var t=find('tk',id);if(t){if(!t.f&&S.tk.filter(function(x){return x.f&&!x.d}).length>=3){flash('עד 3 משימות בפוקוס, כדי שזה יהיה פוקוס');return}t.f=!t.f;save()}}
  else if(a==='cv'){cv=k;render()}
  else if(a==='addCt'){var t1=(document.getElementById('c1').value||'').trim();if(!t1)return flash('על מה התוכן?');L('ct').unshift({i:uid(),t:t1,pl:document.getElementById('c2').value,st:'רעיון',dt:document.getElementById('c3').value||''});save();flash('נוסף להפקה ✓')}
  else if(a==='ctNext'){var c=find('ct',id);if(c){var si=STG.indexOf(c.st);setStage(c,STG[Math.min(5,si+1)]);save();flash(c.st==='פורסם'?'פורסם! 🔥':'עבר ל'+c.st)}}
  else if(a==='toCt'){var x=find('id',id);if(x){var nc={i:uid(),t:x.t.split('\n')[0].slice(0,80),pl:'רילס',st:'רעיון',dt:'',n:x.t};L('ct').unshift(nc);S.id=L('id').filter(function(y){return y.i!==id});cv='pipe';save();flash('הרעיון עבר להפקה ✓')}}
  else if(a==='copyCap'){var cap=document.getElementById('f_cap').value;try{navigator.clipboard.writeText(cap).then(function(){flash('הכיתוב הועתק ✓')},function(){flash('ההעתקה לא עבדה')})}catch(x){flash('ההעתקה לא עבדה')}}
  else if(a==='ctCal'){var cx=cur&&cur.x;if(cx&&cx.dt)giveFile('post.ics',ics('לפרסם: '+cx.t+' ('+cx.pl+')',cx.dt+'T'+(cx.tm||'18:00'),false,'',30),'text/calendar')}
  else if(a==='ov'){}
});
document.addEventListener('click',function(e){if(e.target.id==='ov')closeEdit()});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape')closeEdit();
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-a=edit]')){e.preventDefault();e.target.click()}
});
document.addEventListener('change',function(e){
  if(e.target.id==='startScr'){S.start=e.target.value;persist();flash('נשמר ✓')}
  if(e.target.id==='goal'){S.goal=Math.max(1,parseInt(e.target.value,10)||3);persist()}
});

/* ---------- ניווט ופתיחה ---------- */
TABS[3]=['id','🎬','תוכן'];
if(!location.hash&&S.start&&S.start!=='today'&&(TABS.some(function(t){return t[0]===S.start})||SUB[S.start]))tab=S.start;
render();
})();
