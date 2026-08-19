/* ---------------------------------------------------------------------------
 * build.mjs — bundle the site into one self-contained HTML file.
 *
 *   node build.mjs [outfile]        (default: dist/growth-is-not-a-given.html)
 *
 * The published-artifact host applies a strict CSP that blocks requests to
 * external hosts, so the separate css/ and js/ files have to be inlined. It
 * also wraps the uploaded file in its own <!doctype>/<head>/<body> skeleton,
 * so this strips ours and emits page content only.
 *
 * Google Fonts is the one external host the CSP admits, so that <link> stays.
 * ------------------------------------------------------------------------- */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const OUT = process.argv[2] || 'dist/growth-is-not-a-given.html';

const [html, css, data, charts, main] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('css/style.css', 'utf8'),
  readFile('js/data.js', 'utf8'),
  readFile('js/charts.js', 'utf8'),
  readFile('js/main.js', 'utf8')
]);

/* The three modules are concatenated into one module scope, so the import
 * graph between them collapses. `export`/`import` are the only bindings that
 * change; nothing else in the sources is rewritten. */
const strip = (src) =>
  src
    .replace(/^import\s+[\s\S]*?from\s+'[^']*';\s*$/gm, '')
    .replace(/^export\s+(const|function|class|let)\b/gm, '$1')
    .trimStart();

const script = [
  '/* --- js/data.js --- */', strip(data),
  '/* --- js/charts.js --- */', strip(charts),
  '/* --- js/main.js --- */', strip(main)
].join('\n\n');

/* Pull out the pieces of the head worth keeping, then drop the skeleton. */
const pick = (re) => (html.match(re) || [])[0] || '';
const title = pick(/<title>[\s\S]*?<\/title>/);
const description = pick(/<meta name="description"[^>]*>/);
const fonts = html.match(/<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>/g) || [];

const body = html
  .replace(/[\s\S]*?<body[^>]*>/, '')
  .replace(/<\/body>[\s\S]*/, '')
  .replace(/\s*<script[^>]*src=["'][^"']*["'][^>]*><\/script>\s*/g, '\n')
  .trim();

const out = `${title}
${description}
${fonts.join('\n')}
<style>
${css.trim()}
</style>

${body}

<script type="module">
${script.trim()}
<\/script>
`;

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, out);

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`wrote ${OUT}  (${kb(out.length)})`);
for (const bad of [/<!doctype/i, /<html[\s>]/i, /<head[\s>]/i, /<body[\s>]/i, /\bsrc=["'](?:js|css)\//]) {
  if (bad.test(out)) throw new Error(`bundle still contains ${bad}`);
}
if (!/heroBackdrop\(/.test(out) || !/DATA\.temperature/.test(out)) throw new Error('bundle looks incomplete');
console.log('checks passed: no skeleton tags, no external css/js refs, modules inlined');
