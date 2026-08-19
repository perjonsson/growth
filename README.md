# Growth Is Not A Given

A scrollytelling site on what the recent economics of climate change says about
**growth** — not just the level of output, but the rate at which it compounds.

It is built around **Bilal & Känzig (2026)**, *The Macroeconomic Impact of
Climate Change: Global Versus Local Temperature*, Quarterly Journal of Economics
141(2), 889–943 — and deliberately includes the studies that disagree with it,
plus the prominent paper in this literature that was retracted.

## The argument

1. **Growth is treated as a background constant.** World GDP per capita has more
   than tripled since 1960. But growth per head has been slowing for six decades
   — from 3.24% a year in the 1960s to under 2% since — so the trend is an
   outcome, not a law.
2. **The old damage estimates measured the wrong variable.** The standard panel
   approach regresses country output on *local* temperature with time fixed
   effects. That control removes what is common to the whole world in a given
   year — which is exactly what global warming is. It yields ≈3% of world output
   per permanent 1°C, not statistically significant.
3. **Change the thermometer and the answer moves by a factor of seven.** Same
   data, same estimator, global mean temperature instead: a permanent 1°C rise
   lowers world GDP by **over 20%**, significant at the 5% level.
4. **The damage lands on growth, not the level.** Investment, the capital stock,
   TFP and labour productivity all fall, and the effects *deepen* over time
   (TFP from −2% on impact to over −10% after four years). Disasters do not
   stimulate growth.
5. **It has been running since 1960.** Warming has cut the annual world growth
   rate by roughly a third of baseline by 2019; world GDP per capita would be
   more than 20% higher today without it.
6. **The century ahead.** ~3°C by 2100 implies −53% GDP per capita (95% CI −29%
   to −77%), a 35% welfare loss rising to 56%, and a social cost of carbon of
   $1,207/t (CI $399–$2,015) against a conventional $185.
7. **But the error bars are wide, and the page says so.** A whole section is
   given to the retraction, the serious middle position, and what these
   estimates cannot see.

## Running it

There is no build step and no dependencies. Open `index.html`, or serve the
directory:

```sh
python3 -m http.server 8000
```

ES modules require `http://`, not `file://`, so use the server locally. The page
itself makes no network calls — the only external request is the Google Fonts
stylesheet, which degrades to system fonts if blocked.

## Publishing a single file

The site is normally served as separate files. To produce one self-contained
HTML file — everything inlined, no external css/js — run:

```sh
node build.mjs [outfile]     # default: dist/growth-is-not-a-given.html
```

This is what a hosted copy is built from: strict content-security policies
generally block external stylesheets and scripts, so `build.mjs` concatenates
the three ES modules into one module scope, inlines the stylesheet, and emits
page content without the `<html>/<head>/<body>` skeleton (hosts that wrap
uploads supply their own). The Google Fonts `<link>` is kept — it is the one
external host such policies commonly allow, and the type falls back to system
faces if it is blocked. The script fails loudly if any skeleton tag or external
`css/`/`js/` reference survives.

## Layout

```
index.html        the narrative — every act, in order
build.mjs         bundles the above into one self-contained file
css/style.css     dark editorial theme + the scrollytelling layout
js/data.js        every number on the site, each with its source
js/charts.js      dependency-free SVG chart library
js/main.js        binds scroll position to chart state
data/series.json  the observed series as plain JSON, for reuse
```

## Data provenance

Observed series are **real data**, fetched from the providers and inlined into
`js/data.js` so the page renders with no network access:

| Series | Source |
|---|---|
| Global mean surface temperature, 1880–2025 | NASA GISTEMP v4 land–ocean index, re-baselined from the 1951–1980 reference period to 1880–1899 (offset −0.2269°C) |
| World GDP per capita + growth, 1960–2024 | World Bank WDI, `NY.GDP.PCAP.KD` and `NY.GDP.PCAP.KD.ZG`, World aggregate |

Study figures are transcribed from the published articles. Where a chart traces
an intermediate value from a published *figure* rather than a stated statistic —
the interior years of the impulse responses, and three of the four transmission
series — the chart note says so, and the values the paper states in words are
flagged `quoted: true` in `js/data.js`.

The counterfactual in "The bill already paid" is a construction, not a published
series: it applies the paper's stated >20% present-day gap to the observed World
Bank path, phased in quadratically over 1960–2019. The chart note says this too.

## Sources

- Bilal, A. & Känzig, D. R. (2026). [The Macroeconomic Impact of Climate Change: Global Versus Local Temperature](https://academic.oup.com/qje/article/141/2/889/8490467). *QJE* 141(2), 889–943.
- Nath, I. B., Ramey, V. A. & Klenow, P. J. (2024). [How Much Will Global Warming Cool Global Growth?](https://www.nber.org/papers/w32761) NBER WP 32761.
- Burke, M., Hsiang, S. M. & Miguel, E. (2015). [Global non-linear effect of temperature on economic production](https://www.nature.com/articles/nature15725). *Nature* 527, 235–239.
- Kotz, M., Levermann, A. & Wenz, L. (2024). [The economic commitment of climate change](https://www.nature.com/articles/s41586-024-07219-0). *Nature* 628 — **retracted December 2025**.
- Rennert, K. et al. (2022). [Comprehensive evidence implies a higher social cost of CO2](https://www.nature.com/articles/s41586-022-05224-9). *Nature* 610, 687–692.
- [NASA GISTEMP v4](https://data.giss.nasa.gov/gistemp/) · [World Bank WDI](https://data.worldbank.org/indicator/NY.GDP.PCAP.KD.ZG) · [Swiss Re Institute sigma 1/2026](https://www.swissre.com/institute/research/sigma-research/sigma-2026-01-natcat-2025-wildfire-storm-risk/global-natcat-losses-2025.html)

## Accessibility & rendering notes

- Every chart has an `aria-label` describing its shape and a toggleable data
  table with the underlying values.
- The categorical palette is the validated dark-mode set (`#3987e5`, `#d95926`,
  `#199e70`) — it passes lightness-band, chroma, colour-vision-deficiency
  separation and contrast checks against the `#1a1a19` chart surface.
- Identity is never carried by colour alone: legends are always present for two
  or more series, and marks are direct-labelled.
- `prefers-reduced-motion` disables the line-drawing animation, the strike-through
  and the step fades; all content stays fully visible.
- Charts re-render at the container's real pixel size, and horizontal bar charts
  switch to a stacked-label layout below ~620px rather than shrinking their text.
  Verified with no horizontal overflow at 390px, 900px and 1440px.

## A caveat about the page itself

This summarises published research; it is not itself research, and the
interpretation between the numbers is editorial. The literature is young and
contested — headline estimates in it differ by an order of magnitude and one
prominent result has been withdrawn. Follow the sources.
