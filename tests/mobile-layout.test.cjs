const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../src/index.template.html'),'utf8');
test('hide only informational footer at existing phone breakpoint',()=>assert.ok(html.includes('@media (max-width: 540px) { body > footer { display: none; } }')));
test('standard equivalent English local-processing badge',()=>assert.ok(html.includes("localBadge:'Fully local processing'")));
