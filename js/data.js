/* ---------------------------------------------------------------------------
 * data.js — every number on this site, with its source.
 *
 * Observational series are inlined verbatim from the providers listed below so
 * the page renders with no network access and no build step. Study figures are
 * transcribed from the published papers; see SOURCES at the bottom of this file
 * and the "Sources & method" section of the page.
 * ------------------------------------------------------------------------- */

export const DATA = {};

/* Global mean surface temperature anomaly, degrees C.
 * NASA GISS Surface Temperature Analysis (GISTEMP v4), land-ocean index.
 * Re-baselined here from the GISTEMP 1951-1980 reference period to an
 * 1880-1899 pre-industrial reference (offset -0.2269 degrees C). */
DATA.temperature = [
  [1880,0.048], [1881,0.135], [1882,0.112], [1883,0.05], [1884,-0.058], [1885,-0.109], [1886,-0.09], [1887,-0.138],
  [1888,0.049], [1889,0.118], [1890,-0.128], [1891,0.001], [1892,-0.047], [1893,-0.087], [1894,-0.08], [1895,-0.001],
  [1896,0.111], [1897,0.114], [1898,-0.051], [1899,0.05], [1900,0.141], [1901,0.072], [1902,-0.056], [1903,-0.145],
  [1904,-0.25], [1905,-0.037], [1906,0.001], [1907,-0.161], [1908,-0.203], [1909,-0.262], [1910,-0.215], [1911,-0.221],
  [1912,-0.145], [1913,-0.126], [1914,0.064], [1915,0.079], [1916,-0.137], [1917,-0.236], [1918,-0.076], [1919,-0.053],
  [1920,-0.052], [1921,0.035], [1922,-0.058], [1923,-0.042], [1924,-0.045], [1925,0.004], [1926,0.116], [1927,0.006],
  [1928,0.024], [1929,-0.137], [1930,0.067], [1931,0.13], [1932,0.064], [1933,-0.061], [1934,0.099], [1935,0.025],
  [1936,0.076], [1937,0.194], [1938,0.224], [1939,0.206], [1940,0.344], [1941,0.405], [1942,0.289], [1943,0.314],
  [1944,0.428], [1945,0.322], [1946,0.155], [1947,0.2], [1948,0.121], [1949,0.119], [1950,0.052], [1951,0.159],
  [1952,0.238], [1953,0.309], [1954,0.095], [1955,0.087], [1956,0.039], [1957,0.274], [1958,0.286], [1959,0.258],
  [1960,0.202], [1961,0.285], [1962,0.258], [1963,0.28], [1964,0.029], [1965,0.12], [1966,0.172], [1967,0.203],
  [1968,0.144], [1969,0.279], [1970,0.254], [1971,0.147], [1972,0.234], [1973,0.388], [1974,0.155], [1975,0.214],
  [1976,0.129], [1977,0.405], [1978,0.293], [1979,0.389], [1980,0.48], [1981,0.548], [1982,0.364], [1983,0.538],
  [1984,0.381], [1985,0.344], [1986,0.406], [1987,0.547], [1988,0.614], [1989,0.499], [1990,0.674], [1991,0.632],
  [1992,0.449], [1993,0.458], [1994,0.539], [1995,0.67], [1996,0.557], [1997,0.692], [1998,0.834], [1999,0.608],
  [2000,0.62], [2001,0.759], [2002,0.854], [2003,0.842], [2004,0.759], [2005,0.905], [2006,0.866], [2007,0.891],
  [2008,0.769], [2009,0.884], [2010,0.949], [2011,0.834], [2012,0.873], [2013,0.903], [2014,0.975], [2015,1.123],
  [2016,1.239], [2017,1.141], [2018,1.075], [2019,1.204], [2020,1.234], [2021,1.074], [2022,1.118], [2023,1.394],
  [2024,1.511], [2025,1.419]
];

/* World GDP per capita, annual growth (%). World Bank NY.GDP.PCAP.KD.ZG,
 * aggregate "World" (1W). Retrieved from the World Bank API. */
DATA.gdpGrowth = [
  [1961,2.514], [1962,3.476], [1963,2.82], [1964,4.426], [1965,3.475], [1966,3.24], [1967,1.642], [1968,3.797],
  [1969,3.783], [1970,1.628], [1971,1.948], [1972,3.451], [1973,4.372], [1974,0.042], [1975,-1.041], [1976,3.346],
  [1977,2.134], [1978,2.327], [1979,2.311], [1980,0.036], [1981,0.099], [1982,-1.392], [1983,0.751], [1984,2.902],
  [1985,1.85], [1986,1.485], [1987,1.908], [1988,2.688], [1989,1.838], [1990,0.933], [1991,-0.451], [1992,0.412],
  [1993,0.254], [1994,1.841], [1995,1.637], [1996,2.054], [1997,2.486], [1998,1.314], [1999,2.141], [2000,3.151],
  [2001,0.67], [2002,0.986], [2003,1.753], [2004,3.159], [2005,2.745], [2006,3.169], [2007,3.123], [2008,0.806],
  [2009,-2.561], [2010,3.256], [2011,2.063], [2012,1.462], [2013,1.63], [2014,1.932], [2015,1.914], [2016,1.6],
  [2017,2.284], [2018,2.181], [2019,1.611], [2020,-3.835], [2021,5.602], [2022,2.547], [2023,1.911], [2024,1.914]
];

/* World GDP per capita, constant 2015 US$. World Bank NY.GDP.PCAP.KD. */
DATA.gdpLevel = [
  [1960,3666.6], [1961,3758.8], [1962,3889.4], [1963,3999.1], [1964,4176.1], [1965,4321.3], [1966,4461.3], [1967,4534.5],
  [1968,4706.7], [1969,4884.7], [1970,4964.3], [1971,5061.0], [1972,5235.6], [1973,5464.5], [1974,5466.8], [1975,5409.9],
  [1976,5590.9], [1977,5710.2], [1978,5843.1], [1979,5978.1], [1980,5980.2], [1981,5986.2], [1982,5902.8], [1983,5947.2],
  [1984,6119.8], [1985,6233.0], [1986,6325.6], [1987,6446.3], [1988,6619.6], [1989,6741.2], [1990,6804.1], [1991,6773.4],
  [1992,6801.3], [1993,6818.6], [1994,6944.1], [1995,7057.8], [1996,7202.7], [1997,7381.8], [1998,7478.8], [1999,7638.9],
  [2000,7879.6], [2001,7932.4], [2002,8010.6], [2003,8151.0], [2004,8408.6], [2005,8639.4], [2006,8913.2], [2007,9191.5],
  [2008,9265.5], [2009,9028.2], [2010,9322.2], [2011,9514.5], [2012,9653.6], [2013,9811.0], [2014,10000.6], [2015,10192.0],
  [2016,10355.0], [2017,10591.6], [2018,10822.6], [2019,10996.9], [2020,10575.2], [2021,11167.6], [2022,11452.0], [2023,11670.8],
  [2024,11894.3]
];

/* ---------------------------------------------------------------------------
 * Bilal & Kanzig (2026), "The Macroeconomic Impact of Climate Change: Global
 * Versus Local Temperature", Quarterly Journal of Economics 141(2), 889-943.
 * All figures below are transcribed from the published article.
 * ------------------------------------------------------------------------- */

/* Impulse response of world real GDP per capita to a global temperature shock
 * scaled to 1 degree C, estimated by local projections.
 *
 * Two anchors are stated in the text for each sample; the paper reports the
 * on-impact effect, the six-year effect and the peak with its 95% band. The
 * intermediate years are read off the published impulse-response figures
 * (Figure III) and are therefore approximate — they are drawn as a curve, not
 * quoted as statistics. The four values the paper states in words are flagged
 * `quoted: true` and are the only ones the page cites numerically. */
DATA.impulseResponse = {
  pwt: {
    label: 'Penn World Table sample',
    sublabel: '1960-2019, broad country coverage',
    peak: { year: 6, value: -14, lo: -22, hi: -6 },
    points: [
      { year: 0, value: -2.0, lo: -4.5, hi: 0.5, quoted: true },
      { year: 1, value: -4.6, lo: -8.6, hi: -0.6 },
      { year: 2, value: -7.4, lo: -12.6, hi: -2.2 },
      { year: 3, value: -9.9, lo: -16.2, hi: -3.6 },
      { year: 4, value: -11.8, lo: -18.8, hi: -4.8 },
      { year: 5, value: -13.2, lo: -20.8, hi: -5.6 },
      { year: 6, value: -14.0, lo: -22.0, hi: -6.0, quoted: true },
      { year: 7, value: -13.8, lo: -22.2, hi: -5.4 },
      { year: 8, value: -13.1, lo: -22.0, hi: -4.2 },
      { year: 9, value: -12.4, lo: -21.9, hi: -2.9 },
      { year: 10, value: -11.8, lo: -21.9, hi: -1.7 }
    ]
  },
  bu: {
    label: 'Barro-Ursua sample',
    sublabel: '1860-2019, 43 countries, longer span',
    peak: { year: 5, value: -18, lo: -30, hi: -6 },
    points: [
      { year: 0, value: -3.0, lo: -6.0, hi: 0.0, quoted: true },
      { year: 1, value: -7.2, lo: -13.0, hi: -1.4 },
      { year: 2, value: -11.4, lo: -19.4, hi: -3.4 },
      { year: 3, value: -14.6, lo: -24.4, hi: -4.8 },
      { year: 4, value: -16.9, lo: -28.0, hi: -5.8 },
      { year: 5, value: -18.0, lo: -30.0, hi: -6.0, quoted: true },
      { year: 6, value: -17.6, lo: -30.0, hi: -5.2 },
      { year: 7, value: -16.6, lo: -29.6, hi: -3.6 },
      { year: 8, value: -15.6, lo: -29.2, hi: -2.0 },
      { year: 9, value: -14.8, lo: -29.0, hi: -0.6 },
      { year: 10, value: -14.2, lo: -29.0, hi: 0.6 }
    ]
  }
};

/* The measurement contrast at the heart of the paper: the same specification,
 * run on local (country-level) temperature versus global mean temperature. */
DATA.localVsGlobal = [
  {
    key: 'local',
    label: 'Local temperature',
    method: 'Country-level temperature, the standard panel approach. Time fixed effects absorb whatever is common to the whole world in a given year.',
    onImpact: -1,
    permanent: -3,
    significant: false,
    welfareLoss: 5,
    scc: 149,
    note: 'Not statistically significant at the 5% level.'
  },
  {
    key: 'global',
    label: 'Global temperature',
    method: 'Global mean temperature, which the paper shows is a far stronger predictor of the droughts, extreme wind and extreme precipitation that actually do the damage.',
    onImpact: -2,
    permanent: -20,
    significant: true,
    welfareLoss: 35,
    scc: 1207,
    note: 'Significant at the 5% level in years 2-8.'
  }
];

/* Transmission: what a global temperature shock does to the components of
 * output. Penn World Table sample, 1960-2019 (Figure X). */
DATA.transmission = [
  { label: 'Total factor productivity', onImpact: -2, atFour: -10.5,
    note: 'Falls significantly. The effect strengthens from -2% on impact to over -10% after four years.' },
  { label: 'Labour productivity', onImpact: -2, atFour: -10,
    note: 'Output per worker falls significantly alongside TFP.' },
  { label: 'Capital stock per capita', onImpact: -0.5, atFour: -8,
    note: 'The capital stock is eroded rather than rebuilt.' },
  { label: 'Investment per capita', onImpact: -3, atFour: -13,
    note: 'Investment falls. Disasters do not stimulate growth.' }
];

/* Structural counterfactual: global mean temperature rises gradually from 2024
 * to reach 3 degrees C above pre-industrial by 2100 (2 degrees C above 2024),
 * 2% rate of time preference. Losses are relative to a no-warming baseline
 * that still has background growth in it. */
DATA.scenario2100 = {
  warming: 'about 3 degrees C above pre-industrial by 2100',
  gdpPerCapita: { value: -53, lo: -77, hi: -29 },
  perDegree: -26,
  capital: -51,
  consumption: -53,
  welfareNow: -35,
  welfareEventual: -56,
  capitalAmplification: 'one fifth',
  buSample: -61
};

/* Warming that has already happened: 1960-2019 counterfactual. */
DATA.alreadyPaid = {
  growthRateReduction: 'one third of baseline by 2019',
  gdpGapToday: 20
};

/* Social cost of carbon, US$ per ton of CO2. */
DATA.scc = [
  { label: 'Rennert et al. (2022)', value: 185, kind: 'prior',
    note: 'The high end of conventional estimates, and the basis for recent US regulatory values.' },
  { label: 'Bilal & Kanzig, local temperature', value: 149, kind: 'prior',
    note: 'The same structural model, re-estimated on local temperature. Not significant at the 5% level.' },
  { label: 'Bilal & Kanzig, global temperature', value: 1207, lo: 399, hi: 2015, kind: 'headline',
    note: 'Six times the high end of existing estimates. Even the bottom of the 95% band, $399, is more than double the conventional value.' }
];

/* Where the wider literature sits. Deliberately includes the estimates that
 * cut against the headline, and the paper that was retracted. */
DATA.literature = [
  {
    label: 'Conventional panel estimates',
    detail: 'Permanent 1 degree C, world output',
    value: -2, lo: -3, hi: -1,
    kind: 'low',
    note: 'The pre-existing consensus that Bilal & Kanzig set out to overturn: a permanent 1 degree C rise lowers world output by 1-3%.'
  },
  {
    label: 'Burke, Hsiang & Miguel (2015)',
    detail: 'Global average income, 2100, unmitigated',
    value: -23,
    kind: 'mid',
    note: 'Nature. Productivity peaks at an annual average temperature of 13 degrees C and falls steeply above it. Widely cited, and widely contested.'
  },
  {
    label: 'Nath, Ramey & Klenow (2024)',
    detail: 'Explicitly a middle position',
    value: null,
    kind: 'mid',
    note: 'Finds warming has persistent but not permanent effects on growth. Their projections are 3-5x larger than level-effect estimates and 2-4x smaller than permanent-growth-effect estimates.'
  },
  {
    label: 'Kotz, Levermann & Wenz (2024)',
    detail: 'World income by 2049 — RETRACTED',
    value: -19, lo: -29, hi: -11,
    kind: 'retracted',
    note: 'Nature, April 2024. Retracted by the authors in December 2025 after critics found anomalies in the Uzbekistan data and understated uncertainty. The authors’ own reanalysis gives 17% rather than 19%, with a wider uncertainty range.'
  },
  {
    label: 'Bilal & Kanzig (2026)',
    detail: 'World GDP per capita, 2100, ~3 degrees C',
    value: -53, lo: -77, hi: -29,
    kind: 'headline',
    note: 'Quarterly Journal of Economics. The estimate this page is built around.'
  }
];

/* Damage already being priced by insurers.
 * Swiss Re Institute, sigma 1/2026 (natural catastrophes in 2025). */
DATA.insurance = {
  year: 2025,
  insuredLosses: 107,
  secondaryPerilShare: 92,
  laWildfires: 40,
  convectiveStorms: 51,
  trendGrowth: '5-7% a year in real terms',
  projected2030: 186
};

/* Benchmarks used to give the headline numbers a human scale. */
DATA.benchmarks = [
  { label: 'US Great Depression', value: 'comparable in size',
    note: 'Bilal & Kanzig describe their central 2100 loss as comparable to the economic losses caused by the 1929 Great Depression — but experienced permanently, not as a decade to recover from.' },
  { label: 'Moving to complete autarky', value: 'about one tenth as costly',
    note: 'The same loss is roughly ten times the cost of moving from today’s trade relations to complete autarky (Arkolakis, Costinot & Rodriguez-Clare 2012).' }
];

/* Full citations. Rendered into the sources section. */
DATA.sources = [
  { id: 'bk', authors: 'Bilal, A. & Kanzig, D. R.', year: 2026,
    title: 'The Macroeconomic Impact of Climate Change: Global Versus Local Temperature',
    venue: 'Quarterly Journal of Economics 141(2), 889-943',
    url: 'https://academic.oup.com/qje/article/141/2/889/8490467',
    role: 'The central source for this page.' },
  { id: 'nrk', authors: 'Nath, I. B., Ramey, V. A. & Klenow, P. J.', year: 2024,
    title: 'How Much Will Global Warming Cool Global Growth?',
    venue: 'NBER Working Paper 32761',
    url: 'https://www.nber.org/papers/w32761',
    role: 'The most careful statement of the middle position.' },
  { id: 'bhm', authors: 'Burke, M., Hsiang, S. M. & Miguel, E.', year: 2015,
    title: 'Global non-linear effect of temperature on economic production',
    venue: 'Nature 527, 235-239',
    url: 'https://www.nature.com/articles/nature15725',
    role: 'The best-known panel estimate.' },
  { id: 'klw', authors: 'Kotz, M., Levermann, A. & Wenz, L.', year: 2024,
    title: 'The economic commitment of climate change (RETRACTED)',
    venue: 'Nature 628, 551-557; retracted December 2025',
    url: 'https://www.nature.com/articles/s41586-024-07219-0',
    role: 'Included because its retraction is part of the honest picture.' },
  { id: 'rennert', authors: 'Rennert, K. et al.', year: 2022,
    title: 'Comprehensive evidence implies a higher social cost of CO2',
    venue: 'Nature 610, 687-692',
    url: 'https://www.nature.com/articles/s41586-022-05224-9',
    role: 'The $185/ton benchmark.' },
  { id: 'gistemp', authors: 'NASA Goddard Institute for Space Studies', year: 2026,
    title: 'GISS Surface Temperature Analysis (GISTEMP v4)',
    venue: 'Land-ocean temperature index, 1880-2025',
    url: 'https://data.giss.nasa.gov/gistemp/',
    role: 'Observed temperature series on this page.' },
  { id: 'wb', authors: 'World Bank', year: 2026,
    title: 'World Development Indicators',
    venue: 'NY.GDP.PCAP.KD and NY.GDP.PCAP.KD.ZG, World aggregate',
    url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.KD.ZG',
    role: 'Observed world GDP per capita series on this page.' },
  { id: 'swissre', authors: 'Swiss Re Institute', year: 2026,
    title: 'sigma 1/2026: natural catastrophes in 2025',
    venue: 'Global insured losses of US$107bn',
    url: 'https://www.swissre.com/institute/research/sigma-research/sigma-2026-01-natcat-2025-wildfire-storm-risk/global-natcat-losses-2025.html',
    role: 'Realised catastrophe losses.' }
];
