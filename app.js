const state = {
  variants: [null, null, null],
  avatar: null,
  deviceMode: 'desktop',
  surfaceMode: 'home',
  recallNotes: ['', '', ''],
  flickerTimer: null,
  flickerOnLeft: true,
  competitors: [],
  competitorInsertIndex: 0,
  isLoadingCompetitors: false,
  scores: [
    { readability: 7, focal: 7, curiosity: 7, clarity: 7 },
    { readability: 7, focal: 7, curiosity: 7, clarity: 7 },
    { readability: 7, focal: 7, curiosity: 7, clarity: 7 }
  ]
};

const letters = ['A', 'B', 'C'];
const $ = (id) => document.getElementById(id);

const els = {
  variantGrid: $('variantGrid'),
  videoTitle: $('videoTitle'),
  titleCount: $('titleCount'),
  channelName: $('channelName'),
  viewsText: $('viewsText'),
  publishedText: $('publishedText'),
  avatarInput: $('avatarInput'),
  blurToggle: $('blurToggle'),
  grayToggle: $('grayToggle'),
  dimToggle: $('dimToggle'),
  feedVariant: $('feedVariant'),
  deviceTabs: $('deviceTabs'),
  surfaceTabs: $('surfaceTabs'),
  deviceStage: $('deviceStage'),
  metricsTable: $('metricsTable'),
  scorecard: $('scorecard'),
  compareCanvas: $('compareCanvas'),
  compareLeft: $('compareLeft'),
  compareRight: $('compareRight'),
  flickerBtn: $('flickerBtn'),
  flashBtn: $('flashBtn'),
  flashDuration: $('flashDuration'),
  flashVersion: $('flashVersion'),
  flashOverlay: $('flashOverlay'),
  flashCard: $('flashCard'),
  recallModal: $('recallModal'),
  recallText: $('recallText'),
  closeRecall: $('closeRecall'),
  saveRecall: $('saveRecall'),
  resetBtn: $('resetBtn'),
  demoBtn: $('demoBtn'),
  installBtn: $('installBtn'),
  installModal: $('installModal'),
  closeInstall: $('closeInstall'),
  topicChips: $('topicChips'),
  competitorQuery: $('competitorQuery'),
  searchForm: $('searchForm'),
  youtubeApiKey: $('youtubeApiKey'),
  resultCount: $('resultCount'),
  timeRange: $('timeRange'),
  sortOrder: $('sortOrder'),
  gamingOnly: $('gamingOnly'),
  loadCompetitorsBtn: $('loadCompetitorsBtn'),
  shuffleCompetitorsBtn: $('shuffleCompetitorsBtn'),
  clearCompetitorsBtn: $('clearCompetitorsBtn'),
  competitorStatus: $('competitorStatus')
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function persistAppState() {
  localStorage.setItem('thumbnailLabSettings', JSON.stringify({
    title: els.videoTitle.value,
    channel: els.channelName.value,
    views: els.viewsText.value,
    published: els.publishedText.value,
    scores: state.scores,
    notes: state.recallNotes,
    deviceMode: state.deviceMode,
    surfaceMode: state.surfaceMode,
    competitorQuery: els.competitorQuery.value,
    youtubeApiKey: els.youtubeApiKey.value,
    resultCount: els.resultCount.value,
    timeRange: els.timeRange.value,
    sortOrder: els.sortOrder.value,
    feedVariant: els.feedVariant.value,
    gamingOnly: els.gamingOnly.checked,
    competitors: state.competitors,
    competitorInsertIndex: state.competitorInsertIndex
  }));
}

function restoreAppState() {
  try {
    const s = JSON.parse(localStorage.getItem('thumbnailLabSettings') || '{}');
    if (s.title) els.videoTitle.value = s.title;
    if (s.channel) els.channelName.value = s.channel;
    if (s.views) els.viewsText.value = s.views;
    if (s.published) els.publishedText.value = s.published;
    if (s.deviceMode) state.deviceMode = s.deviceMode;
    if (s.surfaceMode) state.surfaceMode = s.surfaceMode;
    if (s.competitorQuery) els.competitorQuery.value = s.competitorQuery;
    if (s.youtubeApiKey) els.youtubeApiKey.value = s.youtubeApiKey;
    if (s.resultCount) els.resultCount.value = s.resultCount;
    if (s.timeRange) els.timeRange.value = s.timeRange;
    if (s.sortOrder) els.sortOrder.value = s.sortOrder;
    if (s.feedVariant !== undefined) els.feedVariant.value = s.feedVariant;
    if (typeof s.gamingOnly === 'boolean') els.gamingOnly.checked = s.gamingOnly;
    if (Array.isArray(s.scores) && s.scores.length === 3) state.scores = s.scores;
    if (Array.isArray(s.notes) && s.notes.length === 3) state.recallNotes = s.notes;
    if (Array.isArray(s.competitors)) state.competitors = s.competitors;
    if (Number.isInteger(s.competitorInsertIndex)) state.competitorInsertIndex = s.competitorInsertIndex;
  } catch (_) {}
}

function setCompetitorStatus(message, kind = 'neutral') {
  els.competitorStatus.textContent = message;
  els.competitorStatus.dataset.kind = kind;
}

function updateActionLabels() {
  els.loadCompetitorsBtn.disabled = state.isLoadingCompetitors;
  els.loadCompetitorsBtn.textContent = state.isLoadingCompetitors ? 'Loading…' : 'Load YouTube competitors';
}

function parseQueries(raw) {
  return raw
    .split(/[\n,]+/)
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function randomInt(max) {
  return Math.floor(Math.random() * Math.max(1, max));
}

function firstLoadedIndex() {
  const idx = state.variants.findIndex(Boolean);
  return idx === -1 ? 0 : idx;
}

function activeFeedVariantIndex() {
  const selected = Number(els.feedVariant.value);
  return state.variants[selected] ? selected : firstLoadedIndex();
}

function shuffleUserPlacement() {
  const total = state.competitors.length || state.variants.filter(Boolean).length || 1;
  state.competitorInsertIndex = randomInt(total + 1);
  persistAppState();
  renderPreviewStage();
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function calculateMetrics(src) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  const w = 160;
  const h = 90;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let lumSum = 0;
  let lumSq = 0;
  let satSum = 0;
  let edgeSum = 0;
  const lums = new Float32Array(w * h);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const sat = max === 0 ? 0 : (max - min) / max;
    lums[p] = lum;
    lumSum += lum;
    lumSq += lum * lum;
    satSum += sat;
  }

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = lums[p + 1] - lums[p - 1];
      const gy = lums[p + w] - lums[p - w];
      edgeSum += Math.min(1, Math.hypot(gx, gy) * 3);
    }
  }

  const n = w * h;
  const mean = lumSum / n;
  const std = Math.sqrt(Math.max(0, lumSq / n - mean * mean));
  return {
    brightness: Math.round(mean * 100),
    contrast: Math.round(Math.min(100, std * 260)),
    saturation: Math.round((satSum / n) * 100),
    detail: Math.round(Math.min(100, (edgeSum / ((w - 2) * (h - 2))) * 100))
  };
}

function metricLabel(value, metric) {
  if (metric === 'detail') return value < 24 ? 'simple' : value > 58 ? 'busy' : 'balanced';
  if (metric === 'brightness') return value < 34 ? 'dark' : value > 69 ? 'bright' : 'mid';
  if (metric === 'contrast') return value < 28 ? 'soft' : value > 62 ? 'strong' : 'moderate';
  if (metric === 'saturation') return value < 28 ? 'muted' : value > 67 ? 'vivid' : 'moderate';
  return '';
}

async function setVariant(index, file) {
  const src = await fileToDataURL(file);
  const img = await loadImage(src);
  state.variants[index] = {
    src,
    name: file.name,
    width: img.naturalWidth,
    height: img.naturalHeight,
    metrics: await calculateMetrics(src)
  };
  renderAll();
}

function buildVariants() {
  const tpl = document.getElementById('variantTemplate');
  letters.forEach((letter, index) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.index = index;
    node.querySelector('.variant-letter').textContent = letter;
    const input = node.querySelector('.thumb-input');
    const drop = node.querySelector('.drop-zone');
    input.addEventListener('change', (e) => e.target.files[0] && setVariant(index, e.target.files[0]));
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove('dragging');
    }));
    drop.addEventListener('drop', (e) => e.dataTransfer.files[0] && setVariant(index, e.dataTransfer.files[0]));
    node.querySelector('.clear-image').addEventListener('click', () => {
      state.variants[index] = null;
      input.value = '';
      renderAll();
    });
    els.variantGrid.appendChild(node);
  });
}

function renderVariantCards() {
  [...els.variantGrid.children].forEach((card, i) => {
    const v = state.variants[i];
    const img = card.querySelector('.thumb-preview');
    const meta = card.querySelector('.file-meta');
    card.classList.toggle('has-image', !!v);
    if (v) {
      img.src = v.src;
      meta.textContent = `${v.name} • ${v.width} × ${v.height}`;
    } else {
      img.removeAttribute('src');
      meta.textContent = 'No image loaded';
    }
  });
}

function formatViewCount(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '0 views';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(num >= 10_000_000_000 ? 0 : 1).replace(/\.0$/, '')}B views`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K views`;
  return `${num} views`;
}

function formatRelativeTime(isoDate) {
  const date = new Date(isoDate);
  const ms = Date.now() - date.getTime();
  if (!Number.isFinite(ms)) return '';
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = day * 365;
  if (ms < hour) return `${Math.max(1, Math.round(ms / minute))} minutes ago`;
  if (ms < day) return `${Math.round(ms / hour)} hours ago`;
  if (ms < month) return `${Math.round(ms / day)} days ago`;
  if (ms < year) return `${Math.round(ms / month)} months ago`;
  return `${Math.round(ms / year)} years ago`;
}

function parseDuration(iso) {
  if (!iso) return '—';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '—';
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function placeholderAvatar(name) {
  const initial = escapeHtml((name || '?').trim().charAt(0).toUpperCase() || '?');
  return `<div class="yt-avatar avatar-initial">${initial}</div>`;
}

function getUserVideoData(index) {
  const v = state.variants[index];
  return {
    kind: 'user',
    index,
    title: els.videoTitle.value || 'Untitled video',
    channel: els.channelName.value || 'Your channel',
    viewsText: els.viewsText.value || '0 views',
    publishedAtText: els.publishedText.value || 'just now',
    durationText: '8:42',
    thumbnail: v?.src || '',
    description: 'Your test thumbnail inside a realistic YouTube-style layout.',
    hasImage: !!v
  };
}

function createCompetitorEntry(item) {
  return {
    kind: 'competitor',
    title: item.title || 'YouTube video',
    channel: item.channel || 'Channel',
    viewsText: item.viewsText || formatViewCount(item.views),
    publishedAtText: item.relativePublished || formatRelativeTime(item.publishedAt),
    durationText: item.durationText || '—',
    thumbnail: item.thumbnail || '',
    description: item.description || 'Real competitor video pulled from the YouTube API.',
    videoId: item.videoId || ''
  };
}

function buildHomeEntries() {
  if (state.competitors.length) {
    const entries = state.competitors.map(createCompetitorEntry);
    const activeIndex = activeFeedVariantIndex();
    if (state.variants[activeIndex]) {
      const insertAt = Math.min(state.competitorInsertIndex, entries.length);
      entries.splice(insertAt, 0, getUserVideoData(activeIndex));
    }
    return entries;
  }
  return letters.map((_, i) => getUserVideoData(i));
}

function getWatchModel() {
  if (state.competitors.length) {
    const sidebarItems = state.competitors.map(createCompetitorEntry);
    const activeIndex = activeFeedVariantIndex();
    const main = state.variants[activeIndex] ? getUserVideoData(activeIndex) : (sidebarItems.shift() || getUserVideoData(activeIndex));
    return { main, sidebarItems };
  }
  const activeIndex = activeFeedVariantIndex();
  const main = getUserVideoData(activeIndex);
  const filteredSidebar = state.variants
    .map((_, i) => i)
    .filter((i) => i !== activeIndex)
    .map((i) => getUserVideoData(i));
  return { main, sidebarItems: filteredSidebar };
}

function renderTopicChips() {
  const queries = parseQueries(els.competitorQuery.value || '');
  const labels = ['Test feed', ...queries.slice(0, 4)];
  if (!labels.some((label) => label.toLowerCase() === 'gaming')) labels.push('Gaming');
  labels.push(state.competitors.length ? `${state.competitors.length} loaded` : 'Load real YouTube competitors');
  els.topicChips.innerHTML = labels.map((label, index) => {
    const cls = index === 0 ? 'topic-chip active' : (index === labels.length - 1 ? 'topic-chip subtle-chip' : 'topic-chip');
    return `<span class="${cls}">${escapeHtml(label)}</span>`;
  }).join('');
}

function standardCard(entry) {
  const hasImage = !!entry.thumbnail;
  const avatar = state.avatar && entry.kind === 'user'
    ? `<img class="yt-avatar" src="${state.avatar}" alt="Channel avatar">`
    : placeholderAvatar(entry.channel);
  const linkOpen = entry.kind === 'competitor' && entry.videoId ? `<a class="yt-card-link" href="https://www.youtube.com/watch?v=${encodeURIComponent(entry.videoId)}" target="_blank" rel="noopener">` : '<div class="yt-card-link">';
  const linkClose = entry.kind === 'competitor' && entry.videoId ? '</a>' : '</div>';
  return `<article class="yt-card ${entry.kind === 'user' ? 'user-card' : 'competitor-card'} ${hasImage ? '' : 'no-image'}">
    ${linkOpen}
      <div class="yt-thumb">
        ${hasImage ? `<img src="${entry.thumbnail}" alt="${escapeHtml(entry.title)}">` : `<div class="empty-state">Upload ${letters[entry.index] || 'a'} thumbnail</div>`}
        ${entry.kind === 'user' ? `<span class="feed-badge">Your ${letters[entry.index]}</span>` : ''}
        ${entry.kind === 'competitor' ? `<span class="video-kind-pill">Live</span>` : ''}
        ${hasImage ? `<span class="duration-pill">${escapeHtml(entry.durationText)}</span>` : ''}
      </div>
      <div class="yt-meta">
        ${avatar}
        <div>
          <div class="yt-title">${escapeHtml(entry.title)}</div>
          <div class="yt-sub">${escapeHtml(entry.channel)}<br>${escapeHtml(entry.viewsText)} • ${escapeHtml(entry.publishedAtText)}</div>
        </div>
      </div>
    ${linkClose}
  </article>`;
}

function searchRow(entry) {
  const hasImage = !!entry.thumbnail;
  return `<article class="search-row ${entry.kind === 'user' ? 'user-card' : 'competitor-card'}">
    <div class="yt-thumb">
      ${hasImage ? `<img src="${entry.thumbnail}" alt="${escapeHtml(entry.title)}">` : `<div class="empty-state">No thumbnail</div>`}
      ${entry.kind === 'user' ? `<span class="feed-badge">Your ${letters[entry.index]}</span>` : ''}
      ${hasImage ? `<span class="duration-pill">${escapeHtml(entry.durationText)}</span>` : ''}
    </div>
    <div class="search-copy">
      <div class="yt-title">${escapeHtml(entry.title)}</div>
      <div class="yt-sub">${escapeHtml(entry.channel)} • ${escapeHtml(entry.viewsText)} • ${escapeHtml(entry.publishedAtText)}</div>
      <div class="search-description">${escapeHtml(entry.description)}</div>
    </div>
  </article>`;
}

function sidebarCard(entry) {
  const hasImage = !!entry.thumbnail;
  return `<article class="sidebar-card ${entry.kind === 'user' ? 'user-card' : 'competitor-card'}">
    <div class="yt-thumb">
      ${hasImage ? `<img src="${entry.thumbnail}" alt="${escapeHtml(entry.title)}">` : `<div class="empty-state">No thumbnail</div>`}
      ${entry.kind === 'user' ? `<span class="feed-badge">Your ${letters[entry.index]}</span>` : ''}
      ${hasImage ? `<span class="duration-pill">${escapeHtml(entry.durationText)}</span>` : ''}
    </div>
    <div class="yt-meta">
      <div>
        <div class="yt-title">${escapeHtml(entry.title)}</div>
        <div class="yt-sub">${escapeHtml(entry.channel)}<br>${escapeHtml(entry.viewsText)} • ${escapeHtml(entry.publishedAtText)}</div>
      </div>
    </div>
  </article>`;
}

function previewHeader() {
  return `<div class="preview-topbar">
    <div class="preview-brand">
      <span class="preview-mini-mark"></span>
      <span class="preview-title-small">YouTube preview</span>
    </div>
    <div class="preview-search-visual">${escapeHtml(els.competitorQuery.value || 'Search competitors')}</div>
    <div class="preview-actions">
      <span class="preview-action-dot"></span>
      <span class="preview-action-dot"></span>
      <span class="preview-action-dot"></span>
    </div>
  </div>`;
}

function previewRail() {
  return `<aside class="preview-left-rail">
    <div class="preview-rail-item active">Home</div>
    <div class="preview-rail-item">Shorts</div>
    <div class="preview-rail-item">Subs</div>
    <div class="preview-rail-item">You</div>
  </aside>`;
}

function previewChips() {
  const queries = parseQueries(els.competitorQuery.value || 'Hytale, Minecraft');
  const chips = ['All', ...queries.slice(0, 3), 'PvP'];
  return `<div class="preview-chip-row">${chips.map((chip, i) => `<span class="preview-chip ${i === 0 ? 'active' : ''}">${escapeHtml(chip)}</span>`).join('')}<span class="preview-chip subtle">${state.competitors.length ? state.competitors.length + ' competitors' : 'No competitors yet'}</span></div>`;
}

function previewBodyContent() {
  const entries = buildHomeEntries();
  if (state.surfaceMode === 'home') {
    return `${previewChips()}<div class="feed-grid">${entries.map(standardCard).join('')}</div>`;
  }
  if (state.surfaceMode === 'search') {
    return `<div class="search-results">${entries.map(searchRow).join('')}</div>`;
  }
  const watch = getWatchModel();
  const main = watch.main;
  const hasImage = !!main.thumbnail;
  const sidebarItems = watch.sidebarItems.length ? watch.sidebarItems : entries.filter((entry) => entry !== main).slice(0, 8);
  return `<div class="watch-layout">
    <div class="watch-main">
      <div class="watch-player">
        ${hasImage ? `<img src="${main.thumbnail}" alt="${escapeHtml(main.title)}">` : `<div class="empty-state">No thumbnail loaded</div>`}
        ${main.kind === 'user' ? `<span class="feed-badge">Your ${letters[main.index]}</span>` : ''}
      </div>
      <div class="watch-title">${escapeHtml(main.title)}</div>
      <div class="watch-meta-line">${escapeHtml(main.channel)} • ${escapeHtml(main.viewsText)} • ${escapeHtml(main.publishedAtText)}</div>
    </div>
    <div class="watch-sidebar">${sidebarItems.map(sidebarCard).join('')}</div>
  </div>`;
}

function renderPreviewStage() {
  const effectClasses = [
    els.blurToggle.checked ? 'effect-blur' : '',
    els.grayToggle.checked ? 'effect-gray' : '',
    els.dimToggle.checked ? 'effect-dim' : ''
  ].filter(Boolean).join(' ');

  els.deviceStage.innerHTML = `<div class="youtube-preview ${state.deviceMode} ${state.surfaceMode} ${effectClasses}">
    ${previewHeader()}
    <div class="preview-shell-grid">
      ${state.deviceMode === 'mobile' ? '' : previewRail()}
      <section class="preview-content">
        ${previewBodyContent()}
      </section>
    </div>
  </div>`;
}

function renderMetrics() {
  const rows = ['brightness', 'contrast', 'saturation', 'detail'];
  els.metricsTable.innerHTML = `<div class="metric-row header"><div></div>${letters.map((x) => `<div>${x}</div>`).join('')}</div>` +
    rows.map((metric) => `<div class="metric-row"><div class="metric-label">${capitalize(metric)}</div>${state.variants.map((v) => v ? `<div class="metric-cell">${v.metrics[metric]}<small>${metricLabel(v.metrics[metric], metric)}</small></div>` : `<div class="metric-cell">—<small>no image</small></div>`).join('')}</div>`).join('');
}

function scoreAverage(obj) {
  return Math.round(Object.values(obj).reduce((a, b) => a + Number(b), 0) / Object.keys(obj).length * 10) / 10;
}

function renderScorecard() {
  const dims = [['readability', 'Readability'], ['focal', 'Focal point'], ['curiosity', 'Curiosity'], ['clarity', 'Clarity']];
  let html = '';
  dims.forEach(([key, label]) => {
    html += `<div class="score-row"><label>${label}</label><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">`;
    state.scores.forEach((s, i) => {
      html += `<input type="range" min="1" max="10" value="${s[key]}" data-score-key="${key}" data-score-index="${i}" title="${letters[i]}: ${s[key]}">`;
    });
    html += `</div><div class="score-value">1–10</div></div>`;
  });
  html += `<div class="score-summary">${state.scores.map((s, i) => `<div class="score-pill"><strong>${scoreAverage(s)}</strong><span>${letters[i]} average</span>${state.recallNotes[i] ? `<div class="recall-note">Flash note: ${escapeHtml(state.recallNotes[i])}</div>` : ''}</div>`).join('')}</div>`;
  els.scorecard.innerHTML = html;
  els.scorecard.querySelectorAll('input[type="range"]').forEach((input) => input.addEventListener('input', (e) => {
    const i = Number(e.target.dataset.scoreIndex);
    const key = e.target.dataset.scoreKey;
    state.scores[i][key] = Number(e.target.value);
    persistAppState();
    renderScorecard();
  }));
}

function renderCompare() {
  const a = state.variants[Number(els.compareLeft.value)];
  const b = state.variants[Number(els.compareRight.value)];
  if (!a || !b) {
    els.compareCanvas.innerHTML = '<div class="empty-state">Upload both selected thumbnails to compare them.</div>';
    return;
  }
  const current = state.flickerOnLeft ? a : b;
  els.compareCanvas.innerHTML = `<img src="${current.src}" alt="Flicker comparison">`;
}

function setSegmentedState(container, activeValue, attr) {
  [...container.querySelectorAll('button')].forEach((button) => {
    button.classList.toggle('active', button.dataset[attr] === activeValue);
  });
}

function renderAll() {
  renderVariantCards();
  renderTopicChips();
  renderPreviewStage();
  renderMetrics();
  renderScorecard();
  renderCompare();
  setSegmentedState(els.deviceTabs, state.deviceMode, 'device');
  setSegmentedState(els.surfaceTabs, state.surfaceMode, 'surface');
  els.titleCount.textContent = els.videoTitle.value.length;
  persistAppState();
}

function startFlicker() {
  const a = state.variants[Number(els.compareLeft.value)];
  const b = state.variants[Number(els.compareRight.value)];
  if (!a || !b) return;
  if (state.flickerTimer) {
    clearInterval(state.flickerTimer);
    state.flickerTimer = null;
    els.flickerBtn.textContent = 'Start flicker';
    return;
  }
  els.flickerBtn.textContent = 'Stop flicker';
  state.flickerTimer = setInterval(() => {
    state.flickerOnLeft = !state.flickerOnLeft;
    renderCompare();
  }, 450);
}

function startFlashTest() {
  const i = Number(els.flashVersion.value);
  const v = state.variants[i];
  if (!v) {
    alert(`Upload thumbnail ${letters[i]} first.`);
    return;
  }
  els.flashCard.innerHTML = `<img src="${v.src}" alt="Flash thumbnail">`;
  els.flashOverlay.classList.remove('hidden');
  setTimeout(() => {
    els.flashOverlay.classList.add('hidden');
    els.recallText.value = state.recallNotes[i] || '';
    els.recallText.dataset.index = i;
    els.recallModal.classList.remove('hidden');
    els.recallText.focus();
  }, Number(els.flashDuration.value));
}

function svgDemo(text, bg1, bg2, accent) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="900" cy="360" r="240" fill="${accent}" opacity=".85"/><rect x="90" y="110" width="530" height="500" rx="45" fill="#101114" opacity=".82"/><text x="145" y="300" fill="white" font-family="Arial" font-size="84" font-weight="900">${text}</text><text x="145" y="390" fill="white" font-family="Arial" font-size="38" font-weight="700">PVP SERVER</text><text x="145" y="450" fill="${accent}" font-family="Arial" font-size="48" font-weight="900">PLAY NOW</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function loadDemo() {
  const demos = [
    svgDemo('BIGGEST', '#161616', '#3c2500', '#ffd400'),
    svgDemo('1000 HRS', '#0c1422', '#273d62', '#6fd6ff'),
    svgDemo('PVP?', '#291010', '#5b1717', '#ff6b6b')
  ];
  for (let i = 0; i < 3; i++) {
    state.variants[i] = {
      src: demos[i],
      name: `Demo ${letters[i]}.svg`,
      width: 1280,
      height: 720,
      metrics: await calculateMetrics(demos[i])
    };
  }
  renderAll();
}

function buildPublishedAfter() {
  if (els.timeRange.value === 'all') return '';
  const days = Number(els.timeRange.value);
  if (!Number.isFinite(days)) return '';
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    const message = data?.error?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function loadCompetitors() {
  const apiKey = els.youtubeApiKey.value.trim();
  const queries = parseQueries(els.competitorQuery.value);
  if (!apiKey) {
    setCompetitorStatus('Paste a YouTube Data API key first.', 'error');
    els.youtubeApiKey.focus();
    return;
  }
  if (!queries.length) {
    setCompetitorStatus('Enter at least one search query.', 'error');
    els.competitorQuery.focus();
    return;
  }

  state.isLoadingCompetitors = true;
  updateActionLabels();
  setCompetitorStatus('Loading competitor videos from YouTube…', 'loading');

  try {
    const desiredTotal = Number(els.resultCount.value) || 12;
    const perQuery = Math.max(1, Math.ceil(desiredTotal / queries.length));
    const publishedAfter = buildPublishedAfter();
    const searchResponses = await Promise.all(queries.map(async (query) => {
      const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        maxResults: String(Math.min(25, perQuery)),
        q: query,
        order: els.sortOrder.value,
        key: apiKey
      });
      if (publishedAfter) params.set('publishedAfter', publishedAfter);
      if (els.gamingOnly.checked) params.set('videoCategoryId', '20');
      return fetchJson(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    }));

    const idSet = new Set();
    searchResponses.forEach((resp) => {
      (resp.items || []).forEach((item) => {
        const id = item.id?.videoId;
        if (id) idSet.add(id);
      });
    });

    const ids = [...idSet];
    if (!ids.length) {
      state.competitors = [];
      state.competitorInsertIndex = 0;
      setCompetitorStatus('No matching competitor videos were found.', 'error');
      renderAll();
      return;
    }

    const detailParams = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: ids.slice(0, 50).join(','),
      key: apiKey
    });
    const detailData = await fetchJson(`https://www.googleapis.com/youtube/v3/videos?${detailParams.toString()}`);
    let competitors = (detailData.items || []).map((item) => ({
      videoId: item.id,
      title: item.snippet?.title || 'YouTube video',
      channel: item.snippet?.channelTitle || 'Channel',
      publishedAt: item.snippet?.publishedAt || '',
      relativePublished: formatRelativeTime(item.snippet?.publishedAt || ''),
      views: Number(item.statistics?.viewCount || 0),
      viewsText: formatViewCount(item.statistics?.viewCount || 0),
      thumbnail:
        item.snippet?.thumbnails?.maxres?.url ||
        item.snippet?.thumbnails?.standard?.url ||
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url || '',
      durationText: parseDuration(item.contentDetails?.duration || ''),
      description: `Real ${queries.join(' / ')} competitor video surfaced from YouTube.`
    })).filter((item) => item.thumbnail);

    if (els.sortOrder.value === 'viewCount') {
      competitors.sort((a, b) => b.views - a.views);
    } else if (els.sortOrder.value === 'date') {
      competitors.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }

    competitors = competitors.slice(0, desiredTotal);
    state.competitors = competitors;
    state.competitorInsertIndex = randomInt(competitors.length + 1);
    setCompetitorStatus(`Loaded ${competitors.length} real YouTube thumbnails for ${queries.join(', ')}.`, 'success');
    renderAll();
  } catch (error) {
    console.error(error);
    setCompetitorStatus(`YouTube load failed: ${error.message}`, 'error');
  } finally {
    state.isLoadingCompetitors = false;
    updateActionLabels();
    persistAppState();
  }
}

function clearCompetitors() {
  state.competitors = [];
  state.competitorInsertIndex = 0;
  setCompetitorStatus('No competitor videos loaded yet.', 'neutral');
  renderAll();
}

['input', 'change'].forEach((ev) => {
  [
    els.videoTitle,
    els.channelName,
    els.viewsText,
    els.publishedText,
    els.blurToggle,
    els.grayToggle,
    els.dimToggle,
    els.feedVariant,
    els.competitorQuery,
    els.youtubeApiKey,
    els.resultCount,
    els.timeRange,
    els.sortOrder,
    els.gamingOnly
  ].forEach((el) => el.addEventListener(ev, renderAll));
});

els.avatarInput.addEventListener('change', async (e) => {
  if (e.target.files[0]) {
    state.avatar = await fileToDataURL(e.target.files[0]);
    renderAll();
  }
});

els.deviceTabs.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-device]');
  if (!button) return;
  state.deviceMode = button.dataset.device;
  renderAll();
});

els.surfaceTabs.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-surface]');
  if (!button) return;
  state.surfaceMode = button.dataset.surface;
  renderAll();
});

els.compareLeft.addEventListener('change', renderCompare);
els.compareRight.addEventListener('change', renderCompare);
els.flickerBtn.addEventListener('click', startFlicker);
els.flashBtn.addEventListener('click', startFlashTest);
els.closeRecall.addEventListener('click', () => els.recallModal.classList.add('hidden'));
els.saveRecall.addEventListener('click', () => {
  const i = Number(els.recallText.dataset.index);
  state.recallNotes[i] = els.recallText.value.trim();
  persistAppState();
  els.recallModal.classList.add('hidden');
  renderScorecard();
});

els.resetBtn.addEventListener('click', () => {
  if (!confirm('Reset the tester and clear saved notes/settings?')) return;
  if (state.flickerTimer) clearInterval(state.flickerTimer);
  state.variants = [null, null, null];
  state.avatar = null;
  state.deviceMode = 'desktop';
  state.surfaceMode = 'home';
  state.recallNotes = ['', '', ''];
  state.competitors = [];
  state.competitorInsertIndex = 0;
  state.scores = state.scores.map(() => ({ readability: 7, focal: 7, curiosity: 7, clarity: 7 }));
  localStorage.removeItem('thumbnailLabSettings');
  els.videoTitle.value = "I Run Hytale's Biggest PvP Server";
  els.channelName.value = 'MattHytale';
  els.viewsText.value = '43K views';
  els.publishedText.value = '2 hours ago';
  els.competitorQuery.value = 'Hytale, Minecraft';
  els.youtubeApiKey.value = '';
  els.resultCount.value = '12';
  els.timeRange.value = '90';
  els.sortOrder.value = 'viewCount';
  els.feedVariant.value = '0';
  els.gamingOnly.checked = true;
  setCompetitorStatus('No competitor videos loaded yet.', 'neutral');
  renderAll();
});

els.demoBtn.addEventListener('click', loadDemo);
els.searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loadCompetitors();
});
els.loadCompetitorsBtn.addEventListener('click', loadCompetitors);
els.shuffleCompetitorsBtn.addEventListener('click', shuffleUserPlacement);
els.clearCompetitorsBtn.addEventListener('click', clearCompetitors);

restoreAppState();
buildVariants();
updateActionLabels();
if (state.competitors.length) {
  setCompetitorStatus(`Loaded ${state.competitors.length} competitor thumbnails from a previous session.`, 'success');
} else {
  setCompetitorStatus('No competitor videos loaded yet.', 'neutral');
}
renderAll();

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateInstallUI() {
  if (!els.installBtn) return;
  els.installBtn.classList.toggle('is-installed', isStandalone());
}

if (els.installBtn) {
  els.installBtn.addEventListener('click', () => els.installModal.classList.remove('hidden'));
  els.closeInstall.addEventListener('click', () => els.installModal.classList.add('hidden'));
  els.installModal.addEventListener('click', (e) => {
    if (e.target === els.installModal) els.installModal.classList.add('hidden');
  });
}

updateInstallUI();
window.matchMedia('(display-mode: standalone)').addEventListener?.('change', updateInstallUI);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
