/* Public counters use GoatCounter's counter API. Country data comes from the
   aggregate snapshot generated at build time; no private API key reaches browsers. */
(() => {
  'use strict';
  const account = 'senmiaoorz';
  const productionHost = 'senmiaoorz.github.io';
  const $ = (id) => document.getElementById(id);
  if (!$('visitor-world')) return;
  const localPreview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  const periods = { all: 'all time', week: 'last 7 days', month: 'last 30 days' };
  const counters = { all: null, week: null, month: null };
  let snapshot = { available: false, generatedAt: null, total: null, periods: {} };
  let features = [];
  let selected = 'all';
  let countryPaths = [];
  const namespace = 'http://www.w3.org/2000/svg';
  const snapshotUrl = new URL('data/visitors.json', document.baseURI);
  snapshotUrl.searchParams.set('v', Date.now().toString(36));
  const number = (value) => Number.isFinite(value) ? new Intl.NumberFormat('en-US').format(value) : '—';
  const currentPeriod = () => snapshot.periods?.[selected] || { countries: [] };
  const utcStart = (days) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days + 1);
    return date.toISOString().slice(0, 10);
  };
  async function json(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit', cache: 'no-cache' });
      if (!response.ok) throw new Error(`Statistics returned ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  function setStatus() {
    if (localPreview) {
      $('visitor-status').textContent = 'Local preview · your visits here are not counted';
    } else if (snapshot.available && snapshot.generatedAt) {
      const timestamp = new Date(snapshot.generatedAt);
      $('visitor-status').textContent = `Map updated ${timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · refreshes every 6 hours`;
    } else if (counters.all === 0) {
      $('visitor-status').textContent = 'Visitor counting is connected · waiting for the first visits';
    } else {
      $('visitor-status').textContent = 'Visitor counts by GoatCounter · country data is updating';
    }
  }
  function countFor(period) {
    const live = counters[period];
    const saved = snapshot.available ? (period === 'all' ? snapshot.total : snapshot.periods?.[period]?.visits) : null;
    if (!Number.isFinite(live)) return saved;
    if (!Number.isFinite(saved)) return live;
    // Public counters can lag the snapshot by four hours. Never show an older
    // total; compare rolling periods only when their UTC calendar dates match.
    const sameDate = snapshot.generatedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10);
    return period === 'all' || sameDate ? Math.max(live, saved) : live;
  }
  function knownTotal() { return countFor('all'); }
  function render() {
    const period = currentPeriod();
    const countries = period.countries || [];
    const canShowMap = snapshot.available || knownTotal() === 0;
    const recentPeriod = selected === 'month' ? 'month' : 'week';
    const recent = countFor(recentPeriod);
    $('visits-total').textContent = number(knownTotal());
    $('visits-recent').textContent = number(recent);
    $('visits-recent-label').textContent = `in the ${periods[recentPeriod]}`;
    $('visits-countries').textContent = canShowMap ? number(countries.filter((item) => item.count > 0).length) : '—';
    $('visits-country-label').textContent = selected === 'all' ? 'from all over the world' : `in the ${periods[selected]}`;
    $('map-period-label').textContent = `Visitor distribution · ${periods[selected]}`;
    const counts = new Map(countries.map((item) => [item.code, item.count]));
    const maximum = Math.max(1, ...countries.map((item) => item.count));
    countryPaths.forEach(({ path, feature }) => {
      const visits = counts.get(feature.properties.code) || 0;
      const heat = visits > 0 ? Math.max(1, Math.ceil(Math.log1p(visits) / Math.log1p(maximum) * 4)) : 0;
      path.setAttribute('class', `map-country heat-${heat}`);
      const text = `${feature.properties.name}: ${canShowMap ? number(visits) + ' visits' : 'waiting for data'}`;
      path.querySelector('title').textContent = text;
      path.setAttribute('aria-label', text);
      // Only countries with visits join keyboard navigation; zero-visit countries
      // remain discoverable with the pointer and the map's accessible summary.
      if (visits > 0) path.setAttribute('tabindex', '0'); else path.removeAttribute('tabindex');
    });
    $('world-map-description').textContent = canShowMap ?
      `Aggregate website visits by country for ${periods[selected]}. ${countries.length} countries and regions have recorded visits. Darker green means more visits.` :
      'The world map is ready. Country statistics will appear after the first data refresh.';
    $('visitor-empty').hidden = countries.length > 0;
    $('visitor-empty').textContent = knownTotal() === 0 ? 'Your first visitors will light up this map.' :
      snapshot.available ? 'No visits recorded for this period yet.' : 'The map is ready. Country statistics will appear after the first refresh.';
    const list = $('visitor-country-list');
    list.replaceChildren();
    countries.slice(0, 5).forEach((country) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      const count = document.createElement('strong');
      name.textContent = country.name;
      count.textContent = number(country.count);
      item.append(name, count);
      list.append(item);
    });
    setStatus();
  }
  function showTooltip(event, feature) {
    const country = (currentPeriod().countries || []).find((item) => item.code === feature.properties.code);
    const ready = snapshot.available || knownTotal() === 0;
    const tooltip = $('map-tooltip');
    tooltip.textContent = `${feature.properties.name} · ${ready ? number(country?.count || 0) + ' visits' : 'waiting for data'}`;
    tooltip.hidden = false;
    const bounds = $('visitor-map-container').getBoundingClientRect();
    const anchor = event.clientX === undefined ? event.target.getBoundingClientRect() : null;
    const x = event.clientX ?? (anchor.left + anchor.width / 2);
    const y = event.clientY ?? (anchor.top + anchor.height / 2);
    tooltip.style.left = `${Math.max(8, Math.min(bounds.width - tooltip.offsetWidth - 8, x - bounds.left + 10))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(bounds.height - tooltip.offsetHeight - 8, y - bounds.top - tooltip.offsetHeight - 8))}px`;
  }
  function drawMap() {
    if (!window.d3?.geoNaturalEarth1) throw new Error('Map library unavailable');
    const collection = { type: 'FeatureCollection', features };
    const projection = d3.geoNaturalEarth1().fitExtent([[15, 10], [785, 370]], collection);
    const geometry = d3.geoPath(projection);
    const svg = $('visitor-world');
    const graticule = document.createElementNS(namespace, 'path');
    graticule.setAttribute('d', geometry(d3.geoGraticule10()));
    graticule.setAttribute('class', 'map-graticule');
    graticule.setAttribute('aria-hidden', 'true');
    svg.append(graticule);
    countryPaths = features.map((feature) => {
      const path = document.createElementNS(namespace, 'path');
      path.setAttribute('d', geometry(feature));
      path.setAttribute('class', 'map-country heat-0');
      const title = document.createElementNS(namespace, 'title');
      path.append(title);
      path.addEventListener('pointerenter', (event) => showTooltip(event, feature));
      path.addEventListener('pointermove', (event) => showTooltip(event, feature));
      path.addEventListener('pointerleave', () => { $('map-tooltip').hidden = true; });
      path.addEventListener('focus', (event) => showTooltip(event, feature));
      path.addEventListener('blur', () => { $('map-tooltip').hidden = true; });
      svg.append(path);
      return { path, feature };
    });
  }
  async function loadCounters() {
    await Promise.allSettled(Object.entries({ all: '', week: utcStart(7), month: utcStart(30) }).map(async ([period, start]) => {
      const url = new URL(`https://${account}.goatcounter.com/counter/TOTAL.json`);
      if (start) url.searchParams.set('start', start);
      const response = await json(url.href);
      const parsed = Number(String(response.count).replace(/[,\s]/g, ''));
      if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Invalid visitor count');
      counters[period] = parsed;
      render();
    }));
    render();
  }
  document.querySelectorAll('[data-visitor-period]').forEach((button) => {
    button.addEventListener('click', () => {
      selected = button.dataset.visitorPeriod;
      document.querySelectorAll('[data-visitor-period]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      $('map-tooltip').hidden = true;
      render();
    });
  });
  Promise.allSettled([
    json(new URL('assets/world.geojson', document.baseURI)).then((world) => { features = world.features; drawMap(); render(); }).catch(() => {
      $('visitor-empty').textContent = 'The map could not load. Visitor counts are still available.';
    }),
    json(snapshotUrl).then((data) => { snapshot = data; render(); }).catch(() => render()),
    loadCounters()
  ]);
  // Never record local development or unrelated preview domains in live totals.
  // GoatCounter also filters localhost itself, providing a second safeguard.
  if (location.hostname === productionHost) {
    const script = document.createElement('script');
    script.src = 'https://gc.zgo.at/count.v5.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.integrity = 'sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ';
    script.dataset.goatcounter = `https://${account}.goatcounter.com/count`;
    script.dataset.goatcounterSettings = JSON.stringify({ path: '/' });
    document.head.append(script);
  }
})();
