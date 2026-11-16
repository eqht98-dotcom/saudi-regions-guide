/* ===== Q&A chatbot (offline, from verified table) ===== */
var RD=__RDATA__;
var AL={riyadh:["الرياض","الدرعيه","الخرج","الدوادمي","المجمعه","الزلفي","وادي الدواسر","الفاو"],makkah:["مكه","جده","الطايف","الطائف","القنفذه","رابغ"],east:["الشرقيه","المنطقه الشرقيه","الدمام","الخبر","الظهران","الاحساء","الجبيل","حفر الباطن","القطيف"],medina:["المدينه","المدينه المنوره","العلا","ينبع","الحجر","مداين صالح","مدائن صالح"],asir:["عسير","ابها","خميس مشيط","النماص","رجال المع","السوده"],jazan:["جازان","جيزان","فرسان","صبيا"],qassim:["القصيم","بريده","عنيزه","الرس"],tabuk:["تبوك","نيوم","الديسه","تيماء","املج","الوجه"],hail:["حايل","حائل","جبه"],jouf:["الجوف","سكاكا","دومه الجندل","القريات"],najran:["نجران","شروره","الاخدود"],north:["الحدود الشماليه","الشماليه","عرعر","رفحاء","طريف"],baha:["الباحه","بلجرشي","المندق"]};
function nz(s){return(" "+s+" ").replace(/[ً-ْـٰ]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/[؟?!.,،:؛]/g," ").replace(/\s+/g," ")}
var AL2=[];Object.keys(AL).forEach(function(k){AL[k].concat([nz(RD[k].name).trim()]).forEach(function(a){AL2.push([nz(a).trim(),k])})});AL2.sort(function(a,b){return b[0].length-a[0].length});
function findR(q){for(var i=0;i<AL2.length;i++){var a=AL2[i][0];if(q.indexOf(" "+a+" ")>-1||q.indexOf(" ب"+a+" ")>-1||q.indexOf(" ل"+a+" ")>-1||q.indexOf(" و"+a+" ")>-1||q.indexOf(" في"+a+" ")>-1)return AL2[i][1]}return null}
var IN=[["emir",["امير","الامير","مين يحكم","حاكم","يحكمها"]],["pop",["سكان","سكانها","نسمه","تعداد","كم شخص","كم واحد"]],["area",["مساحه","مساحتها","كم كيلو","كم كم"]],["cap",["عاصمه","عاصمتها","مقر الاماره"]],["food",["اكل","اكلات","اكلاتها","الاكل","طبخ","مطبخ","ماكولات","اطباق","وش ياكلون"]],["unesco",["يونسكو","اليونسكو","تراث عالمي","التراث العالمي"]],["proj",["مشاريع","مشروع","انجاز","انجازات","انجازاتها","رويه 2030","رويه"]],["places",["اماكن","معالم","سياحه","سياحيه","ازور","وش فيها","زياره","وين اروح"]],["fact",["هل تعلم","معلومه","حقيقه","شي غريب"]]];
function intent(q){for(var i=0;i<IN.length;i++)for(var j=0;j<IN[i][1].length;j++)if(q.indexOf(nz(IN[i][1][j]).trim())>-1)return IN[i][0];return null}
function fmt(n){return n.toLocaleString("en-US")}
function short(k){return RD[k].name.replace(/^(ال)?منطقه? /,"").replace(/^منطقة /,"")}
function list(a){return a.length>1?a.slice(0,-1).join("، ")+"، و"+a[a.length-1]:a[0]}
function ans(k,it){var r=RD[k],n="<b>"+r.name+"</b>";
switch(it){
case"emir":return"أمير "+n+" هو صاحب السمو "+r.emir+".";
case"pop":return"عدد سكان "+n+" "+fmt(r.population_2022)+" نسمة، حسب تعداد السعودية 2022.";
case"area":return"مساحة "+n+" حوالي "+fmt(Math.round(r.area_km2/1000)*1000)+" كيلومتر مربع.";
case"cap":return"عاصمة "+n+" هي "+r.capital+".";
case"food":return"من أشهر أكلات "+n+": "+list(r.foods)+".";
case"places":return"من أشهر الأماكن في "+n+": "+list(r.landmarks)+".";
case"unesco":var u=r.unesco.concat(r.unesco_i.map(function(x){return x+"، في قائمة التراث غير المادي"}));return u.length?"في "+n+" من قوائم اليونسكو: "+list(u)+".":"ما فيه موقع من "+n+" في قائمة التراث العالمي لليونسكو حتى الآن.";
case"proj":return r.projects.length?"من أبرز مشاريع وإنجازات "+n+": "+list(r.projects)+".":"ما عندي معلومة موثّقة عن مشاريع "+n+" للحين.";
case"fact":return"هل تعلم؟ "+r.fact;
default:return n+"، وعاصمتها "+r.capital+". أميرها "+r.emir+"، وعدد سكانها "+fmt(r.population_2022)+" نسمة حسب تعداد 2022، ومساحتها حوالي "+fmt(Math.round(r.area_km2/1000)*1000)+" كم². اسألني عن أكلاتها أو أماكنها أو مشاريعها."}}
function rank(q){var big=/(اكبر|اكثر|اعلي|اوسع)/.test(q),small=/(اصغر|اقل)/.test(q);if(!big&&!small)return null;
var f=/(سكان|نسمه|ازدحام)/.test(q)?"population_2022":/(مساحه|حجم|اوسع)/.test(q)?"area_km2":null;if(!f)return null;
var ks=Object.keys(RD).sort(function(a,b){return RD[b][f]-RD[a][f]}),k=big?ks[0]:ks[ks.length-1];
return(big?(f==="area_km2"?"أكبر":"أكثر"):(f==="area_km2"?"أصغر":"أقل"))+" منطقة "+(f==="area_km2"?"مساحةً":"سكاناً")+" هي <b>"+RD[k].name+"</b>، "+(f==="area_km2"?"بمساحة حوالي "+fmt(Math.round(RD[k].area_km2/1000)*1000)+" كم².":"بعدد "+fmt(RD[k].population_2022)+" نسمة حسب تعداد 2022.")}
function reply(raw){var q=nz(raw);
if(/^ (السلام عليكم|سلام|هلا|اهلا|مرحبا|هاي)( .*)? $/.test(q)&&!findR(q)&&!intent(q))return"وعليكم السلام، يا هلا فيك! اسألني عن أي منطقة: أميرها، سكانها، مساحتها، أكلاتها، أماكنها، مشاريعها، أو مواقع اليونسكو فيها.";
if(/(كم عدد المناطق|كم منطقه|عدد مناطق)/.test(q))return"المملكة فيها 13 منطقة إدارية، وعدد سكانها "+fmt(32175224)+" نسمة حسب تعداد 2022.";
if(/(السعوديه|المملكه)/.test(q)&&/(يونسكو|تراث عالمي)/.test(q))return"عند المملكة 8 مواقع في قائمة التراث العالمي لليونسكو: الحِجر، وحي الطريف، وجدة التاريخية، والفنون الصخرية في حائل، وواحة الأحساء، ومنطقة حمى الثقافية، ومحمية عروق بني معارض، ومنطقة الفاو الأثرية.";
var rk=rank(q);if(rk)return rk;
var k=findR(q),it=intent(q);
if(!k&&it&&cur)k=cur;
if(k)return ans(k,it);
if(it)return"عن أي منطقة تسأل؟ اكتب اسمها، مثلاً: "+({emir:"مين أمير حائل؟",pop:"كم سكان الجوف؟",area:"كم مساحة الباحة؟"}[it]||"وش أشهر أكلات عسير؟");
return"ما فهمت سؤالك. جرّب تسألني عن منطقة، مثلاً: «مين أمير تبوك؟» أو «كم سكان القصيم؟» أو «وش أكلات جازان؟» أو «أكبر منطقة مساحة».";}
(function(){var st=document.createElement("style");st.textContent="#ask{padding:12px 12px 14px}#askbox{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:28px;padding:6px 6px 6px 6px;box-shadow:0 2px 12px rgba(0,0,0,.08);transition:box-shadow .2s,border-color .2s}#askbox:focus-within{border-color:rgba(0,0,0,.25);box-shadow:0 4px 18px rgba(0,0,0,.12)}#askq{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#0d0d0d;font:inherit;font-size:16px;padding:10px 14px}#askq::placeholder{color:#8e8e8e}#asks{flex:none;width:38px;height:38px;border-radius:50%;border:0;background:#0d0d0d;color:#fff;display:grid;place-items:center;cursor:pointer;transition:opacity .2s,transform .1s}#asks:disabled{opacity:.25;cursor:default}#asks:active:not(:disabled){transform:scale(.93)}@media (prefers-color-scheme:dark){#askbox{background:#2f2f2f;border-color:rgba(255,255,255,.1)}#askq{color:#ececec}#asks{background:#ececec;color:#0d0d0d}}";document.head.appendChild(st);
var f=document.createElement("form");f.id="ask";f.setAttribute("autocomplete","off");
f.innerHTML='<div id="askbox"><input id="askq" type="text" maxlength="200" dir="auto" placeholder="Ask me" aria-label="Ask me" enterkeyhint="send"><button id="asks" type="submit" aria-label="إرسال" disabled><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></div>';
chips.parentNode.insertBefore(f,chips.nextSibling);
var qi=$("askq"),sb=$("asks");qi.oninput=function(){sb.disabled=!qi.value.trim()};
f.onsubmit=function(e){e.preventDefault();var v=qi.value.trim();if(!v||busy)return;qi.value="";sb.disabled=true;var u=add("","u");u.textContent=v;bot(reply(v),null)}})();
