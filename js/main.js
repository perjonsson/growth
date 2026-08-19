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
mount('chartCF', (h) => counterfactualChart(h, DATA.gdpLevel, DATA.alreadyPaid.gdpGapToday));
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

/* --- the scroll engine --------------------------------------------------- */

for (const cfg of SCROLLIES) {
  const section = document.getElementById(cfg.section);
  const chart = charts[cfg.chart];
  if (!section || !chart) continue;

  const steps = Array.from(section.querySelectorAll('.step'));
  if (!steps.length) continue;

  let activeIndex = -1;
  const activate = (i) => {
    if (i === activeIndex || i < 0 || i >= steps.length) return;
    activeIndex = i;
    steps.forEach((s, n) => s.classList.toggle('is-active', n === i));
    chart.update(cfg.read(steps[i].dataset));
  };

  /* A thin band across the middle of the viewport: the step crossing it wins.
     On narrow screens the graphic sits on top, so the band moves down. */
  const band = () =>
    window.innerWidth <= 900 ? '-58% 0px -37% 0px' : '-48% 0px -48% 0px';

  let observer;
  const observe = () => {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) activate(steps.indexOf(e.target));
      }
    }, { rootMargin: band(), threshold: 0 });
    steps.forEach((s) => observer.observe(s));
  };
  observe();

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(observe, 200);
  });

  /* Set the opening state without waiting for a scroll */
  activate(0);
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
