/* ===========================================================================
   main.js — wires the data to the charts, and the scroll position to both.

   The scrollytelling model: each `.step` carries data-* attributes describing
   the chart state it wants. An IntersectionObserver with a narrow band across
   the middle of the viewport decides which step is active, and pushes that
   step's state into the chart pinned beside it.
   =========================================================================== */

import { DATA } from './data.js';
import {
  heroBackdrop, temperatureChart, growthBars, impulseChart,
  localGlobalChart, transmissionChart, counterfactualChart,
  literatureChart, sccChart
} from './charts.js';

/* --- hero ---------------------------------------------------------------- */

const heroCanvas = document.getElementById('heroCanvas');
if (heroCanvas) heroBackdrop(heroCanvas, DATA.temperature);

/* Draw the strike-through on "not" once the hero has settled */
const strike = document.getElementById('heroStrike');
if (strike) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) strike.style.setProperty('--strike', '1');
  else requestAnimationFrame(() => setTimeout(() => strike.style.setProperty('--strike', '1'), 500));
}

/* --- charts -------------------------------------------------------------- */

const charts = {};
const mount = (id, fn) => {
  const host = document.getElementById(id);
  if (host) charts[id] = fn(host);
};

mount('chartGrowth', (h) => growthBars(h, DATA.gdpGrowth));
mount('chartTemp', (h) => temperatureChart(h, DATA.temperature, { revealYear: 1900 }));
mount('chartLocal', (h) => localGlobalChart(h, DATA.localVsGlobal));
mount('chartIR', (h) => impulseChart(h, DATA.impulseResponse));
mount('chartTransmission', (h) => transmissionChart(h, DATA.transmission));
mount('chartCF', (h) => counterfactualChart(h, DATA.gdpLevel, DATA.alreadyPaid.gdpGap, DATA.alreadyPaid.gapAnchorYear));
mount('chartLit', (h) => literatureChart(h, DATA.literature));
mount('chartSCC', (h) => sccChart(h, DATA.scc));

/* Which chart each scrolly section drives, and how to read its steps */
const SCROLLIES = [
  {
    section: 'scrollyTemp', chart: 'chartTemp',
    read: (d) => ({ revealYear: Number(d.reveal) })
  },
  {
    section: 'scrollyLocal', chart: 'chartLocal',
    read: (d) => ({ reveal: Number(d.reveal) })
  },
  {
    section: 'scrollyIR', chart: 'chartIR',
    read: (d) => ({
      sample: d.sample,
      maxYear: Number(d.maxyear),
      showPeak: d.peak === '1',
      showPermanent: d.permanent === '1'
    })
  },
  {
    section: 'scrollyCF', chart: 'chartCF',
    read: (d) => ({ showCounter: d.counter === '1' })
  }
];

/* --- the scroll engine ---------------------------------------------------
   Rather than relying on a thin IntersectionObserver band — which short step
   cards on a phone can skip straight past — each section picks its active step
   directly: the last one whose top edge has crossed a trigger line. That gives
   exactly one active step at any scroll position, and it never misses one.

   The observer is still used, but only to switch each section's scroll work on
   and off as it enters and leaves the viewport. */

const sections = [];

for (const cfg of SCROLLIES) {
  const section = document.getElementById(cfg.section);
  const chart = charts[cfg.chart];
  if (!section || !chart) continue;
  const steps = Array.from(section.querySelectorAll('.step'));
  if (!steps.length) continue;

  const entry = { section, chart, cfg, steps, index: -1, live: false };

  entry.activate = (i) => {
    i = Math.max(0, Math.min(steps.length - 1, i));
    if (i === entry.index) return;
    entry.index = i;
    steps.forEach((s, n) => s.classList.toggle('is-active', n === i));
    chart.update(cfg.read(steps[i].dataset));
  };

  entry.sync = () => {
    /* The pinned graphic sits above the prose on a narrow screen, so the
       trigger line moves down to stay inside the reading column. */
    const trigger = window.innerHeight * (window.innerWidth <= 900 ? 0.7 : 0.55);
    let next = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].getBoundingClientRect().top <= trigger) next = i;
    }
    entry.activate(next);
  };

  new IntersectionObserver((entries) => {
    for (const e of entries) entry.live = e.isIntersecting;
    if (entry.live) entry.sync();
  }, { rootMargin: '10% 0px 10% 0px' }).observe(section);

  entry.activate(0);
  sections.push(entry);
}

if (sections.length) {
  let queued = false;
  const sync = () => {
    queued = false;
    for (const s of sections) if (s.live) s.sync();
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  sync();
}

/* Focus the decade bar chart on the slowdown when it scrolls into view */
const growthHost = document.getElementById('chartGrowth');
if (growthHost && charts.chartGrowth) {
  new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      setTimeout(() => charts.chartGrowth.update({ focus: 1960 }), 600);
      setTimeout(() => charts.chartGrowth.update({ focus: null }), 2200);
      obs.disconnect();
    }
  }, { threshold: 0.55 }).observe(growthHost);
}

/* --- reading-progress bar ------------------------------------------------ */

const bar = document.getElementById('progressBar');
if (bar) {
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    bar.style.width = pct.toFixed(2) + '%';
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

/* --- the takeaway, made portable ------------------------------------------
   Clipboard access can be refused in a sandboxed frame, so fall back to
   selecting the text and telling the reader which keys to press. */

const copyBtn = document.getElementById('copyBtn');
if (copyBtn) {
  const label = copyBtn.textContent;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const settle = (msg, ok) => {
    copyBtn.textContent = msg;
    copyBtn.classList.toggle('is-done', ok);
    setTimeout(() => {
      copyBtn.textContent = label;
      copyBtn.classList.remove('is-done');
    }, 2600);
  };

  copyBtn.addEventListener('click', async () => {
    const payload = copyBtn.dataset.copy || '';
    try {
      await navigator.clipboard.writeText(payload);
      settle('Copied', true);
      return;
    } catch { /* fall through to the manual path */ }

    /* execCommand is deprecated but still the only fallback that works when
       the async clipboard API is blocked by frame permissions. */
    const ta = document.createElement('textarea');
    ta.value = payload;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    settle(ok ? 'Copied' : `Press ${mac ? '\u2318' : 'Ctrl'}+C`, ok);
  });
}

/* --- sources ------------------------------------------------------------- */

const list = document.getElementById('sourceList');
if (list) {
  for (const s of DATA.sources) {
    const li = document.createElement('li');
    if (/RETRACTED/.test(s.title)) li.classList.add('is-retracted');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'src-title';
    a.textContent = s.title;
    const meta = document.createElement('span');
    meta.className = 'src-meta';
    meta.textContent = `${s.authors} (${s.year}). ${s.venue}.`;
    const role = document.createElement('span');
    role.className = 'src-role';
    role.textContent = s.role;
    li.append(a, meta, role);
    list.appendChild(li);
  }
}
