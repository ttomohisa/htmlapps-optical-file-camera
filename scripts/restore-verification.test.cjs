// Source-level regression tests: synthetic bytes, native crypto/compression, no browser or camera.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto, createHash } = require('node:crypto');
const sourcePath = process.env.OPTICAL_TEST_HTML || path.join(__dirname, '../src/index.template.html');
const source = fs.readFileSync(sourcePath, 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.config.json'), 'utf8'));
function section(a, b) {
  const i = source.indexOf(a), j = source.indexOf(b, i);
  assert(i >= 0 && j > i, `Missing runtime section: ${a}`);
  return source.slice(i, j);
}
const runtime = [
  section('      const MAX_SOURCE_BYTES', '      function decodeBase64Bytes'),
  section(source.includes('      let restoreGeneration') ? '      let restoreGeneration' : '      let restoredBlob', '      const AppConfirm'),
  section('      function updateRestoreControls()', '      function updateVideoCard()'),
  section('      async function selectRestoreVideo(', '      function setPreviewState('),
  section('      function base64UrlEncode(', '      function sleep('),
  section('      function resetRestoreState(', '      function scanImageData('),
  section('      async function verifyRestore()', '      function drawCameraFrame()'),
  section('      function safeFilename(', '      function currentTiles('),
  ...source.split('\n').filter(line => /\$\('#download(?:Restored|Receipt)Button'\)\.addEventListener/.test(line))
].join('\n');
function gate() {
  let enter, finish, fail;
  return { entered: new Promise(r => enter = r), wait: () => { enter(); return new Promise((resolve,reject) => { finish=resolve; fail=reject; }); }, release: () => finish(), reject: () => fail(new Error('Synthetic deferred failure')) };
}
function harness() {
  const elements = new Map(), downloads = [], urls = [], revoked = [];
  const $ = id => {
    if (!elements.has(id)) elements.set(id, {hidden:true, disabled:false, textContent:'',style:{}, scrollIntoView(){},addEventListener(type,callback){this[type]=callback;}});
    return elements.get(id);
  };
  let digestGate = null;
  const context = vm.createContext({ Uint8Array, Blob, Response, TextEncoder, TextDecoder, CompressionStream, DecompressionStream,
    atob, btoa, console, $, APP_CONFIG:config, requestAnimationFrame: cb=>cb(),
    URL:{ createObjectURL(blob){ urls.push(blob); return `blob:synthetic-${urls.length}`; }, revokeObjectURL:url=>revoked.push(url) },
    window:{CompressionStream,DecompressionStream},
    crypto:{subtle:{digest:async (...args)=>{ const result = await webcrypto.subtle.digest(...args); const g=digestGate; if(g){digestGate=null;await g.wait();} return result; }},getRandomValues:a=>webcrypto.getRandomValues(a)},
    language:'en',librariesReady:true,restoreVideoFile:null,restoreVideoUrl:'',cameraRunning:false,scanning:false,scanToken:0,restoreUiPending:false,
    configureScanSpeedOptions(){}, updateVideoCard(){}, setPreviewState(){}, AppConfirm:{ask:async()=>true},showToast(){}, t:x=>x,formatBytes:x=>String(x),downloadBlob:(blob,filename)=>downloads.push({blob,filename}),stopCamera(){throw new Error('Camera must not be used');}
  });
  vm.runInContext(runtime + `\nglobalThis.api={ createMetaPayload,createDataPayload,parsePayload,acceptPayload,crc32,hex8,verifyRestore,resetRestoreState,selectRestoreVideo,gzipBytes,utf8ToBase64Url, base64UrlEncode, state:restoreState, result:()=>typeof verifiedRestore==='undefined'?restoredBlob:verifiedRestore,blob:()=>typeof verifiedRestore==='undefined'?restoredBlob:verifiedRestore?.blob||null};`, context);
  return {api:context.api,$,downloads,urls,revoked,context,
    pauseDigest(){const g=gate();digestGate=g;return g;},
    pauseGunzip(){const g=gate();context.gzipGate=g;vm.runInContext('const nativeGunzip=gunzipBytes; gunzipBytes=async bytes=>{const result=await nativeGunzip(bytes);await gzipGate.wait();return result;};',context);return g;},
    clickOriginal(){ $('#downloadRestoredButton').click(); },
    clickReceipt(){ $('#downloadReceiptButton').click?.(); },
    ui(){return JSON.stringify([...elements].map(([id,e])=>[id,e.hidden,e.disabled,e.textContent,e.style]));}
  };
}
async function transfer(h, bytes, {session='01020304050607',name='synthetic-a.bin',compression='none',hash,chunkSize=200,legacy=false}={}) {
  const transport = compression==='gzip' ? await h.api.gzipBytes(bytes) : bytes;
  const meta={session,name,mime:'application/octet-stream',total:Math.max(1,Math.ceil(transport.length/chunkSize)),chunkSize,tiles:1,fps:6,size:bytes.length,transportSize:transport.length,compression,sha256:hash||createHash('sha256').update(bytes).digest('hex')};
  const text=legacy?['BKOF1','M',session,meta.total,chunkSize,1,6,meta.size,meta.sha256,h.api.utf8ToBase64Url(name),h.api.utf8ToBase64Url(meta.mime),compression,meta.transportSize,'qr',0].join('|'):h.api.createMetaPayload(meta);
  const parsed=h.api.parsePayload(text);assert(parsed);
  const data=Array.from({length:meta.total},(_,i)=>h.api.parsePayload(h.api.createDataPayload(session,i,transport.subarray(i*chunkSize,(i+1)*chunkSize))));
  return {meta:parsed,data,bytes};
}
function accept(h,tr){assert(h.api.acceptPayload(tr.meta));tr.data.forEach(d=>assert(h.api.acceptPayload(d)));}
async function assertBytes(blob,bytes){assert.deepEqual(new Uint8Array(await blob.arrayBuffer()),bytes);}
function assertNoExports(h){const n=h.downloads.length;h.clickOriginal();h.clickReceipt();assert.equal(h.downloads.length,n);assert.equal(h.api.blob(),null);assert.equal(h.$('#restoreResult').hidden,true);}

for(const legacy of [false,true]) for(const compression of ['none','gzip']) test(`protocol control: ${legacy?'legacy':'compact'} / ${compression}, reversed + duplicate blocks`,async()=>{
  const h=harness(),bytes=Uint8Array.from({length:513},(_,i)=>(i*37+11)%256),tr=await transfer(h,bytes,{legacy,compression});
  h.api.acceptPayload(tr.meta);for(const d of [...tr.data].reverse())assert(h.api.acceptPayload(d));assert(h.api.acceptPayload(tr.data[0]));
  assert.equal(h.api.state.accepted,tr.data.length);assert.equal(await h.api.verifyRestore(),true);await assertBytes(h.api.blob(),bytes);
});
for(const size of [0,1024*1024]) test(`source boundary control: ${size} bytes`,async()=>{
  const h=harness(),bytes=new Uint8Array(size).fill(42),tr=await transfer(h,bytes);accept(h,tr);assert(await h.api.verifyRestore());await assertBytes(h.api.blob(),bytes);
});
test('data before metadata remains usable',async()=>{const h=harness(),tr=await transfer(h,Uint8Array.of(1,2,3));tr.data.forEach(h.api.acceptPayload);assert.equal(h.api.state.provisionalChunks.size,1);h.api.acceptPayload(tr.meta);assert(await h.api.verifyRestore());await assertBytes(h.api.blob(),tr.bytes);});
test('CRC mismatch, SHA mismatch, missing block and foreign session cannot export',async()=>{
  for(const kind of ['crc','sha','missing','foreign']){
    const h=harness(),tr=await transfer(h,new Uint8Array(201),kind==='sha'?{hash:'00'.repeat(32)}:{});h.api.acceptPayload(tr.meta);
    for(const d of tr.data){if(kind==='missing'&&d.index===1)continue;h.api.acceptPayload(kind==='crc'?{...d,crc:'00000000'}:kind==='foreign'?{...d,session:'08090A0B0C0D0E'}:d);}
    assert.equal(await h.api.verifyRestore(),false);assertNoExports(h);
  }
});
for(const phase of ['digest','gunzip']) for(const rejected of [false,true]) test(`reset during ${phase}: late ${rejected?'error':'success'} is inert`,async()=>{
  const h=harness(),tr=await transfer(h,new Uint8Array(5000).fill(65),{compression:phase==='gunzip'?'gzip':'none'});accept(h,tr);
  const g=phase==='digest'?h.pauseDigest():h.pauseGunzip(),pending=h.api.verifyRestore();await g.entered;h.api.resetRestoreState(false);
  const ui=h.ui(),urlCount=h.urls.length;rejected?g.reject():g.release();assert.equal(await pending,false);assert.equal(h.ui(),ui);assert.equal(h.urls.length,urlCount);assertNoExports(h);
});
for(const phase of ['digest','gunzip']) for(const rejected of [false,true]) test(`A ${phase} completion after verified B cannot change B (${rejected?'error':'success'})`,async()=>{
  const h=harness(),a=await transfer(h,new Uint8Array(5000).fill(65),{compression:phase==='gunzip'?'gzip':'none'}),b=await transfer(h,Uint8Array.of(66,2,3),{session:'08090A0B0C0D0E',name:'synthetic-b.bin'});accept(h,a);
  const g=phase==='digest'?h.pauseDigest():h.pauseGunzip(),pending=h.api.verifyRestore();await g.entered;h.api.resetRestoreState(false);accept(h,b);assertNoExports(h);assert(await h.api.verifyRestore());
  const ui=h.ui(),result=h.api.result(),urlCount=h.urls.length;rejected?g.reject():g.release();assert.equal(await pending,false);assert.equal(h.ui(),ui);assert.equal(h.urls.length,urlCount);assert.equal(h.api.result(),result);
  h.clickOriginal();assert.equal(h.downloads.at(-1).filename,'synthetic-b.bin');await assertBytes(h.downloads.at(-1).blob,b.bytes);
  h.clickReceipt();assert.equal(JSON.parse(await h.downloads.at(-1).blob.text()).file.sha256,b.meta.sha256);
});
test('stale mismatching hash does not replace current UI',async()=>{
  const h=harness(),a=await transfer(h,Uint8Array.of(1),{hash:'00'.repeat(32)});accept(h,a);const g=h.pauseDigest(),pending=h.api.verifyRestore();await g.entered;h.api.resetRestoreState(false);const ui=h.ui();g.release();assert.equal(await pending,false);assert.equal(h.ui(),ui);assertNoExports(h);
});
test('accepted WebP replacement invalidates pending verification',async()=>{
  const h=harness(),tr=await transfer(h,Uint8Array.of(1,2,3));accept(h,tr);const g=h.pauseDigest(),pending=h.api.verifyRestore();await g.entered;
  assert(await h.api.selectRestoreVideo({name:'replacement.webp',type:'image/webp'}));const ui=h.ui();g.release();assert.equal(await pending,false);assert.equal(h.ui(),ui);assertNoExports(h);
});
test('completed reset clears both exports',async()=>{const h=harness(),tr=await transfer(h,Uint8Array.of(1));accept(h,tr);assert(await h.api.verifyRestore());h.api.resetRestoreState(false);assertNoExports(h);});
test('receipt is deterministic, localized-UI-independent, metadata-only and snapshot-owned',async()=>{
  const h=harness(),tr=await transfer(h,Uint8Array.of(65,0,255,13,10),{name:'a/b:c?.bin'});assertNoExports(h);accept(h,tr);assert(await h.api.verifyRestore());
  assert(Object.isFrozen(h.api.result()));h.api.state.meta.name='WRONG.bin';h.api.state.meta.sha256='00'.repeat(32);
  h.clickOriginal();const original=h.downloads.at(-1);assert.equal(original.filename,'a_b_c_.bin');await assertBytes(original.blob,tr.bytes);
  h.clickReceipt();const first=h.downloads.at(-1);assert.equal(first.filename,'a_b_c_.bin.verification.json');assert.equal(first.blob.type,'application/json');const text=await first.blob.text(),receipt=JSON.parse(text);
  assert.deepEqual(receipt,{schemaVersion:1,app:{name:config.name,version:config.version},file:{name:original.filename,sizeBytes:tr.bytes.length,sha256:createHash('sha256').update(tr.bytes).digest('hex')},verification:{algorithm:'SHA-256',status:'matched'},transport:{compression:'none',sizeBytes:tr.bytes.length,blockCount:1}});
  assert(!text.includes(tr.meta.session));assert(!text.includes('BK2D'));const state=JSON.stringify(h.api.state);h.context.language='ja';h.clickReceipt();assert.equal(await h.downloads.at(-1).blob.text(),text);assert.equal(JSON.stringify(h.api.state),state);
});
test('receipt control is a secondary native button with bilingual metadata/privacy help',()=>{
  assert.match(source,/<button class="button" id="downloadReceiptButton" type="button"[^>]*data-i18n="downloadReceipt"/);
  for(const key of ['downloadReceipt','receiptPrivacy','savedReceipt','helpReceipt']) assert.equal((source.match(new RegExp(`\\b${key}\\s*:`, 'g'))||[]).length,2,`${key} has both translations`);
  assert.match(section('<!-- APP:HELP:BEGIN -->','<!-- APP:HELP:END -->'),/data-i18n="helpReceipt"/);
});

test('legacy BKOF1 data blocks retain CRC and receipt support',async()=>{
  const h=harness(),bytes=Uint8Array.of(0,255,65,13,10),tr=await transfer(h,bytes,{legacy:true});h.api.acceptPayload(tr.meta);
  const payload=['BKOF1','D',tr.meta.session,0,h.api.hex8(h.api.crc32(bytes)),h.api.base64UrlEncode(bytes)].join('|');
  assert(h.api.acceptPayload(h.api.parsePayload(payload)));assert(await h.api.verifyRestore());h.clickReceipt();assert.equal(JSON.parse(await h.downloads.at(-1).blob.text()).file.sha256,tr.meta.sha256);await assertBytes(h.api.blob(),bytes);
});
test('metadata above the existing 1 MiB source limit is rejected',async()=>{
  const h=harness(),tr=await transfer(h,Uint8Array.of(1));const meta={...tr.meta,size:1024*1024+1,transportSize:1024*1024+1,total:Math.ceil((1024*1024+1)/200)};
  assert.equal(h.api.parsePayload(h.api.createMetaPayload(meta)),null);
  const legacy=['BKOF1','M',meta.session,meta.total,meta.chunkSize,1,6,meta.size,meta.sha256,h.api.utf8ToBase64Url(meta.name),h.api.utf8ToBase64Url(meta.mime),'none',meta.transportSize,'qr',0].join('|');assert.equal(h.api.parsePayload(legacy),null);assertNoExports(h);
});
test('gzip receipt reports compressed transport bytes and verified uncompressed size',async()=>{
  const h=harness(),tr=await transfer(h,new Uint8Array(4096).fill(42),{compression:'gzip'});accept(h,tr);assert(await h.api.verifyRestore());h.clickReceipt();const receipt=JSON.parse(await h.downloads.at(-1).blob.text());assert.equal(receipt.file.sizeBytes,4096);assert.equal(receipt.transport.sizeBytes,tr.meta.transportSize);assert.equal(receipt.transport.blockCount,tr.meta.total);assert.equal(receipt.transport.compression,'gzip');
});
test('current digest and gzip rejections cannot leave exports available',async()=>{
  for(const phase of ['digest','gunzip']){const h=harness(),tr=await transfer(h,new Uint8Array(4096).fill(42),{compression:phase==='gunzip'?'gzip':'none'});accept(h,tr);const g=phase==='digest'?h.pauseDigest():h.pauseGunzip(),pending=h.api.verifyRestore();await g.entered;const rejected=assert.rejects(pending,/Synthetic deferred failure/);g.reject();await rejected;assertNoExports(h);}
});
test('current reconstructed-size mismatch has no verified result',async()=>{
  const h=harness(),tr=await transfer(h,new Uint8Array(4096).fill(42),{compression:'gzip'});tr.meta.size=4095;accept(h,tr);assert.equal(await h.api.verifyRestore(),false);assert.equal(h.$('#restoreStatusTitle').textContent,'hashMismatch');assertNoExports(h);
});
test('replacing metadata-only or provisional input starts a clean restore',async()=>{
  for(const provisional of [false,true]){const h=harness(),tr=await transfer(h,Uint8Array.of(1));provisional?tr.data.forEach(h.api.acceptPayload):h.api.acceptPayload(tr.meta);assert(await h.api.selectRestoreVideo({name:'replacement.webp',type:'image/webp'}));assert.equal(h.api.state.meta,null);assert.equal(h.api.state.provisionalChunks.size,0);assertNoExports(h);}
});
test('cancelled or invalid replacement preserves the current verified result',async()=>{
  const h=harness(),tr=await transfer(h,Uint8Array.of(1));accept(h,tr);assert(await h.api.verifyRestore());const result=h.api.result();h.context.AppConfirm.ask=async()=>false;assert.equal(await h.api.selectRestoreVideo({name:'replacement.webp',type:'image/webp'}),false);assert.equal(await h.api.selectRestoreVideo({name:'invalid.txt',type:'text/plain'}),false);assert.equal(h.api.result(),result);h.clickOriginal();await assertBytes(h.downloads.at(-1).blob,tr.bytes);
});
test('receipt uses the configured application identity, not hard-coded version text',async()=>{
  const h=harness();h.context.APP_CONFIG={...config,name:'Synthetic Optical',version:'9.8.7-test'};const tr=await transfer(h,Uint8Array.of(1));accept(h,tr);assert(await h.api.verifyRestore());h.clickReceipt();assert.deepEqual(JSON.parse(await h.downloads.at(-1).blob.text()).app,{name:'Synthetic Optical',version:'9.8.7-test'});
});
test('complete inline application scripts parse',()=>{
  for(const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(/type=["'](?:application\/json|application\/octet-stream)["']/.test(match[0].slice(0,match[0].indexOf('>'))))continue;new vm.Script(match[1]);}
});

// Real translation functions and click handler, with a minimal DOM. No browser/device claim.
function headerHarness(initialLanguage) {
  const elements = new Map(), stored = new Map();
  for (const match of source.matchAll(/<[a-z][^>]*\bid="([^"]+)"[^>]*>/gi)) {
    const attrs = Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
    elements.set('#' + match[1], {
      attrs, title: attrs.title || '', textContent: '',
      dataset: Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith('data-')).map(([k,v]) => [k.slice(5).replace(/-([a-z])/g, (_,c) => c.toUpperCase()), v])),
      setAttribute(k,v) { this.attrs[k] = String(v); },
      addEventListener(k,fn) { this[k] = fn; }
    });
  }
  const $ = selector => { assert(elements.has(selector), selector); return elements.get(selector); };
  const context = vm.createContext({
    language: initialLanguage, APP_CONFIG: config, $, document: {documentElement: {}},
    $$: selector => [...elements.values()].filter(el => Object.hasOwn(el.attrs, selector.slice(1,-1))),
    writeStorage: (key,value) => stored.set(key,value),
    updateSourceCard(){}, updateVideoCard(){}, updateRestoreStatus(){}, updateEstimates(){}
  });
  vm.runInContext([
    section('      const translations =', '      const $ ='),
    section('      function t(key)', '      function showToast('),
    section('      function applyLanguage()', '      function setMode('),
    ...source.split('\n').filter(line => /\$\('#languageButton'\)\.addEventListener/.test(line)),
    'applyLanguage();'
  ].join('\n'), context);
  return {$, context, stored};
}
for (const initialLanguage of ['ja','en']) test(`header target language stays localized after repeated switches from ${initialLanguage}`,()=>{
  const h=headerHarness(initialLanguage);
  for(let i=0;i<5;i++) {
    const language=h.context.language, button=h.$('#languageButton');
    const target=language==='ja'?'英語に切り替え':'Switch to Japanese';
    assert.equal(button.textContent,language==='ja'?'EN':'JA');
    assert.equal(button.attrs['aria-label'],target);
    assert.equal(button.title,target);
    assert.equal(h.context.document.documentElement.lang,language);
    const help=language==='ja'?'使い方と注意事項':'How to use & notes';
    assert.equal(h.$('#helpButton').title,help);
    assert.equal(h.$('#helpButton').attrs['aria-label'],help);
    assert.equal(h.$('#closeHelpButton').title,language==='ja'?'閉じる':'Close');
    assert.equal(h.$('#closeHelpButton').attrs['aria-label'],language==='ja'?'閉じる':'Close');
    button.click();
    assert.equal(h.stored.get(`${config.slug}:language`),h.context.language);
  }
});
test('local-processing badge is accurate and Japanese fallback matches the translated copy',()=>{
  const h=headerHarness('ja');
  assert.equal(vm.runInContext("t('localBadge')",h.context),'完全ローカル処理');
  assert.match(source,/<span data-i18n="localBadge">完全ローカル処理<\/span>/);
  h.$('#languageButton').click();
  assert.equal(vm.runInContext("t('localBadge')",h.context),'No file upload');
  assert.match(source,/connect-src 'none'/);
});
test('static header fallback matches the configured patch and localized target action',()=>{
  assert.match(source,new RegExp(`id="versionBadge">v${config.version.replaceAll('.','\\.')}</span>`));
  const h=headerHarness('ja');
  assert.equal(h.$('#languageButton').attrs['aria-label'],'英語に切り替え');
  assert.match(source,/<button[^>]*id="languageButton"[^>]*title="英語に切り替え"[^>]*>EN<\/button>/);
});

test('closed Help and confirmation dialogs have an explicit author-style visibility guard',()=>{
  const style = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
  const guard = [...style.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find(rule => rule[1].trim() === 'dialog:not([open])');
  assert(guard, 'The shared dialog display:flex rule needs a closed-state override');
  assert.match(guard[2], /(?:^|;)\s*display\s*:\s*none\s*(?:;|$)/);
  for (const id of ['helpDialog', 'appConfirmDialog']) {
    const tag = source.match(new RegExp(`<dialog\\b[^>]*\\bid="${id}"[^>]*>`))[0];
    assert.doesNotMatch(tag, /\sopen(?:\s|=|>)/);
  }
});
test('open native dialogs retain their existing flex layout and modal handlers',()=>{
  const style = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
  const base = [...style.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find(rule => rule[1].trim() === 'dialog');
  assert.match(base[2], /(?:^|;)\s*display\s*:\s*flex\s*(?:;|$)/);
  assert.match(source, /helpDialog\.showModal\(\)/);
  assert.match(source, /helpDialog\.close\(\)/);
  assert.match(section('      const AppConfirm', '      window.AppConfirm'), /dialog\.showModal\(\)/);
});
