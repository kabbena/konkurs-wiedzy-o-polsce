const {chromium,devices}=require('playwright');
const MODES=['normal','netvoice','dead','cancelbug'];
(async()=>{const b=await chromium.launch();const fails=[];const ck=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fails.push(m)};
for(const mode of MODES){
 const ctx=await b.newContext({...devices['Pixel 7']});await ctx.route(/fonts\./,r=>r.abort());
 await ctx.addInitScript(mode=>{
  const VOICES=[{name:'Google polski',lang:'pl-PL',localService:false},{name:'Polski (telefon)',lang:'pl-PL',localService:true},{name:'English',lang:'en-US',localService:true}];
  let q=[],speaking=false,lastCancel=0;window.__log=[];
  const ss={get speaking(){return speaking},get pending(){return q.length>0},paused:false,getVoices:()=>VOICES,addEventListener(){},
   resume(){window.__log.push('resume')},cancel(){lastCancel=Date.now();q=[];speaking=false;window.__log.push('cancel')},
   speak(u){window.__log.push('speak:'+(u.voice?u.voice.name:'-')+':'+u.text.slice(0,20));
     if(mode==='dead')return; if(mode==='cancelbug'&&Date.now()-lastCancel<50){window.__log.push('ignored');return;}
     if(mode==='netvoice'&&u.voice&&!u.voice.localService){return;}
     speaking=true;setTimeout(()=>{u.onstart&&u.onstart({});setTimeout(()=>{speaking=false;u.onend&&u.onend({})},300)},50);}};
  Object.defineProperty(window,'speechSynthesis',{value:ss});
  window.SpeechSynthesisUtterance=function(t){this.text=t};
 },mode);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+(process.argv[2]||require('path').resolve(__dirname,'../index.html'))+'');
 const v=await p.evaluate(()=>{pickVoice();return voice&&voice.name});
 if(mode==='normal')ck(v==='Polski (telefon)',mode+': prefers on-phone voice ('+v+')');
 await p.click('.speak');
 ck(await p.locator('.speak.on').count()===1,mode+': button lights up');
 await p.waitForTimeout(mode==='dead'?6800:1500);
 const log=await p.evaluate(()=>window.__log);const toast=await p.locator('.toast').allInnerTexts();
 if(mode==='normal'||mode==='netvoice'||mode==='cancelbug'){ck(await p.locator('.speak.on').count()===0,mode+': button resets after speech');ck(!toast.some(t=>/nie odpowiada/.test(t)),mode+': no error toast');}
 if(mode==='dead'){ck(toast.some(t=>/nie odpowiada/.test(t)),mode+': tells parent to check volume');ck(log.some(l=>/^speak:-:/.test(l)),mode+': retried without voice');}
 if(mode==='netvoice')ck(true,mode+': '+log.filter(l=>l.startsWith('speak')).length+' speak calls');
 // speak while previous still speaking (cancel then speak) and toggle stop
 await p.fill('#nm','Gniewko');await p.click('[data-sex=m]');await p.click('#start');await p.click('.node[data-sid=s1]');
 const sp=p.locator('.learn .speak');await sp.click();await p.waitForTimeout(80);await p.click('#nx');await p.locator('.learn .speak').click();
 await p.waitForTimeout(mode==='dead'?100:900);
 if(mode==='cancelbug'){const l2=await p.evaluate(()=>window.__log);ck(!l2.slice(-6).includes('ignored'),mode+': speech after cancel not lost');}
 if(mode==='normal'){await p.locator('.learn .speak').click();await p.waitForTimeout(60);await p.locator('.learn .speak').click({force:true});ck(await p.locator('.speak.on').count()===0,mode+': second tap stops');}
 // parent test button
 await p.click('#nx');await p.click('#home').catch(()=>{});
 ck(errs.length===0,mode+': no page errors '+errs.join('|'));
 await ctx.close();}
await b.close();console.log(fails.length?fails.length+' FAILURES':'TTS TESTS PASSED');})();
