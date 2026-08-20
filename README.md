# Growth Is Not A Given

A scrollytelling site on what the recent economics of climate change says about
**growth** — not just the level of output, but the rate at which it compounds.

It is built around **Bilal & Känzig (2026)**, *The Macroeconomic Impact of
Climate Change: Global Versus Local Temperature*, Quarterly Journal of Economics
141(2), 889–943 — and deliberately includes the studies that disagree with it,
plus the prominent paper in this literature that was retracted.

## The argument

The page is written for a general reader — roughly a 7-minute read, with the
jargon removed and four hand-drawn figures carrying what prose cannot.

Three of those figures exist to make an abstract number land in the body rather
than the head, because that is what people actually remember:

| Figure | The number it makes physical |
|---|---|
| A clinical thermometer at 37.0°C and 38.4°C | 1.4°C sounds like nothing; as a fever it is the gap between working and going to bed |
| Wheat beside a cracked tractor | the difference between losing one year's output and losing the thing that makes every future year's |
| A working week with Friday struck out | 20% of world income is one whole day in five |

The fourth is the mechanism diagram: country temperature bars, the world average
subtracted, and only local weather left standing.

1. **Growth is treated as a background constant.** World GDP per capita has more
   than tripled since 1960. But growth per head has been slowing for six decades
   — from 3.24% a year in the 1960s to under 2% since — so the trend is an
   outcome, not a law.
2. **The old damage estimates measured the wrong variable.** The standard panel
   approach regresses country output on *local* temperature with time fixed
   effects. That control removes what is common to the whole world in a given
   year — which is exactly what global warming is. It yields ≈3% of world output
   per permanent 1°C, not statistically significant. This is the reveal the page
   turns on, and the one idea it draws rather than describes.
3. **Change the thermometer and the answer moves by a factor of seven.** Same
   data, same estimator, global mean temperature instead: a permanent 1°C rise
   lowers world GDP by **over 20%**, significant at the 5% level.
4. **The damage lands on growth, not the level.** Investment, the capital stock,
   TFP and labour productivity all fall, and the effects *deepen* over time
   (TFP from −2% on impact to over −10% after four years). Disasters do not
   stimulate growth.
5. **It has already happened.** Warming had cut roughly a third off the annual
   world growth rate by 2019; world GDP per capita would be more than 20% higher
   today without it. This is the turn the page builds to and closes on — a bill
   already paid, not a projection.
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
series. It applies the paper's stated >20% gap to the observed World Bank path,
phased in quadratically to **2019** — the end of both of the paper's samples,
bounded by the ISIMIP observed-climate data, which runs 1901–2019.

After 2019 the proportional gap is **held flat rather than extrapolated**, the
chart marks where the estimate stops, and the years past it are drawn in a
lighter dash and labelled `carried forward` in the data table. Warming did not
stop in 2019, so holding the gap flat understates rather than overstates the
wedge. The page's copy says "between 1960 and 2019" rather than "today" for the
same reason.

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
- Chart label gutters are measured from the rendered text rather than guessed,
  so renaming a series cannot silently clip its label.
- Illustrations are hand-authored inline SVG in `currentColor`, with the accent
  spent only on what has been lost — the fever, the crack, the missing day. No
  raster assets, so nothing to load and nothing to license.
- Scroll steps are chosen by which one has crossed a trigger line, not by a thin
  IntersectionObserver band — a short card on a phone can scroll straight past a
  narrow band and strand the chart on the wrong state.
- Charts re-render at the container's real pixel size, and horizontal bar charts
  switch to a stacked-label layout below ~620px rather than shrinking their text.
  Verified with no horizontal overflow at 390px, 900px and 1440px.

## A caveat about the page itself

This summarises published research; it is not itself research, and the
interpretation between the numbers is editorial. The literature is young and
contested — headline estimates in it differ by an order of magnitude and one
prominent result has been withdrawn. Follow the sources.
