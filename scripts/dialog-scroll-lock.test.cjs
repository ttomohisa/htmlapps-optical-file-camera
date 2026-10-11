// Structural source/shipped-HTML guards, not browser geometry or native scroll tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { gunzipSync } = require('node:zlib');
const root = path.join(__dirname, '..');
const input = fs.readFileSync(process.env.OPTICAL_TEST_HTML || path.join(root, 'src/index.template.html'), 'utf8');
const payload = input.match(/<script id="self-extract-payload"[^>]*>([A-Za-z0-9+/=\s]+)<\/script>/);
const html = payload ? gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8') : input;
const css = html.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
function rule(selector) {
  return rules.filter(r => r[1].trim().split(/\s*,\s*/).includes(selector)).map(r => r[2]).join(';');
}
function section(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert(a >= 0 && b > a, `Missing runtime section: ${start}`);
  return html.slice(a, b);
}

for (const target of ['html', 'body']) test(`${target} locks page overflow whenever either native dialog is open`, () => {
  // Removing either selector or changing hidden to visible must fail this contract.
  assert.match(rule(`${target}:has(dialog[open])`), /(?:^|;)\s*overflow\s*:\s*hidden\s*(?:;|$)/,
    `${target} must lock scrolling for any open dialog, including Help and confirmation`);
  assert.doesNotMatch(rule(target), /(?:^|;)\s*overflow(?:-y)?\s*:\s*(?:hidden|clip)\b/,
    'The page must not be permanently locked after all dialogs close');
});

test('existing dialog shell retains closed visibility and independently scrollable Help', () => {
  assert.match(rule('dialog:not([open])'), /display\s*:\s*none\b/);
  assert.match(rule('dialog'), /display\s*:\s*flex\b/);
  assert.match(rule('dialog'), /max-height\s*:\s*min\(780px,calc\(100dvh - 28px\)\)/);
  assert.match(rule('.dialog-body'), /min-height\s*:\s*0\b/);
  assert.match(rule('.dialog-body'), /overflow\s*:\s*auto\b/);
  assert.match(rule('.dialog-body'), /overscroll-behavior\s*:\s*contain\b/);
  for (const id of ['helpDialog', 'appConfirmDialog']) {
    assert.doesNotMatch(html.match(new RegExp(`<dialog\\b[^>]*\\bid="${id}"[^>]*>`))[0], /\sopen(?:\s|=|>)/);
  }
});

test('Help and confirmation retain native opening, dismissal and confirmation focus restoration', () => {
  const help = html.split('\n').find(line => line.includes("const helpDialog = $('#helpDialog')"));
  assert.match(help, /helpDialog\.showModal\(\)/);
  assert.match(help, /\$\('#closeHelpButton'\)\.addEventListener\('click',\(\) => helpDialog\.close\(\)\)/);
  assert.match(help, /helpDialog\.addEventListener\('click'[\s\S]*getBoundingClientRect\(\)[\s\S]*helpDialog\.close\(\)/);
  // Native Escape stays unprevented for Help. Confirmation routes cancellation through finish(false).
  assert.doesNotMatch(html, /helpDialog\.addEventListener\(['"]cancel/);
  const confirm = section('      const AppConfirm', '      window.AppConfirm');
  assert.match(confirm, /dialog\.showModal\(\)/);
  assert.match(confirm, /dialog\.close\(\)/);
  assert.match(confirm, /dialog\.addEventListener\('cancel', event => \{ event\.preventDefault\(\); finish\(false\); \}\)/);
  assert.match(confirm, /restoreFocus\.focus\(\{ preventScroll: true \}\)/);
});

test('Help explains dismissal without scroll audit prose', () => {
  const translations = vm.runInNewContext(section('      const translations =', '      const $ =') + '\ntranslations;');
  const help = section('<!-- APP:HELP:BEGIN -->', '<!-- APP:HELP:END -->');
  const fallback = help.match(/<p data-i18n="helpDialogs">([^<]+)<\/p>/);
  assert(fallback, 'The new Help guidance must appear in the real Help body');
  assert.equal(fallback[1], translations.ja.helpDialogs);
  assert.doesNotMatch(translations.ja.helpDialogs, /背景.*スクロール/);
  assert.match(translations.ja.helpDialogs, /閉じる.*Esc.*背景/);
  assert.doesNotMatch(translations.en.helpDialogs, /background page.*scroll/i);
  assert.match(translations.en.helpDialogs, /Close.*Esc.*backdrop/);
});

test('local-processing badge retains its existing shield and no-upload copy', () => {
  const badge = html.match(/<div class="local-badge">([\s\S]*?)<\/div>/)[1];
  assert.match(badge, /<path d="M12 3 5 6v5c0 4\.6 2\.8 8 7 10 4\.2-2 7-5\.4 7-10V6z"/);
  assert.match(badge, /<span data-i18n="localBadge">完全ローカル処理<\/span>/);
  assert.match(html, /localBadge:'No file upload'/);
  assert.match(html, /connect-src 'none'/);
});

test('canonical checker runs the dialog regression on source and both generated variants', () => {
  const checker = fs.readFileSync(path.join(root, 'scripts/check-repository.ps1'), 'utf8');
  assert.match(checker, /\$dialogTests = Join-Path \$Root "scripts\/dialog-scroll-lock\.test\.cjs"/);
  assert.equal((checker.match(/& node --test \$restoreTests \$dialogTests/g) || []).length, 2);
  assert.match(checker, /\$env:OPTICAL_TEST_HTML = Join-Path \$Root \(\[string\]\$app\.build\.selfExtract\.output\)/);
  assert.match(checker, /& node --test \$dialogTests/);
  assert.match(checker, /finally\s*\{\s*\$env:OPTICAL_TEST_HTML = \$previousTestHtml/);
});
