import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Resolve from this file so the build works wherever the repo is checked out.
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'designs');
const OUT = ROOT;

const ROUTES = {
  'Landing.dc.html': '/',
  'Login.dc.html': '/login',
  'Main.dc.html': '/dashboard',
  'QuanLy.dc.html': '/quan-ly',
  'NhanVienDashboard.dc.html': '/nhan-vien-dashboard',
  'DonHang.dc.html': '/don-hang',
  'TaoDon.dc.html': '/tao-don',
  'DichVu.dc.html': '/dich-vu',
  'KhachHang.dc.html': '/khach-hang',
  'NhanVien.dc.html': '/nhan-vien',
  'Gallery.dc.html': '/gallery',
  'ZaloOA.dc.html': '/zalo-oa',
  // referenced by the employee dashboard but not present in the export
  'MobileChamCong.dc.html': '/nhan-vien-dashboard',
};

// ---------- tiny HTML parser (enough for these well-formed docs) ----------
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

function parse(html) {
  const root = { type: 'root', children: [] };
  const stack = [root];
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { pushText(stack, html.slice(i)); break; }
    if (lt > i) pushText(stack, html.slice(i, lt));
    if (html.startsWith('<!--', lt)) { i = html.indexOf('-->', lt) + 3; continue; }
    const gt = findTagEnd(html, lt);
    const raw = html.slice(lt, gt + 1);
    if (raw.startsWith('</')) {
      const name = raw.slice(2, -1).trim().toLowerCase();
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].name === name) { stack.length = k; break; }
      }
      i = gt + 1;
      continue;
    }
    const selfClose = raw.endsWith('/>');
    const m = /^<([a-zA-Z0-9-]+)/.exec(raw);
    const name = m[1].toLowerCase();
    const attrs = parseAttrs(raw.slice(m[0].length, selfClose ? -2 : -1));
    const node = { type: 'el', name, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!selfClose && !VOID.has(name)) stack.push(node);
    i = gt + 1;
  }
  return root;
}
function findTagEnd(s, start) {
  let q = null;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === '>') return i;
  }
  return s.length - 1;
}
function pushText(stack, text) {
  if (text) stack[stack.length - 1].children.push({ type: 'text', value: text });
}
function parseAttrs(s) {
  const attrs = [];
  const re = /([a-zA-Z0-9_:@.-]+)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(s))) {
    const value = m[3] ?? m[4] ?? m[5] ?? '';
    attrs.push([m[1], value]);
  }
  return attrs;
}

// ---------- template evaluation ----------
const EXPR = /\{\{([^}]+)\}\}/g;

function lookup(pathStr, scope) {
  const parts = pathStr.trim().split('.');
  let cur = scope;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
function evalExpr(src, scope) {
  const s = src.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return lookup(s, scope);
}
function interpolate(str, scope) {
  // whole-string single expression keeps its raw type
  const whole = /^\{\{([^}]+)\}\}$/.exec(str.trim());
  if (whole) {
    const v = evalExpr(whole[1], scope);
    return v === undefined || v === null ? '' : v;
  }
  return str.replace(EXPR, (_, e) => {
    const v = evalExpr(e, scope);
    return v === undefined || v === null ? '' : String(v);
  });
}

const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => escMap[c]);
// keep already-encoded entities intact in text nodes
const escText = (s) => String(s).replace(/&(?!#?\w+;)/g, '&amp;');

function rewriteHref(href) {
  if (!href) return href;
  const base = href.split('#')[0];
  if (ROUTES[base]) {
    const hash = href.includes('#') ? '#' + href.split('#')[1] : '';
    return ROUTES[base] + hash;
  }
  return href;
}

/**
 * Tag each element with the role it plays in the layout, so `responsive.css`
 * can target structure instead of matching fragments of inline style strings
 * (which silently miss every value the author happened to vary).
 */
function roleOf(node, style, depth) {
  const has = (re) => re.test(style);

  if (depth === 0) return 'artboard';
  if (node.name === 'aside' && depth === 1) return 'sidebar';
  if (node.name === 'header') return 'topbar';
  if (node.name === 'table') return 'table';
  // The block wrapping a table is what has to scroll: a table told to scroll
  // itself does not constrain its own rows.
  if (node.children?.some((c) => c.type === 'el' && c.name === 'table')) {
    return 'tablewrap';
  }
  if (has(/grid-template-columns/)) return 'grid';



  // A column the design pinned to a fixed pixel width: on a narrow screen
  // these must give up their width rather than force the row to overflow.
  const pinnedWidth = /(?:^|;)\s*width:\s*(\d{3,})px/.exec(style);
  if (has(/flex-shrink:\s*0/) && pinnedWidth && +pinnedWidth[1] >= 240) {
    return 'pinned';
  }

  // Wide horizontal padding drawn for a 1440px canvas.
  if (has(/padding:[^;]*\b(?:4\d|[5-9]\d|\d{3})px/)) return 'roomy';

  if (node.name === 'h1' || node.name === 'h2') return 'heading';

  return null;
}

function render(node, scope, out) {
  if (node.type === 'text') { out.push(escText(interpolate(node.value, scope))); return; }
  if (node.type === 'root') { node.children.forEach((c) => render(c, scope, out)); return; }

  if (node.name === 'sc-for') {
    const listAttr = node.attrs.find((a) => a[0] === 'list')?.[1] ?? '';
    const asName = node.attrs.find((a) => a[0] === 'as')?.[1] ?? 'item';
    const list = interpolate(listAttr, scope);
    if (Array.isArray(list)) {
      for (const item of list) {
        const child = Object.create(scope);
        child[asName] = item;
        node.children.forEach((c) => render(c, child, out));
      }
    }
    return;
  }
  if (node.name === 'sc-if') {
    const val = interpolate(node.attrs.find((a) => a[0] === 'value')?.[1] ?? '', scope);
    if (val) node.children.forEach((c) => render(c, scope, out));
    return;
  }

  const attrs = [];
  let style = '';
  for (let [k, v] of node.attrs) {
    if (k.startsWith('hint-')) continue;
    let val = interpolate(v, scope);
    if (val === false || val === undefined || val === null) continue;
    if (val === true) val = '';
    if (k === 'href') val = rewriteHref(String(val));
    if (k === 'style') style = String(val);
    attrs.push(` ${k}="${esc(val)}"`);
  }

  const role = roleOf(node, style, scope.$depth ?? 0);
  if (role) attrs.push(` data-r="${role}"`);

  out.push(`<${node.name}${attrs.join('')}>`);
  if (VOID.has(node.name)) return;
  const inner = Object.create(scope);
  inner.$depth = (scope.$depth ?? 0) + 1;
  node.children.forEach((c) => render(c, inner, out));
  out.push(`</${node.name}>`);
}

// ---------- per-file pipeline ----------
function extract(html, tag) {
  const open = new RegExp(`<${tag}[^>]*>`, 'i').exec(html);
  if (!open) return null;
  const start = open.index + open[0].length;
  const end = html.toLowerCase().lastIndexOf(`</${tag}>`);
  return { inner: html.slice(start, end), attrs: open[0] };
}

function runLogic(scriptSrc, props) {
  const context = vm.createContext({ console });
  const code = `
    class DCLogic { constructor(p){ this.props = p; } }
    ${scriptSrc}
    new Component(__props).renderVals();
  `;
  context.__props = props;
  return vm.runInContext(code, context);
}

/**
 * The designs are authored as a rigid 1440x<N>px artboard, which left dead
 * space beside the page on any wider screen. Make the width fluid so the
 * layout fills the window — the columns underneath are flexbox, so they take
 * up the slack while sidebars keep their designed widths.
 *
 * The height is deliberately left alone: panels inside these layouts use
 * `height: 100%`, which only resolves against a parent with a definite
 * height. Swapping it for `min-height` collapses every one of them.
 */
function fluidRoot(html) {
  const m = /^(\s*)<div style="([^"]*)"/.exec(html);
  if (!m) return html;

  const decls = m[2]
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .filter((d) => !/^width\s*:/i.test(d));

  decls.unshift('width: 100%');

  return m[1] + `<div style="${decls.join('; ')};"` + html.slice(m[0].length);
}

function convert(file) {
  const html = fs.readFileSync(file, 'utf8');
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
  const dc = extract(html, 'x-dc').inner;

  const helmetBlock = extract(dc, 'helmet');
  const helmet = helmetBlock ? helmetBlock.inner : '';
  const globalCss = /<style>([\s\S]*?)<\/style>/.exec(helmet)?.[1] ?? '';
  const body = dc.replace(/<helmet>[\s\S]*?<\/helmet>/i, '');

  const scriptMatch = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  const propsJson = /data-props='([^']*)'/.exec(html)?.[1];
  const propsDef = propsJson ? JSON.parse(propsJson) : {};
  const props = {};
  for (const [k, v] of Object.entries(propsDef)) if (k !== '$preview' && 'default' in v) props[k] = v.default;

  const vals = runLogic(scriptMatch[1], props);
  const out = [];
  render(parse(body), vals, out);
  return {
    title,
    html: fluidRoot(out.join('').trim()),
    globalCss,
    preview: propsDef.$preview ?? {},
  };
}

// ---------- emit ----------
const files = fs.readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith('-html'))
  .flatMap((d) => fs.readdirSync(path.join(SRC, d.name))
    .filter((f) => f.endsWith('.dc.html'))
    .map((f) => path.join(SRC, d.name, f)));

const pages = [];
for (const f of files) {
  const base = path.basename(f);
  const route = ROUTES[base];
  if (!route) { console.warn('no route for', base); continue; }
  const r = convert(f);
  pages.push({ route, base, ...r });
}

fs.mkdirSync(path.join(OUT, 'src/generated'), { recursive: true });
for (const p of pages) {
  const dir = p.route === '/' ? path.join(OUT, 'src/app') : path.join(OUT, 'src/app', p.route.slice(1));
  fs.mkdirSync(dir, { recursive: true });
  const name = p.base.replace('.dc.html', '');
  fs.writeFileSync(
    path.join(OUT, 'src/generated', name + '.ts'),
    '// Generated from ' + p.base + ' by scripts/convert.mjs — do not edit by hand.\n' +
      'const html = ' + JSON.stringify(p.html) + ';\nexport default html;\n'
  );
  fs.writeFileSync(path.join(dir, 'page.tsx'), `import Artboard from "@/components/Artboard";
import html from "@/generated/${name}";

export const metadata = { title: ${JSON.stringify(p.title)} };

export default function Page() {
  return (
    <Artboard
      html={html}
      width={${p.preview.width ?? 1440}}
      name="${name}"
    />
  );
}
`);
  console.log(p.route, '->', name, p.html.length, 'bytes');
}
console.log('global css sample:\n', pages[0].globalCss.trim().slice(0, 300));
