/* ===========================================================================
   charts.js — a small dependency-free SVG chart library.

   Every chart is rendered at the container's real pixel size (via a
   ResizeObserver) rather than scaled from a fixed viewBox, so axis text stays
   at a legible size on every screen.

   Colour roles come from the validated dark categorical palette declared in
   css/style.css. Text always wears a text token, never a series colour; a
   coloured mark beside the label carries identity.
   =========================================================================== */

const NS = 'http://www.w3.org/2000/svg';

/* --- tiny SVG helpers ---------------------------------------------------- */

function el(name, attrs = {}, parent = null) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    node.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(node);
  return node;
}

function text(parent, x, y, str, cls = 'c-tick', extra = {}) {
  const t = el('text', { x, y, class: cls, ...extra }, parent);
  t.textContent = str;
  return t;
}

const css = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* Linear scale factory */
function scale(d0, d1, r0, r1) {
  const span = d1 - d0 || 1;
  const fn = (v) => r0 + ((v - d0) / span) * (r1 - r0);
  fn.invert = (p) => d0 + ((p - r0) / (r1 - r0 || 1)) * span;
  fn.domain = [d0, d1];
  fn.range = [r0, r1];
  return fn;
}

/* Catmull-Rom -> cubic Bezier, for smooth but non-overshooting curves */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

function linePath(pts) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('');
}

/* Width of a label as it will actually render, so gutters fit the text rather
   than a guess. Falls back to an estimate if the node cannot be measured. */
function measureText(svg, str, cls) {
  const t = el('text', { class: cls, x: -9999, y: -9999 }, svg);
  t.textContent = str;
  let w = 0;
  try { w = t.getComputedTextLength(); } catch { w = 0; }
  t.remove();
  return w || str.length * 6.4;
}

/* Charts and prose should use the same minus sign, not a hyphen */
const MINUS = '\u2212';
const fmtPct = (v, dp = 0) => `${v < 0 ? MINUS : ''}${Math.abs(v).toFixed(dp)}%`;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --- figure scaffold ------------------------------------------------------
   Builds the title / legend / plot / note / table-view shell shared by every
   chart, and wires the ResizeObserver that drives re-rendering.            */

function makeFigure(host, opts) {
  host.classList.add('figure');
  host.innerHTML = '';

  const head = document.createElement('div');
  head.className = 'figure__head';
  const h = document.createElement('p');
  h.className = 'figure__title';
  h.textContent = opts.title;
  head.appendChild(h);
  if (opts.subtitle) {
    const s = document.createElement('p');
    s.className = 'figure__sub';
    s.textContent = opts.subtitle;
    head.appendChild(s);
  }
  host.appendChild(head);

  let legendEl = null;
  if (opts.legend && opts.legend.length) {
    legendEl = document.createElement('ul');
    legendEl.className = 'legend';
    for (const item of opts.legend) {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = 'swatch ' + (item.shape ? `swatch--${item.shape}` : '');
      sw.style.background = item.color;
      if (item.shape === 'dash') sw.style.color = item.color;
      if (item.opacity) sw.style.opacity = item.opacity;
      li.appendChild(sw);
      li.appendChild(document.createTextNode(item.label));
      legendEl.appendChild(li);
    }
    host.appendChild(legendEl);
  }

  const plot = document.createElement('div');
  plot.className = 'figure__plot';
  host.appendChild(plot);

  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.setAttribute('role', 'status');
  plot.appendChild(tip);

  if (opts.note) {
    const n = document.createElement('p');
    n.className = 'figure__note';
    n.textContent = opts.note;
    host.appendChild(n);
  }

  /* Table view — the accessible fallback, and a way to read exact values */
  let table = null;
  if (opts.table) {
    const btn = document.createElement('button');
    btn.className = 'table-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Show data table';
    const wrapper = document.createElement('div');
    wrapper.className = 'data-table';
    wrapper.hidden = true;
    const id = 'tbl-' + Math.random().toString(36).slice(2, 9);
    wrapper.id = id;
    btn.setAttribute('aria-controls', id);
    btn.addEventListener('click', () => {
      const open = wrapper.hidden;
      wrapper.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Hide data table' : 'Show data table';
    });
    host.appendChild(btn);
    host.appendChild(wrapper);
    table = wrapper;
  }

  const api = { host, plot, tip, table, legendEl, width: 0, height: 0, svg: null };

  api.showTip = (html, x, y) => {
    api.tip.innerHTML = html;
    api.tip.style.left = x + 'px';
    api.tip.style.top = y + 'px';
    api.tip.classList.add('is-visible');
  };
  api.hideTip = () => api.tip.classList.remove('is-visible');

  api.frame = () => {
    const w = Math.max(240, plot.clientWidth || host.clientWidth || 320);
    const h = Math.round(Math.min(opts.maxHeight || 420, Math.max(opts.minHeight || 200, w * (opts.ratio || 0.62))));
    if (api.svg) api.svg.remove();
    const svg = el('svg', {
      width: w, height: h, viewBox: `0 0 ${w} ${h}`,
      role: 'img', 'aria-label': opts.ariaLabel || opts.title
    });
    plot.insertBefore(svg, api.tip);
    api.svg = svg;
    api.width = w;
    api.height = h;
    return { svg, w, h };
  };

  api.renderTable = (headers, rows) => {
    if (!table) return;
    const thead = `<thead><tr>${headers.map((x) => `<th scope="col">${x}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows
      .map((r) => `<tr>${r.map((c, i) => (i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`)).join('')}</tr>`)
      .join('')}</tbody>`;
    table.innerHTML = `<table>${thead}${tbody}</table>`;
  };

  api.onResize = (fn) => {
    let last = 0;
    const ro = new ResizeObserver(() => {
      const w = plot.clientWidth;
      if (Math.abs(w - last) < 2) return;
      last = w;
      fn();
    });
    ro.observe(plot);
  };

  return api;
}

/* ===========================================================================
   1. Temperature — the observed record, revealed by scroll position.
   Single series: no legend box; the title names it.
   =========================================================================== */

export function temperatureChart(host, data, opts = {}) {
  const fig = makeFigure(host, {
    title: 'Global mean surface temperature',
    subtitle: 'Annual anomaly against the 1880–1899 average, °C',
    note: 'NASA GISTEMP v4, land–ocean index, 1880–2025.',
    ratio: 0.6, maxHeight: 400, minHeight: 220, table: true,
    ariaLabel: 'Line chart of global mean surface temperature anomaly from 1880 to 2025, rising from about zero to 1.4 degrees Celsius.'
  });

  let revealYear = opts.revealYear || 2025;
  let highlight = null;

  function draw() {
    const { svg, w, h } = fig.frame();
    const m = { t: 14, r: 16, b: 26, l: 38 };
    const x = scale(1880, 2025, m.l, w - m.r);
    const y = scale(-0.35, 1.65, h - m.b, m.t);

    const gGrid = el('g', {}, svg);
    for (const v of [0, 0.5, 1.0, 1.5]) {
      el('line', { x1: m.l, x2: w - m.r, y1: y(v), y2: y(v), class: v === 0 ? 'c-zero' : 'c-grid' }, gGrid);
      text(gGrid, m.l - 7, y(v) + 3.5, v.toFixed(1), 'c-tick', { 'text-anchor': 'end' });
    }
    for (const v of [1900, 1950, 2000]) {
      text(gGrid, x(v), h - m.b + 15, String(v), 'c-tick', { 'text-anchor': 'middle' });
    }
    text(gGrid, x(1880), h - m.b + 15, '1880', 'c-tick', { 'text-anchor': 'start' });
    text(gGrid, x(2025), h - m.b + 15, '2025', 'c-tick', { 'text-anchor': 'end' });

    const shown = data.filter((d) => d[0] <= revealYear);
    const pts = shown.map((d) => [x(d[0]), y(d[1])]);

    /* Soft fill under the curve grounds the line without competing with it */
    if (pts.length > 1) {
      const area = linePath(pts) + `L${x(shown[shown.length - 1][0]).toFixed(2)},${y(0).toFixed(2)}L${x(1880).toFixed(2)},${y(0).toFixed(2)}Z`;
      el('path', { d: area, fill: 'var(--series-2-soft)', stroke: 'none' }, svg);
    }
    el('path', {
      d: smoothPath(pts), fill: 'none', stroke: 'var(--series-2)',
      'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, svg);

    /* Leading dot: where the record stands at the revealed year */
    const last = shown[shown.length - 1];
    if (last) {
      el('circle', { cx: x(last[0]), cy: y(last[1]), r: 4.5, fill: 'var(--series-2)', stroke: 'var(--surface-0)', 'stroke-width': 2 }, svg);
      const lx = x(last[0]);
      const anchor = lx > w - 90 ? 'end' : 'start';
      text(svg, lx + (anchor === 'end' ? -10 : 10), y(last[1]) - 12,
        `${last[0]}  +${last[1].toFixed(2)}°C`, 'c-value', { 'text-anchor': anchor });
    }

    if (highlight) {
      const hx = x(highlight);
      el('line', { x1: hx, x2: hx, y1: m.t, y2: h - m.b, stroke: 'var(--axis)', 'stroke-dasharray': '3 3' }, svg);
    }

    /* Hover layer */
    const hit = el('rect', { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: 'transparent' }, svg);
    const cross = el('line', { y1: m.t, y2: h - m.b, class: 'c-axis', opacity: 0 }, svg);
    const dot = el('circle', { r: 4, fill: 'var(--series-2)', stroke: 'var(--surface-0)', 'stroke-width': 2, opacity: 0 }, svg);
    hit.addEventListener('pointermove', (ev) => {
      const rect = fig.plot.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const yr = Math.round(x.invert(px));
      const d = shown.find((p) => p[0] === yr) || shown[shown.length - 1];
      if (!d) return;
      cross.setAttribute('x1', x(d[0])); cross.setAttribute('x2', x(d[0])); cross.setAttribute('opacity', 0.5);
      dot.setAttribute('cx', x(d[0])); dot.setAttribute('cy', y(d[1])); dot.setAttribute('opacity', 1);
      fig.showTip(
        `<span class="tooltip__label">${d[0]}</span><div class="tooltip__row"><span class="swatch" style="background:var(--series-2)"></span>Anomaly<span class="tooltip__val">${d[1] > 0 ? '+' : ''}${d[1].toFixed(2)}°C</span></div>`,
        x(d[0]), y(d[1])
      );
    });
    hit.addEventListener('pointerleave', () => {
      cross.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); fig.hideTip();
    });
  }

  fig.renderTable(['Year', 'Anomaly °C'], data.filter((d) => d[0] % 5 === 0 || d[0] === 2025).map((d) => [d[0], d[1].toFixed(2)]));
  draw();
  fig.onResize(draw);

  return {
    update(state = {}) {
      let changed = false;
      if (state.revealYear !== undefined && state.revealYear !== revealYear) { revealYear = state.revealYear; changed = true; }
      if (state.highlight !== highlight) { highlight = state.highlight; changed = true; }
      if (changed) draw();
    }
  };
}

/* ===========================================================================
   2. Decade-average world GDP per capita growth.
   One series, one colour; emphasis by opacity on the decade in focus.
   =========================================================================== */

export function growthBars(host, growth, opts = {}) {
  const decades = [];
  for (let d = 1960; d <= 2020; d += 10) {
    const ys = growth.filter(([y]) => y >= d && y < d + 10);
    if (ys.length) decades.push({ decade: d, value: ys.reduce((a, b) => a + b[1], 0) / ys.length, n: ys.length });
  }

  const fig = makeFigure(host, {
    title: 'How fast world income per person grew',
    subtitle: 'Average per year, by decade',
    note: 'World Bank World Development Indicators, World aggregate. The 2020s average covers 2020–2024.',
    ratio: 0.6, maxHeight: 400, minHeight: 220, table: true,
    ariaLabel: 'Bar chart of world GDP per capita growth by decade, falling from 3.2% in the 1960s to under 2% since.'
  });

  let focus = opts.focus ?? null;

  function draw() {
    const { svg, w, h } = fig.frame();
    const m = { t: 26, r: 16, b: 34, l: 34 };
    const y = scale(0, 3.6, h - m.b, m.t);
    const bandW = (w - m.l - m.r) / decades.length;
    const barW = Math.min(52, bandW * 0.6);

    for (const v of [0, 1, 2, 3]) {
      el('line', { x1: m.l, x2: w - m.r, y1: y(v), y2: y(v), class: v === 0 ? 'c-zero' : 'c-grid' }, svg);
      text(svg, m.l - 7, y(v) + 3.5, v + '%', 'c-tick', { 'text-anchor': 'end' });
    }

    decades.forEach((d, i) => {
      const cx = m.l + bandW * i + bandW / 2;
      const top = y(d.value);
      const dim = focus !== null && focus !== d.decade;
      const g = el('g', {}, svg);
      /* 4px rounded data-end, anchored square to the baseline */
      el('path', {
        d: `M${cx - barW / 2},${y(0)} L${cx - barW / 2},${top + 4} Q${cx - barW / 2},${top} ${cx - barW / 2 + 4},${top} L${cx + barW / 2 - 4},${top} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + 4} L${cx + barW / 2},${y(0)} Z`,
        fill: 'var(--series-1)', opacity: dim ? 0.3 : 1,
        style: 'transition: opacity 350ms ease'
      }, g);
      text(g, cx, top - 8, d.value.toFixed(2), 'c-value', { 'text-anchor': 'middle', opacity: dim ? 0.45 : 1 });
      text(g, cx, h - m.b + 16, `${String(d.decade).slice(2)}s`, 'c-tick', { 'text-anchor': 'middle' });

      const hit = el('rect', { x: cx - bandW / 2, y: m.t, width: bandW, height: h - m.t - m.b, fill: 'transparent' }, g);
      hit.addEventListener('pointerenter', () => fig.showTip(
        `<span class="tooltip__label">${d.decade}s</span><div class="tooltip__row"><span class="swatch" style="background:var(--series-1)"></span>Avg growth<span class="tooltip__val">${d.value.toFixed(2)}%</span></div>`,
        cx, top));
      hit.addEventListener('pointerleave', () => fig.hideTip());
    });

    text(svg, m.l, m.t - 12, 'Growth per head has been slowing for sixty years', 'c-annot');
  }

  fig.renderTable(['Decade', 'Avg growth %', 'Years'], decades.map((d) => [`${d.decade}s`, d.value.toFixed(2), d.n]));
  draw();
  fig.onResize(draw);

  return {
    update(state = {}) {
      if (state.focus !== focus) { focus = state.focus ?? null; draw(); }
    }
  };
}

/* ===========================================================================
   3. Impulse response — the central chart of the piece.
   One series at a time plus its 95% band; the band is the same hue, so the
   legend distinguishes them by shape rather than by a second colour.
   =========================================================================== */

export function impulseChart(host, ir) {
  const fig = makeFigure(host, {
    title: 'What one hot year does to world income',
    subtitle: 'Change in income per person, %, in the years afterwards',
    legend: [
      { label: 'Point estimate', color: 'var(--series-2)', shape: 'line' },
      { label: '95% confidence band', color: 'var(--series-2-band)', shape: 'band' }
    ],
    note: 'Bilal & Känzig (2026), Figure III. The years in between are traced from the published graph; the values on impact, at six years and at the peak are stated in the article itself.',
    ratio: 0.66, maxHeight: 400, minHeight: 230, table: true,
    ariaLabel: 'Chart showing world GDP per capita falling about 2 percent on impact after a 1 degree Celsius global temperature shock, deepening to a 14 percent loss by year six and not recovering by year ten.'
  });

  let sample = 'pwt';
  let maxYear = 10;
  let showPeak = false;
  let showPermanent = false;

  function draw() {
    const { svg, w, h } = fig.frame();
    const m = { t: 18, r: 60, b: 30, l: 40 };
    const series = ir[sample];
    const x = scale(0, 10, m.l, w - m.r);
    const y = scale(-32, 4, h - m.b, m.t);

    for (const v of [0, -10, -20, -30]) {
      el('line', { x1: m.l, x2: w - m.r, y1: y(v), y2: y(v), class: v === 0 ? 'c-zero' : 'c-grid' }, svg);
      text(svg, m.l - 7, y(v) + 3.5, fmtPct(v), 'c-tick', { 'text-anchor': 'end' });
    }
    for (let t = 0; t <= 10; t += 2) {
      text(svg, x(t), h - m.b + 15, String(t), 'c-tick', { 'text-anchor': 'middle' });
    }
    text(svg, (m.l + w - m.r) / 2, h - 3, 'Years after the shock', 'c-axis-label', { 'text-anchor': 'middle' });

    const pts = series.points.filter((p) => p.year <= maxYear);
    if (!pts.length) return;

    /* At year zero there is no curve yet — just the impact marker and its
       label, so the opening step of the sequence still says something. */
    if (pts.length === 1) {
      const p0 = pts[0];
      el('circle', { cx: x(p0.year), cy: y(p0.value), r: 5, fill: 'var(--series-2)', stroke: 'var(--surface-0)', 'stroke-width': 2 }, svg);
      el('line', {
        x1: x(p0.year), x2: x(p0.year), y1: y(p0.hi), y2: y(p0.lo),
        stroke: 'var(--series-2)', 'stroke-width': 2, opacity: 0.45, 'stroke-linecap': 'round'
      }, svg);
      text(svg, x(p0.year) + 12, y(p0.value) - 8, `${fmtPct(p0.value, 0)} on impact`, 'c-annot c-annot--strong');
      return;
    }

    /* Confidence band first, so the point estimate sits on top of it */
    const bandTop = pts.map((p) => [x(p.year), y(p.hi)]);
    const bandBot = pts.map((p) => [x(p.year), y(p.lo)]).reverse();
    el('path', {
      d: smoothPath(bandTop) + 'L' + bandBot.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L') + 'Z',
      fill: 'var(--series-2-band)', stroke: 'none'
    }, svg);

    el('path', {
      d: smoothPath(pts.map((p) => [x(p.year), y(p.value)])),
      fill: 'none', stroke: 'var(--series-2)', 'stroke-width': 2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, svg);

    /* Direct labels only on the values the paper states in words */
    for (const p of pts) {
      if (!p.quoted) continue;
      el('circle', { cx: x(p.year), cy: y(p.value), r: 4.5, fill: 'var(--series-2)', stroke: 'var(--surface-0)', 'stroke-width': 2 }, svg);
    }
    const impact = pts[0];
    text(svg, x(impact.year) + 10, y(impact.value) - 10, `${fmtPct(impact.value, 0)} on impact`, 'c-annot');

    if (showPeak) {
      const pk = series.peak;
      if (pk.year <= maxYear) {
        el('line', { x1: x(pk.year), x2: x(pk.year), y1: y(pk.value), y2: m.t + 4, class: 'c-grid', 'stroke-dasharray': '3 3' }, svg);
        text(svg, x(pk.year) + 8, m.t + 12, `Peak: ${fmtPct(pk.value)} at year ${pk.year}`, 'c-annot c-annot--strong');
        text(svg, x(pk.year) + 8, m.t + 27, `95% CI ${fmtPct(pk.hi)} to ${fmtPct(pk.lo)}`, 'c-annot');
      }
    }

    if (showPermanent) {
      const yy = y(-20);
      el('line', { x1: m.l, x2: w - m.r, y1: yy, y2: yy, stroke: 'var(--series-2)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: 0.85 }, svg);
      text(svg, w - m.r + 6, yy - 6, 'Permanent', 'c-annot c-annot--strong', { 'text-anchor': 'end' });
      text(svg, w - m.r + 6, yy + 14, '1°C: >20%', 'c-annot c-annot--strong', { 'text-anchor': 'end' });
    }

    /* Hover */
    const hit = el('rect', { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: 'transparent' }, svg);
    const cross = el('line', { y1: m.t, y2: h - m.b, class: 'c-axis', opacity: 0 }, svg);
    const dot = el('circle', { r: 4, fill: 'var(--series-2)', stroke: 'var(--surface-0)', 'stroke-width': 2, opacity: 0 }, svg);
    hit.addEventListener('pointermove', (ev) => {
      const rect = fig.plot.getBoundingClientRect();
      const t = Math.max(0, Math.min(maxYear, Math.round(x.invert(ev.clientX - rect.left))));
      const p = pts.find((q) => q.year === t);
      if (!p) return;
      cross.setAttribute('x1', x(t)); cross.setAttribute('x2', x(t)); cross.setAttribute('opacity', 0.5);
      dot.setAttribute('cx', x(t)); dot.setAttribute('cy', y(p.value)); dot.setAttribute('opacity', 1);
      fig.showTip(
        `<span class="tooltip__label">Year ${t}</span><div class="tooltip__row"><span class="swatch" style="background:var(--series-2)"></span>World GDP p.c.<span class="tooltip__val">${fmtPct(p.value, 1)}</span></div><div class="tooltip__row"><span class="swatch" style="background:var(--series-2-band)"></span>95% band<span class="tooltip__val">${fmtPct(p.hi, 1)} to ${fmtPct(p.lo, 1)}</span></div>`,
        x(t), y(p.value));
    });
    hit.addEventListener('pointerleave', () => { cross.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); fig.hideTip(); });
  }

  function table() {
    const s = ir[sample];
    fig.renderTable(['Year', 'Estimate %', 'Low %', 'High %'],
      s.points.map((p) => [p.year, p.value.toFixed(1), p.lo.toFixed(1), p.hi.toFixed(1)]));
  }

  table(); draw(); fig.onResize(draw);

  return {
    update(state = {}) {
      let changed = false;
      if (state.sample && state.sample !== sample) { sample = state.sample; changed = true; table(); }
      if (state.maxYear !== undefined && state.maxYear !== maxYear) { maxYear = state.maxYear; changed = true; }
      if (state.showPeak !== undefined && state.showPeak !== showPeak) { showPeak = state.showPeak; changed = true; }
      if (state.showPermanent !== undefined && state.showPermanent !== showPermanent) { showPermanent = state.showPermanent; changed = true; }
      if (changed) draw();
    }
  };
}

/* ===========================================================================
   4. Local versus global temperature — the measurement contrast.
   Two categorical slots (blue = local, orange = global), direct-labelled.
   =========================================================================== */

export function localGlobalChart(host, rows) {
  const fig = makeFigure(host, {
    title: 'Same model, two thermometers',
    subtitle: 'What one degree, permanently, costs world output',
    legend: [
      { label: 'Local (country) temperature', color: 'var(--series-1)' },
      { label: 'Global mean temperature', color: 'var(--series-2)' }
    ],
    note: 'Bilal & Känzig (2026). The local-temperature result is weak enough that it could be chance; the global-temperature result is not.',
    ratio: 0.56, maxHeight: 340, minHeight: 200, table: true,
    ariaLabel: 'Bar chart comparing a 3 percent output loss estimated from local temperature with a 20 percent loss estimated from global temperature.'
  });

  let reveal = 2;

  function draw() {
    const { svg, w, h } = fig.frame();
    const m = { t: 22, r: 20, b: 42, l: 44 };
    const y = scale(0, -24, m.t, h - m.b);
    const bandW = (w - m.l - m.r) / 2;
    const barW = Math.min(96, bandW * 0.42);

    for (const v of [0, -5, -10, -15, -20]) {
      el('line', { x1: m.l, x2: w - m.r, y1: y(v), y2: y(v), class: v === 0 ? 'c-zero' : 'c-grid' }, svg);
      text(svg, m.l - 7, y(v) + 3.5, fmtPct(v), 'c-tick', { 'text-anchor': 'end' });
    }

    rows.forEach((r, i) => {
      if (i >= reveal) return;
      const cx = m.l + bandW * i + bandW / 2;
      const color = r.key === 'global' ? 'var(--series-2)' : 'var(--series-1)';
      const bot = y(r.permanent);
      const top = y(0);
      const g = el('g', {}, svg);
      /* Bar hangs downward from zero: rounded end at the bottom */
      el('path', {
        d: `M${cx - barW / 2},${top} L${cx - barW / 2},${bot - 4} Q${cx - barW / 2},${bot} ${cx - barW / 2 + 4},${bot} L${cx + barW / 2 - 4},${bot} Q${cx + barW / 2},${bot} ${cx + barW / 2},${bot - 4} L${cx + barW / 2},${top} Z`,
        fill: color
      }, g);
      text(g, cx, bot + 17, fmtPct(r.permanent), 'c-value', { 'text-anchor': 'middle' });
      text(g, cx, h - m.b + 18, r.label, 'c-annot c-annot--strong', { 'text-anchor': 'middle' });
      text(g, cx, h - m.b + 33, r.significant ? 'significant' : 'not significant', 'c-annot', { 'text-anchor': 'middle', opacity: 0.75 });

      const hit = el('rect', { x: cx - bandW / 2, y: m.t, width: bandW, height: h - m.t - m.b, fill: 'transparent' }, g);
      hit.addEventListener('pointerenter', () => fig.showTip(
        `<span class="tooltip__label">${r.label}</span><div class="tooltip__row"><span class="swatch" style="background:${color}"></span>Permanent 1°C<span class="tooltip__val">${fmtPct(r.permanent)}</span></div><div class="tooltip__row"><span class="swatch" style="background:${color}"></span>Social cost of carbon<span class="tooltip__val">$${r.scc}</span></div>`,
        cx, bot));
      hit.addEventListener('pointerleave', () => fig.hideTip());
    });

    if (reveal >= 2) {
      /* The gap is the story: mark it explicitly */
      const gx = m.l + bandW;
      el('line', { x1: gx, x2: gx, y1: y(-3), y2: y(-20), stroke: 'var(--axis)', 'stroke-dasharray': '3 3' }, svg);
      text(svg, gx + 8, (y(-3) + y(-20)) / 2, 'a 7-fold gap', 'c-annot c-annot--strong');
    }
  }

  fig.renderTable(['Thermometer', 'On impact %', 'Permanent 1°C %', 'Welfare loss %', 'SCC $/t', 'Significant'],
    rows.map((r) => [r.label, r.onImpact, r.permanent, r.welfareLoss, r.scc, r.significant ? 'yes' : 'no']));
  draw(); fig.onResize(draw);

  return { update(s = {}) { if (s.reveal !== undefined && s.reveal !== reveal) { reveal = s.reveal; draw(); } } };
}

/* ===========================================================================
   5. Transmission — a slope chart. One colour; the slope is the message.
   =========================================================================== */

export function transmissionChart(host, rows) {
  const fig = makeFigure(host, {
    title: 'Where the damage lands',
    subtitle: 'Change after one degree of warming, %: right away, and four years later',
    note: 'Bilal & Känzig (2026), Figure X, 1960–2019. Apart from the productivity path, which the article states, these values are read from the published graph.',
    ratio: 0.66, maxHeight: 380, minHeight: 240, table: true,
    ariaLabel: 'Chart showing total factor productivity, labour productivity, capital and investment all falling further four years after a temperature shock than on impact.'
  });

  function draw() {
    const { svg, w, h } = fig.frame();
    /* A slope chart needs a wide label gutter on the right. Below that width
       the same two numbers read better as a bar with the on-impact value
       marked on it, so the form changes rather than the labels shrinking. */
    const compact = w < 660;
    if (compact) return drawBars();
    const rightGutter = Math.max(...rows.map((r) =>
      measureText(svg, `${r.label}  ${fmtPct(r.atFour, 0)}`, 'c-annot'))) + 24;
    const m = { t: 34, r: Math.min(w * 0.42, rightGutter), b: 30, l: 44 };
    const y = scale(1, -15, m.t, h - m.b);
    const xa = m.l + 10, xb = w - m.r;

    for (const v of [0, -5, -10, -15]) {
      el('line', { x1: m.l, x2: xb, y1: y(v), y2: y(v), class: v === 0 ? 'c-zero' : 'c-grid' }, svg);
      text(svg, m.l - 7, y(v) + 3.5, fmtPct(v), 'c-tick', { 'text-anchor': 'end' });
    }
    text(svg, xa, m.t - 14, 'Right away', 'c-axis-label', { 'text-anchor': 'middle' });
    text(svg, xb, m.t - 14, 'After 4 years', 'c-axis-label', { 'text-anchor': 'middle' });

    const labels = [];
    rows.forEach((r) => {
      const g = el('g', {}, svg);
      el('line', {
        x1: xa, y1: y(r.onImpact), x2: xb, y2: y(r.atFour),
        stroke: 'var(--series-2)', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.9
      }, g);
      /* ≥8px markers with a 2px surface ring so overlaps stay readable */
      el('circle', { cx: xa, cy: y(r.onImpact), r: 4.5, fill: 'var(--series-2)', stroke: 'var(--surface-0)', 'stroke-width': 2 }, g);
      el('circle', { cx: xb, cy: y(r.atFour), r: 5, fill: 'var(--series-2)', stroke: 'var(--surface-0)', 'stroke-width': 2 }, g);
      /* Labels are placed after the loop so overlapping ones can be nudged */
      labels.push({ y: y(r.atFour), text: `${r.label}  ${fmtPct(r.atFour, 0)}` });

      const hit = el('rect', { x: xa - 10, y: Math.min(y(r.onImpact), y(r.atFour)) - 10, width: xb - xa + 20, height: Math.abs(y(r.atFour) - y(r.onImpact)) + 20, fill: 'transparent' }, g);
      hit.addEventListener('pointerenter', () => fig.showTip(
        `<span class="tooltip__label">${r.label}</span><div class="tooltip__row"><span class="swatch" style="background:var(--series-2)"></span>On impact<span class="tooltip__val">${fmtPct(r.onImpact, 0)}</span></div><div class="tooltip__row"><span class="swatch" style="background:var(--series-2)"></span>After 4 years<span class="tooltip__val">${fmtPct(r.atFour, 0)}</span></div>`,
        (xa + xb) / 2, y(r.atFour)));
      hit.addEventListener('pointerleave', () => fig.hideTip());
    });

    /* Two of these series land within a percentage point of each other, so the
       labels would collide. Push them apart, keeping their order. */
    labels.sort((a, b) => a.y - b.y);
    const MIN_GAP = 16;
    for (let i = 1; i < labels.length; i++) {
      if (labels[i].y - labels[i - 1].y < MIN_GAP) labels[i].y = labels[i - 1].y + MIN_GAP;
    }
    for (const l of labels) text(svg, xb + 12, l.y + 4, l.text, 'c-annot');
  }

  /* Narrow-screen form: one bar per component, the on-impact value ticked on it */
  function drawBars() {
    const { svg, w, h } = fig.frame();
    const m = { t: 14, r: 30, b: 26, l: 16 };
    const x = scale(0, -15, m.l, w - m.r);
    const bandH = (h - m.t - m.b) / rows.length;
    const barH = Math.min(20, bandH * 0.28);

    for (const v of [0, -5, -10, -15]) {
      el('line', { x1: x(v), x2: x(v), y1: m.t, y2: h - m.b, class: v === 0 ? 'c-zero' : 'c-grid' }, svg);
      text(svg, x(v), h - m.b + 15, fmtPct(v), 'c-tick', { 'text-anchor': 'middle' });
    }

    rows.forEach((r, i) => {
      const cy = m.t + bandH * i + bandH / 2 + bandH * 0.22;
      const g = el('g', {}, svg);
      const x0 = x(0), x1 = x(r.atFour);
      el('path', {
        d: `M${x0},${cy - barH / 2} L${x1 + 4},${cy - barH / 2} Q${x1},${cy - barH / 2} ${x1},${cy - barH / 2 + 4} L${x1},${cy + barH / 2 - 4} Q${x1},${cy + barH / 2} ${x1 + 4},${cy + barH / 2} L${x0},${cy + barH / 2} Z`,
        fill: 'var(--series-2)'
      }, g);
      /* Tick showing where the effect stood on impact */
      el('line', {
        x1: x(r.onImpact), x2: x(r.onImpact), y1: cy - barH / 2 - 3, y2: cy + barH / 2 + 3,
        stroke: 'var(--surface-0)', 'stroke-width': 2
      }, g);
      text(g, m.l, cy - barH / 2 - 7, `${r.label}   ${fmtPct(r.onImpact, 0)} → ${fmtPct(r.atFour, 0)}`, 'c-annot c-annot--strong', { 'text-anchor': 'start' });

      const hit = el('rect', { x: m.l, y: cy - bandH / 2, width: w - m.l - m.r, height: bandH, fill: 'transparent' }, g);
      hit.addEventListener('pointerenter', () => fig.showTip(
        `<span class="tooltip__label">${r.label}</span><div class="tooltip__row"><span class="swatch" style="background:var(--series-2)"></span>On impact<span class="tooltip__val">${fmtPct(r.onImpact, 0)}</span></div><div class="tooltip__row"><span class="swatch" style="background:var(--series-2)"></span>After 4 years<span class="tooltip__val">${fmtPct(r.atFour, 0)}</span></div>`,
        (x0 + x1) / 2, cy - barH));
      hit.addEventListener('pointerleave', () => fig.hideTip());
    });

    text(svg, m.l, h - 2, 'Tick marks the on-impact value', 'c-axis-label');
  }

  fig.renderTable(['Component', 'On impact %', 'After 4 years %'], rows.map((r) => [r.label, r.onImpact, r.atFour]));
  draw(); fig.onResize(draw);
  return { update() {} };
}

/* ===========================================================================
   6. Counterfactual — observed world GDP per capita against the path without
   the warming of 1960–2019. Two series, both labelled directly.
   =========================================================================== */

export function counterfactualChart(host, level, gapPct, anchorYear) {
  const fig = makeFigure(host, {
    title: 'The bill already paid',
    subtitle: 'Income per person worldwide, in 2015 dollars',
    legend: [
      { label: 'Observed', color: 'var(--series-1)', shape: 'line' },
      { label: 'Without 1960–2019 warming', color: 'var(--series-2)', shape: 'dash' }
    ],
    note: 'Observed series: World Bank. The counterfactual applies the Bilal & Känzig (2026) finding that world GDP per capita would be more than 20% higher had no warming occurred between 1960 and 2019, phased in over that period. The paper\u2019s data ends in 2019, so the gap is held flat after it rather than extrapolated \u2014 warming continued, so this understates rather than overstates the wedge.',
    ratio: 0.6, maxHeight: 380, minHeight: 220, table: true,
    ariaLabel: 'Two lines showing observed world GDP per capita reaching about 11,900 dollars in 2024 against a counterfactual without warming about 20 per cent higher. The counterfactual is estimated to 2019 and carried forward flat after that.'
  });

  let showCounter = false;
  const y0 = level[0][0], y1 = level[level.length - 1][0];

  /* The estimate is anchored to the end of the paper's sample, not to the end
     of the observed series. The gap is phased in quadratically to that year —
     damages accumulate with the warming — and then held flat in proportional
     terms, because there is no published estimate for the years after it.
     Warming did not stop in 2019, so holding it flat understates the gap. */
  const counter = level.map(([yr, v]) => {
    const frac = Math.min(1, Math.max(0, (yr - y0) / (anchorYear - y0)));
    return [yr, v * (1 + (gapPct / 100) * frac * frac)];
  });

  function draw() {
    const { svg, w, h } = fig.frame();
    /* The right margin has to hold "$14,273" plus its caption */
    const m = { t: 18, r: 92, b: 28, l: 46 };
    const x = scale(y0, y1, m.l, w - m.r);
    const y = scale(3000, 15000, h - m.b, m.t);

    for (const v of [4000, 8000, 12000]) {
      el('line', { x1: m.l, x2: w - m.r, y1: y(v), y2: y(v), class: 'c-grid' }, svg);
      text(svg, m.l - 7, y(v) + 3.5, '$' + (v / 1000) + 'k', 'c-tick', { 'text-anchor': 'end' });
    }
    for (const v of [1970, 1990, 2010]) text(svg, x(v), h - m.b + 15, String(v), 'c-tick', { 'text-anchor': 'middle' });
    text(svg, x(y0), h - m.b + 15, String(y0), 'c-tick', { 'text-anchor': 'start' });

    if (showCounter) {
      /* Shade the gap so the loss reads as an area, not just two lines */
      const top = counter.map(([yr, v]) => [x(yr), y(v)]);
      const bot = level.map(([yr, v]) => [x(yr), y(v)]).reverse();
      el('path', {
        d: smoothPath(top) + 'L' + bot.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L') + 'Z',
        fill: 'var(--series-2-band)', stroke: 'none'
      }, svg);

      /* Estimated stretch solid-dashed; the carried-forward years faded, so the
         chart never implies the estimate covers more than it does. */
      const est = counter.filter(([yr]) => yr <= anchorYear);
      const fwd = counter.filter(([yr]) => yr >= anchorYear);
      el('path', {
        d: smoothPath(est.map(([yr, v]) => [x(yr), y(v)])),
        fill: 'none', stroke: 'var(--series-2)', 'stroke-width': 2,
        'stroke-dasharray': '6 4', 'stroke-linecap': 'round'
      }, svg);
      if (fwd.length > 1) {
        el('path', {
          d: smoothPath(fwd.map(([yr, v]) => [x(yr), y(v)])),
          fill: 'none', stroke: 'var(--series-2)', 'stroke-width': 2,
          'stroke-dasharray': '2 4', 'stroke-linecap': 'round', opacity: 0.5
        }, svg);
        el('line', {
          x1: x(anchorYear), x2: x(anchorYear), y1: m.t, y2: h - m.b,
          stroke: 'var(--axis)', 'stroke-dasharray': '3 3'
        }, svg);
        text(svg, x(anchorYear) - 8, m.t + 10, `estimate ends ${anchorYear}`, 'c-annot', { 'text-anchor': 'end' });
      }

      const c = counter[counter.length - 1];
      text(svg, x(c[0]) + 8, y(c[1]) + 2, `$${Math.round(c[1]).toLocaleString('en-US')}`, 'c-value');
      text(svg, x(c[0]) + 8, y(c[1]) + 17, 'no warming', 'c-annot');
    }

    el('path', {
      d: smoothPath(level.map(([yr, v]) => [x(yr), y(v)])),
      fill: 'none', stroke: 'var(--series-1)', 'stroke-width': 2, 'stroke-linecap': 'round'
    }, svg);
    const l = level[level.length - 1];
    el('circle', { cx: x(l[0]), cy: y(l[1]), r: 4.5, fill: 'var(--series-1)', stroke: 'var(--surface-0)', 'stroke-width': 2 }, svg);
    text(svg, x(l[0]) + 8, y(l[1]) + 2, `$${Math.round(l[1]).toLocaleString('en-US')}`, 'c-value');
    text(svg, x(l[0]) + 8, y(l[1]) + 17, 'observed', 'c-annot');

    const hit = el('rect', { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: 'transparent' }, svg);
    const cross = el('line', { y1: m.t, y2: h - m.b, class: 'c-axis', opacity: 0 }, svg);
    hit.addEventListener('pointermove', (ev) => {
      const rect = fig.plot.getBoundingClientRect();
      const yr = Math.round(x.invert(ev.clientX - rect.left));
      const a = level.find((p) => p[0] === yr); const b = counter.find((p) => p[0] === yr);
      if (!a) return;
      cross.setAttribute('x1', x(yr)); cross.setAttribute('x2', x(yr)); cross.setAttribute('opacity', 0.5);
      const rows = [`<div class="tooltip__row"><span class="swatch" style="background:var(--series-1)"></span>Observed<span class="tooltip__val">$${Math.round(a[1]).toLocaleString('en-US')}</span></div>`];
      if (showCounter && b) rows.push(`<div class="tooltip__row"><span class="swatch" style="background:var(--series-2)"></span>No warming<span class="tooltip__val">$${Math.round(b[1]).toLocaleString('en-US')}</span></div>`);
      fig.showTip(`<span class="tooltip__label">${yr}</span>${rows.join('')}`, x(yr), y(a[1]));
    });
    hit.addEventListener('pointerleave', () => { cross.setAttribute('opacity', 0); fig.hideTip(); });
  }

  fig.renderTable(['Year', 'Observed $', 'No-warming $', 'Basis'],
    level.filter(([yr]) => yr % 5 === 0 || yr === y1)
      .map(([yr, v]) => [
        yr,
        Math.round(v).toLocaleString('en-US'),
        Math.round(counter.find((c) => c[0] === yr)[1]).toLocaleString('en-US'),
        yr <= anchorYear ? 'estimated' : 'carried forward'
      ]));
  draw(); fig.onResize(draw);

  return { update(s = {}) { if (s.showCounter !== undefined && s.showCounter !== showCounter) { showCounter = s.showCounter; draw(); } } };
}

/* ===========================================================================
   7. Literature range — where the estimates sit, including the retracted one.
   One hue with emphasis; the retracted entry carries a status colour and a
   label, never colour alone.
   =========================================================================== */

export function literatureChart(host, rows) {
  const items = rows.filter((r) => r.value !== null);
  const fig = makeFigure(host, {
    title: 'The range of the evidence',
    subtitle: 'Estimated loss, %. Each study measures something slightly different — see below',
    note: 'Not a like-for-like comparison. The old consensus figure is the cost of one permanent degree; Burke et al. and Bilal & Känzig are end-of-century projections if warming goes unchecked; Kotz et al. is a 2049 figure. Bars are central estimates, whiskers the reported ranges.',
    ratio: 0.8, maxHeight: 420, minHeight: 300, table: true,
    ariaLabel: 'Horizontal bar chart of climate damage estimates ranging from 2 percent for conventional panel studies to 53 percent for Bilal and Kanzig.'
  });

  function draw() {
    const { svg, w, h } = fig.frame();
    /* Below ~620px there is no room for a label gutter wide enough for study
       names, so the labels move above their bars and the plot goes full width. */
    const stacked = w < 620;
    const gutter = Math.max(...items.flatMap((r) => [
      measureText(svg, r.label, 'c-annot c-annot--strong'),
      measureText(svg, r.kind === 'retracted' ? 'RETRACTED 2025' : r.detail, 'c-annot')
    ])) + 18;
    const m = { t: 16, r: stacked ? 30 : 62, b: 30, l: stacked ? 16 : Math.min(w * 0.5, gutter) };
    const x = scale(0, -80, m.l, w - m.r);
    const bandH = (h - m.t - m.b) / items.length;
    const barH = Math.min(24, stacked ? bandH * 0.3 : bandH * 0.5);

    for (const v of [0, -20, -40, -60, -80]) {
      el('line', { x1: x(v), x2: x(v), y1: m.t, y2: h - m.b, class: v === 0 ? 'c-zero' : 'c-grid' }, svg);
      text(svg, x(v), h - m.b + 15, fmtPct(v), 'c-tick', { 'text-anchor': 'middle' });
    }

    items.forEach((r, i) => {
      const cy = m.t + bandH * i + bandH / 2 + (stacked ? bandH * 0.22 : 0);
      const headline = r.kind === 'headline';
      const retracted = r.kind === 'retracted';
      const fill = headline ? 'var(--series-2)' : retracted ? 'var(--critical)' : 'var(--series-1)';
      const opacity = retracted ? 0.42 : headline ? 1 : 0.55;
      const g = el('g', {}, svg);

      const x0 = x(0), x1 = x(r.value);
      el('path', {
        d: `M${x0},${cy - barH / 2} L${x1 + 4},${cy - barH / 2} Q${x1},${cy - barH / 2} ${x1},${cy - barH / 2 + 4} L${x1},${cy + barH / 2 - 4} Q${x1},${cy + barH / 2} ${x1 + 4},${cy + barH / 2} L${x0},${cy + barH / 2} Z`,
        fill, opacity
      }, g);

      if (r.lo !== undefined && r.hi !== undefined) {
        el('line', { x1: x(r.lo), x2: x(r.hi), y1: cy, y2: cy, stroke: 'var(--text-muted)', 'stroke-width': 1.5 }, g);
        for (const v of [r.lo, r.hi]) el('line', { x1: x(v), x2: x(v), y1: cy - 5, y2: cy + 5, stroke: 'var(--text-muted)', 'stroke-width': 1.5 }, g);
      }

      /* A short bar has no room for a label inside it, and a stacked layout
         has no gutter, so in both cases the value rides on the label line. */
      if (!stacked) {
        const short = (x1 - m.l) < 52;
        text(g, x1 + (short ? 8 : -8), cy + 4, fmtPct(r.value), 'c-value',
          { 'text-anchor': short ? 'start' : 'end' });
      }

      const labelText = stacked ? `${r.label}   ${fmtPct(r.value)}` : r.label;
      const lbl = stacked
        ? text(g, m.l, cy - barH / 2 - 16, labelText, 'c-annot c-annot--strong', { 'text-anchor': 'start' })
        : text(g, m.l - 12, cy - 1, labelText, 'c-annot c-annot--strong', { 'text-anchor': 'end' });
      if (retracted) lbl.setAttribute('text-decoration', 'line-through');

      const sub = retracted ? 'RETRACTED 2025' : r.detail;
      if (stacked) text(g, m.l, cy - barH / 2 - 4, sub, 'c-annot', { 'text-anchor': 'start', opacity: 0.7 });
      else text(g, m.l - 12, cy + 13, sub, 'c-annot', { 'text-anchor': 'end', opacity: 0.7 });

      const hit = el('rect', { x: m.l, y: cy - bandH / 2, width: w - m.l - m.r, height: bandH, fill: 'transparent' }, g);
      hit.addEventListener('pointerenter', () => fig.showTip(
        `<span class="tooltip__label">${r.label}</span><div class="tooltip__row"><span class="swatch" style="background:${fill}"></span>Central<span class="tooltip__val">${fmtPct(r.value)}</span></div>` +
        (r.lo !== undefined ? `<div class="tooltip__row"><span class="swatch" style="background:var(--text-muted)"></span>Range<span class="tooltip__val">${fmtPct(r.hi)} to ${fmtPct(r.lo)}</span></div>` : ''),
        (x0 + x1) / 2, cy - barH));
      hit.addEventListener('pointerleave', () => fig.hideTip());
    });
  }

  fig.renderTable(['Study', 'What it measures', 'Central %', 'Range %'],
    rows.map((r) => [r.label, r.detail, r.value === null ? '—' : r.value, r.lo !== undefined ? `${r.hi} to ${r.lo}` : '—']));
  draw(); fig.onResize(draw);
  return { update() {} };
}

/* ===========================================================================
   8. Social cost of carbon — emphasis chart. One hue, headline highlighted.
   =========================================================================== */

export function sccChart(host, rows) {
  const fig = makeFigure(host, {
    title: 'What a ton of CO₂ costs',
    subtitle: 'US$ per ton — the number carbon taxes are set from',
    note: 'Bilal & Känzig (2026); Rennert et al. (2022). The whisker on the headline estimate is its 95% confidence interval, $399–$2,015.',
    ratio: 0.55, maxHeight: 320, minHeight: 220, table: true,
    ariaLabel: 'Bar chart comparing a social cost of carbon of 149 and 185 dollars per ton with a headline estimate of 1,207 dollars.'
  });

  let reveal = rows.length;

  function draw() {
    const { svg, w, h } = fig.frame();
    const stacked = w < 620;
    const gutter = Math.max(...rows.map((r) =>
      measureText(svg, r.label, 'c-annot' + (r.kind === 'headline' ? ' c-annot--strong' : '')))) + 18;
    const m = { t: 14, r: stacked ? 30 : 74, b: 26, l: stacked ? 16 : Math.min(w * 0.5, gutter) };
    const x = scale(0, 2100, m.l, w - m.r);
    const bandH = (h - m.t - m.b) / rows.length;
    const barH = Math.min(26, stacked ? bandH * 0.26 : bandH * 0.46);

    for (const v of [0, 500, 1000, 1500, 2000]) {
      el('line', { x1: x(v), x2: x(v), y1: m.t, y2: h - m.b, class: v === 0 ? 'c-zero' : 'c-grid' }, svg);
      text(svg, x(v), h - m.b + 15, v === 0 ? '$0' : '$' + (v / 1000).toFixed(1) + 'k', 'c-tick', { 'text-anchor': 'middle' });
    }

    rows.forEach((r, i) => {
      if (i >= reveal) return;
      const cy = m.t + bandH * i + bandH / 2 + (stacked ? bandH * 0.24 : 0);
      const headline = r.kind === 'headline';
      const g = el('g', {}, svg);
      const x0 = x(0), x1 = x(r.value);
      el('path', {
        d: `M${x0},${cy - barH / 2} L${x1 - 4},${cy - barH / 2} Q${x1},${cy - barH / 2} ${x1},${cy - barH / 2 + 4} L${x1},${cy + barH / 2 - 4} Q${x1},${cy + barH / 2} ${x1 - 4},${cy + barH / 2} L${x0},${cy + barH / 2} Z`,
        fill: headline ? 'var(--series-2)' : 'var(--series-1)', opacity: headline ? 1 : 0.5
      }, g);
      if (r.lo && r.hi) {
        el('line', { x1: x(r.lo), x2: x(r.hi), y1: cy, y2: cy, stroke: 'var(--text-muted)', 'stroke-width': 1.5 }, g);
        for (const v of [r.lo, r.hi]) el('line', { x1: x(v), x2: x(v), y1: cy - 5, y2: cy + 5, stroke: 'var(--text-muted)', 'stroke-width': 1.5 }, g);
      }
      const money = '$' + r.value.toLocaleString('en-US');
      if (stacked) {
        /* No gutter and the whisker can reach the right edge: the value rides
           on the label line rather than chasing the end of the bar. */
        text(g, m.l, cy - barH / 2 - 7, `${r.label}   ${money}`,
          'c-annot' + (headline ? ' c-annot--strong' : ''), { 'text-anchor': 'start' });
      } else {
        text(g, (r.hi ? x(r.hi) : x1) + 8, cy + 4, money, 'c-value');
        text(g, m.l - 12, cy + 4, r.label, 'c-annot' + (headline ? ' c-annot--strong' : ''), { 'text-anchor': 'end' });
      }

      const hit = el('rect', { x: m.l, y: cy - bandH / 2, width: w - m.l - m.r, height: bandH, fill: 'transparent' }, g);
      hit.addEventListener('pointerenter', () => fig.showTip(
        `<span class="tooltip__label">${r.label}</span><div class="tooltip__row"><span class="swatch" style="background:${headline ? 'var(--series-2)' : 'var(--series-1)'}"></span>SCC<span class="tooltip__val">$${r.value.toLocaleString('en-US')}</span></div>`,
        (x0 + x1) / 2, cy - barH));
      hit.addEventListener('pointerleave', () => fig.hideTip());
    });
  }

  fig.renderTable(['Estimate', 'US$ per ton', '95% CI'],
    rows.map((r) => [r.label, '$' + r.value.toLocaleString('en-US'), r.lo ? `$${r.lo}–$${r.hi.toLocaleString('en-US')}` : '—']));
  draw(); fig.onResize(draw);
  return { update(s = {}) { if (s.reveal !== undefined && s.reveal !== reveal) { reveal = s.reveal; draw(); } } };
}

/* ===========================================================================
   9. Hero backdrop — the temperature record as ambient texture, not a chart.
   Deliberately unlabelled: the real chart comes later.
   =========================================================================== */

export function heroBackdrop(host, data) {
  function draw() {
    host.innerHTML = '';
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    const svg = el('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true', focusable: 'false' }, host);

    const x = scale(1880, 2025, -20, w + 20);
    /* On a phone the copy runs most of the way down the screen, so the curve
       is pushed into the lower band where it cannot cross the text. */
    const top = w < 900 ? 0.62 : 0.30;
    const y = scale(-0.4, 1.7, h * 0.98, h * top);
    const pts = data.map((d) => [x(d[0]), y(d[1])]);

    const grad = el('linearGradient', { id: 'heroFade', x1: '0', y1: '0', x2: '0', y2: '1' }, el('defs', {}, svg));
    el('stop', { offset: '0%', 'stop-color': 'var(--series-2)', 'stop-opacity': '0.30' }, grad);
    el('stop', { offset: '100%', 'stop-color': 'var(--series-2)', 'stop-opacity': '0' }, grad);

    el('path', { d: smoothPath(pts) + `L${w + 20},${h}L-20,${h}Z`, fill: 'url(#heroFade)', stroke: 'none' }, svg);
    const line = el('path', {
      d: smoothPath(pts), fill: 'none', stroke: 'var(--series-2)',
      'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.9
    }, svg);

    if (!prefersReducedMotion()) {
      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.style.transition = 'stroke-dashoffset 2600ms cubic-bezier(0.4,0,0.2,1) 200ms';
      requestAnimationFrame(() => { line.style.strokeDashoffset = '0'; });
    }
  }
  draw();
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 200); });
}
