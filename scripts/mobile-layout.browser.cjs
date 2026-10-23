'use strict';
// Synthetic inputs only. No camera, clipboard, permissions, or external upload.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const cfg={"slug": "optical-file-camera", "bp": 540, "nav": null, "help": "#helpButton", "lang": "#languageButton", "close": "#closeHelpButton", "badge": "[data-i18n=\"localBadge\"]", "hideBadge": false, "selfExtract": true};
const evidence=path.resolve('test-results/mobile-layout');
async function bounds(locator,width,height,label,vertical=true){const r=await locator.boundingBox();assert.ok(r&&r.x>=-1&&r.x+r.width<=width+1&&(!vertical||(r.y>=-1&&r.y+r.height<=height+1)),label+': bounds '+JSON.stringify(r));}
async function main(){fs.mkdirSync(evidence,{recursive:true});const browser=await chromium.launch();try{
const cases=[];for(const language of ['ja','en'])for(const [width,height]of [[1360,900],[cfg.bp+1,568],[cfg.bp,568],[320,568],[393,252]])cases.push({file:'dist/index.html',language,width,height});
if(cfg.selfExtract)cases.push({file:'dist/index.self-extract.html',language:'en',width:360,height:640});cases.push({file:cfg.slug+'.html',language:'ja',width:1360,height:900});
for(const {file,language,width,height}of cases){const context=await browser.newContext({viewport:{width,height},locale:language,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],requests=[],label=`${file} ${language} ${width}x${height}`;
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
try{await page.goto(pathToFileURL(path.resolve(file)).href);await page.locator(cfg.help).waitFor();

if(await page.locator('html').getAttribute('lang')!==language)await page.locator(cfg.lang).click();
assert.equal((await page.locator(cfg.badge).textContent()).trim(),language==='ja'?'完全ローカル処理':'Fully local processing');
assert.equal(await page.locator('.local-badge').isVisible(),cfg.hideBadge?width>cfg.bp:true,label+': existing badge visibility');if(await page.locator('.local-badge').isVisible())await bounds(page.locator('.local-badge'),width,height,label,false);
assert.equal(await page.locator('body > footer').isVisible(),width>cfg.bp,label+': informational footer');
await page.locator('#sourceInput').setInputFiles({name:'synthetic.txt',mimeType:'text/plain',buffer:Buffer.from('Synthetic QR transfer fixture.\n')});await page.waitForFunction(()=>!document.querySelector('#generateButton').disabled);assert.equal(await page.locator('#sourceFileName').textContent(),'synthetic.txt');
if(cfg.nav){assert.equal(await page.locator(cfg.nav).isVisible(),width<=cfg.bp,label+': functional navigation');if(width<=cfg.bp)await bounds(page.locator(cfg.nav),width,height,label);}
for(const w of [cfg.bp+1,cfg.bp,width]){await page.setViewportSize({width:w,height});assert.equal(await page.locator('body > footer').isVisible(),w>cfg.bp,label+': footer resize');}
await page.evaluate(()=>scrollTo({left:0,top:0,behavior:'instant'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+': page width');if(cfg.nav&&width<=cfg.bp)await bounds(page.locator(cfg.nav),width,height,label);
await page.locator(cfg.help).click();const body=page.locator('#helpDialog .dialog-body');

await body.evaluate(e=>{e.scrollTop=e.scrollHeight;});const last=await body.locator(':scope > :last-child').evaluate(el=>{const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node,last;while(node=walker.nextNode())if(node.textContent.trim())last=node;if(!last)throw Error('No final Help text');const range=document.createRange();range.setStart(last,last.textContent.trimEnd().length-1);range.setEnd(last,last.textContent.trimEnd().length);const r=range.getBoundingClientRect();let top=0,bottom=innerHeight;for(let p=el.parentElement;p;p=p.parentElement)if(/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowY)){const b=p.getBoundingClientRect();top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}return{top:r.top,bottom:r.bottom,clipTop:top,clipBottom:bottom};});
assert.ok(last.top>=last.clipTop-1&&last.bottom<=last.clipBottom+1,label+': actual Help final character '+JSON.stringify(last));assert.ok(await body.evaluate(e=>e.scrollWidth<=e.clientWidth+1),label+': Help width');await bounds(page.locator('#helpDialog .dialog-header'),width,height,label);
if(file==='dist/index.html'&&[1360,320].includes(width))await page.screenshot({path:path.join(evidence,`${language}-${width}.png`)});
const box=await page.locator('#helpDialog').boundingBox(),point=[[1,1],[width-1,1],[1,height-1],[width-1,height-1]].find(([x,y])=>x<box.x||x>box.x+box.width||y<box.y||y>box.y+box.height);assert.ok(point,label+': genuine backdrop');const y=await page.evaluate(()=>scrollY);await page.mouse.move(...point);await page.mouse.wheel(0,400);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>scrollY),y,label+': background locked');
await page.keyboard.press('Escape');assert.equal(await page.locator('#helpDialog').isVisible(),false);await page.locator(cfg.lang).click();await page.locator(cfg.lang).click();

await page.locator(cfg.help).click();await page.locator(cfg.close).click();assert.equal(await page.locator('#helpDialog').isVisible(),false);
assert.deepEqual(errors,[],label+': console errors');assert.deepEqual(requests,[],label+': runtime requests');console.log('PASS '+label);
}catch(e){await page.screenshot({path:path.join(evidence,'failure.png')}).catch(()=>{});throw new Error(label+': '+e.message,{cause:e});}finally{await context.close();}}
}finally{await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
