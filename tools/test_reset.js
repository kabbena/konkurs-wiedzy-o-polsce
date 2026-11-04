const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const fails=[];const ck=(c,m)=>{if(!c){fails.push(m);console.log('FAIL',m)}};
for(const dev of ['iPhone SE','Pixel 7']){
const ctx=await b.newContext({...devices[dev]});await ctx.route(/fonts\./,r=>r.abort());const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+(process.argv[2]||require('path').resolve(__dirname,'../index.html'))+'');await p.fill('#nm','Gniewko');await p.click('[data-sex=m]');await p.click('#start');
await p.evaluate(()=>{__T.S.stars=50;__T.S.fins={2:{best:3,done:1,pending:null}};__T.S.st.s1={rounds:2,best:3,known:['s1a'],wrong:[],seen:['s1a'],learned:true,pending:null};});
await p.click('#alb');await p.click('#home');
// cancel path
await p.click('#rst');ck(/Gniewko/.test(await p.locator('.sheet').innerText()),dev+' sheet names child');await p.click('#no');ck(await p.evaluate(()=>__T.S.stars)===50,dev+' cancel keeps');
// wrong answer path
await p.click('#rst');const t=await p.locator('.sheet').innerText();const [x,y]=t.match(/(\d+) × (\d+)/).slice(1).map(Number);
const wrong=await p.locator('.sheet [data-v]').evaluateAll((els,ok)=>els.map(e=>+e.dataset.v).find(v=>v!==ok),x*y);
await p.click(`.sheet [data-v="${wrong}"]`);ck(await p.evaluate(()=>__T.S.stars)===50 && await p.locator('.hello').count()===1,dev+' wrong answer keeps progress');
// correct path
await p.click('#rst');const t2=await p.locator('.sheet').innerText();const [a,c]=t2.match(/(\d+) × (\d+)/).slice(1).map(Number);
await p.click(`.sheet [data-v="${a*c}"]`);
ck(await p.locator('#nm').count()===1 && await p.inputValue('#nm')==='',dev+' back to empty name screen');
ck(await p.evaluate(()=>__T.S.stars===0 && !__T.S.name && Object.keys(__T.S.st).length===0),dev+' state cleared');
await p.reload();ck(await p.locator('#nm').count()===1,dev+' reset persists after reload');
await p.fill('#nm','Zosia');await p.click('[data-sex=f]');await p.click('#start');ck(await p.locator('.hello').innerText()==='Cześć, Zosia!',dev+' new player');
ck(await p.locator('.lvtab.locked').count()===2,dev+' levels locked again');
await p.screenshot({path:'rst_'+dev.replace(' ','')+'.png',fullPage:true});
ck(errs.length===0,dev+' errors '+errs.join('|'));await ctx.close();}
await b.close();console.log(fails.length?fails.length+' FAILURES':'RESET TESTS PASSED');})();
