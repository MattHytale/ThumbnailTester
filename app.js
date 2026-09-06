const state = {
  variants: [null, null, null],
  avatar: null,
  layout: 'grid',
  recallNotes: ['', '', ''],
  flickerTimer: null,
  flickerOnLeft: true,
  scores: [
    { readability: 7, focal: 7, curiosity: 7, clarity: 7 },
    { readability: 7, focal: 7, curiosity: 7, clarity: 7 },
    { readability: 7, focal: 7, curiosity: 7, clarity: 7 },
  ]
};

const letters = ['A','B','C'];
const $ = (id) => document.getElementById(id);

const els = {
  variantGrid: $('variantGrid'), videoTitle: $('videoTitle'), titleCount: $('titleCount'),
  channelName: $('channelName'), viewsText: $('viewsText'), publishedText: $('publishedText'),
  avatarInput: $('avatarInput'), previewSize: $('previewSize'), blurToggle: $('blurToggle'),
  grayToggle: $('grayToggle'), dimToggle: $('dimToggle'), youtubeStage: $('youtubeStage'),
  layoutTabs: $('layoutTabs'), metricsTable: $('metricsTable'), scorecard: $('scorecard'),
  compareCanvas: $('compareCanvas'), compareLeft: $('compareLeft'), compareRight: $('compareRight'),
  flickerBtn: $('flickerBtn'), flashBtn: $('flashBtn'), flashDuration: $('flashDuration'),
  flashVersion: $('flashVersion'), flashOverlay: $('flashOverlay'), flashCard: $('flashCard'),
  recallModal: $('recallModal'), recallText: $('recallText'), closeRecall: $('closeRecall'),
  saveRecall: $('saveRecall'), resetBtn: $('resetBtn'), demoBtn: $('demoBtn'),
  installBtn: $('installBtn'), installModal: $('installModal'), closeInstall: $('closeInstall')
};

function persistTextSettings() {
  localStorage.setItem('thumbnailLabSettings', JSON.stringify({
    title: els.videoTitle.value,
    channel: els.channelName.value,
    views: els.viewsText.value,
    published: els.publishedText.value,
    scores: state.scores,
    notes: state.recallNotes
  }));
}

function restoreTextSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('thumbnailLabSettings') || '{}');
    if (s.title) els.videoTitle.value = s.title;
    if (s.channel) els.channelName.value = s.channel;
    if (s.views) els.viewsText.value = s.views;
    if (s.published) els.publishedText.value = s.published;
    if (Array.isArray(s.scores) && s.scores.length === 3) state.scores = s.scores;
    if (Array.isArray(s.notes) && s.notes.length === 3) state.recallNotes = s.notes;
  } catch (_) {}
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
  const w = 160, h = 90;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let lumSum = 0, lumSq = 0, satSum = 0, edgeSum = 0;
  const lums = new Float32Array(w*h);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r=data[i]/255, g=data[i+1]/255, b=data[i+2]/255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    const lum=0.2126*r+0.7152*g+0.0722*b;
    const sat=max === 0 ? 0 : (max-min)/max;
    lums[p]=lum; lumSum += lum; lumSq += lum*lum; satSum += sat;
  }
  for (let y=1; y<h-1; y++) {
    for (let x=1; x<w-1; x++) {
      const p=y*w+x;
      const gx=lums[p+1]-lums[p-1];
      const gy=lums[p+w]-lums[p-w];
      edgeSum += Math.min(1, Math.hypot(gx,gy)*3);
    }
  }
  const n=w*h, mean=lumSum/n;
  const std=Math.sqrt(Math.max(0, lumSq/n - mean*mean));
  return {
    brightness: Math.round(mean*100),
    contrast: Math.round(Math.min(100, std*260)),
    saturation: Math.round((satSum/n)*100),
    detail: Math.round(Math.min(100, (edgeSum/((w-2)*(h-2)))*100))
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
    src, name:file.name, width:img.naturalWidth, height:img.naturalHeight,
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
    input.addEventListener('change', e => e.target.files[0] && setVariant(index, e.target.files[0]));
    ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('dragging'); }));
    ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('dragging'); }));
    drop.addEventListener('drop', e => e.dataTransfer.files[0] && setVariant(index, e.dataTransfer.files[0]));
    node.querySelector('.clear-image').addEventListener('click', () => {
      state.variants[index] = null; input.value=''; renderAll();
    });
    els.variantGrid.appendChild(node);
  });
}

function renderVariantCards() {
  [...els.variantGrid.children].forEach((card, i) => {
    const v=state.variants[i], img=card.querySelector('.thumb-preview'), meta=card.querySelector('.file-meta');
    card.classList.toggle('has-image', !!v);
    if (v) {
      img.src=v.src;
      meta.textContent=`${v.name} • ${v.width} × ${v.height}`;
    } else {
      img.removeAttribute('src'); meta.textContent='No image loaded';
    }
  });
}

function ytCard(i) {
  const v=state.variants[i];
  const title=escapeHtml(els.videoTitle.value || 'Untitled video');
  const channel=escapeHtml(els.channelName.value || 'Your channel');
  const views=escapeHtml(els.viewsText.value || '0 views');
  const published=escapeHtml(els.publishedText.value || 'just now');
  return `<article class="yt-card ${v?'':'no-image'}">
    <div class="yt-thumb">${v ? `<img src="${v.src}" alt="Thumbnail ${letters[i]}">` : `Upload ${letters[i]}`}</div>
    <div class="yt-meta">
      ${state.avatar ? `<img class="yt-avatar" src="${state.avatar}" alt="Channel avatar">` : `<div class="yt-avatar"></div>`}
      <div><div class="yt-title">${title}</div><div class="yt-sub">${channel}<br>${views} • ${published}</div></div>
    </div>
  </article>`;
}

function renderYouTubeStage() {
  els.youtubeStage.className='youtube-stage';
  els.youtubeStage.classList.add(els.previewSize.value);
  if (els.blurToggle.checked) els.youtubeStage.classList.add('effect-blur');
  if (els.grayToggle.checked) els.youtubeStage.classList.add('effect-gray');
  if (els.dimToggle.checked) els.youtubeStage.classList.add('effect-dim');
  const cards=letters.map((_,i)=>ytCard(i)).join('');
  els.youtubeStage.innerHTML = state.layout === 'focus'
    ? `<div class="feed-focus">${ytCard(firstLoadedIndex())}</div>`
    : `<div class="feed-grid">${cards}</div>`;
}

function firstLoadedIndex() {
  const idx=state.variants.findIndex(Boolean); return idx === -1 ? 0 : idx;
}

function renderMetrics() {
  const rows=['brightness','contrast','saturation','detail'];
  els.metricsTable.innerHTML=`<div class="metric-row header"><div></div>${letters.map(x=>`<div>${x}</div>`).join('')}</div>`+
    rows.map(metric=>`<div class="metric-row"><div class="metric-label">${capitalize(metric)}</div>${state.variants.map(v => v ? `<div class="metric-cell">${v.metrics[metric]}<small>${metricLabel(v.metrics[metric],metric)}</small></div>` : `<div class="metric-cell">—<small>no image</small></div>`).join('')}</div>`).join('');
}

function scoreAverage(obj) {
  return Math.round(Object.values(obj).reduce((a,b)=>a+Number(b),0)/Object.keys(obj).length*10)/10;
}

function renderScorecard() {
  const dims=[['readability','Readability'],['focal','Focal point'],['curiosity','Curiosity'],['clarity','Clarity']];
  let html='';
  dims.forEach(([key,label]) => {
    html += `<div class="score-row"><label>${label}</label><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">`;
    state.scores.forEach((s,i) => {
      html += `<input type="range" min="1" max="10" value="${s[key]}" data-score-key="${key}" data-score-index="${i}" title="${letters[i]}: ${s[key]}">`;
    });
    html += `</div><div class="score-value">1–10</div></div>`;
  });
  html += `<div class="score-summary">${state.scores.map((s,i)=>`<div class="score-pill"><strong>${scoreAverage(s)}</strong><span>${letters[i]} average</span>${state.recallNotes[i] ? `<div class="recall-note">Flash note: ${escapeHtml(state.recallNotes[i])}</div>`:''}</div>`).join('')}</div>`;
  els.scorecard.innerHTML=html;
  els.scorecard.querySelectorAll('input[type="range"]').forEach(input => input.addEventListener('input', e => {
    const i=Number(e.target.dataset.scoreIndex), key=e.target.dataset.scoreKey;
    state.scores[i][key]=Number(e.target.value); persistTextSettings(); renderScorecard();
  }));
}

function renderCompare() {
  const a=state.variants[Number(els.compareLeft.value)], b=state.variants[Number(els.compareRight.value)];
  if (!a || !b) {
    els.compareCanvas.innerHTML='<div class="empty-state">Upload both selected thumbnails to compare them.</div>'; return;
  }
  const current=state.flickerOnLeft ? a : b;
  els.compareCanvas.innerHTML=`<img src="${current.src}" alt="Flicker comparison">`;
}

function renderAll() {
  renderVariantCards(); renderYouTubeStage(); renderMetrics(); renderScorecard(); renderCompare();
  els.titleCount.textContent=els.videoTitle.value.length;
  persistTextSettings();
}

function escapeHtml(s) { return String(s).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function capitalize(s) { return s.charAt(0).toUpperCase()+s.slice(1); }

function startFlicker() {
  const a=state.variants[Number(els.compareLeft.value)], b=state.variants[Number(els.compareRight.value)];
  if (!a || !b) return;
  if (state.flickerTimer) {
    clearInterval(state.flickerTimer); state.flickerTimer=null; els.flickerBtn.textContent='Start flicker'; return;
  }
  els.flickerBtn.textContent='Stop flicker';
  state.flickerTimer=setInterval(()=>{ state.flickerOnLeft=!state.flickerOnLeft; renderCompare(); }, 450);
}

function startFlashTest() {
  const i=Number(els.flashVersion.value), v=state.variants[i];
  if (!v) { alert(`Upload thumbnail ${letters[i]} first.`); return; }
  els.flashCard.innerHTML=`<img src="${v.src}" alt="Flash thumbnail">`;
  els.flashOverlay.classList.remove('hidden');
  setTimeout(()=>{
    els.flashOverlay.classList.add('hidden');
    els.recallText.value=state.recallNotes[i] || '';
    els.recallText.dataset.index=i;
    els.recallModal.classList.remove('hidden');
    els.recallText.focus();
  }, Number(els.flashDuration.value));
}

function svgDemo(text, bg1, bg2, accent) {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="900" cy="360" r="240" fill="${accent}" opacity=".85"/><rect x="90" y="110" width="530" height="500" rx="45" fill="#101114" opacity=".82"/><text x="145" y="300" fill="white" font-family="Arial" font-size="84" font-weight="900">${text}</text><text x="145" y="390" fill="white" font-family="Arial" font-size="38" font-weight="700">PVP SERVER</text><text x="145" y="450" fill="${accent}" font-family="Arial" font-size="48" font-weight="900">PLAY NOW</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function loadDemo() {
  const demos=[
    svgDemo('BIGGEST', '#161616','#3c2500','#ffd400'),
    svgDemo('1000 HRS', '#0c1422','#273d62','#6fd6ff'),
    svgDemo('PVP?', '#291010','#5b1717','#ff6b6b')
  ];
  for (let i=0;i<3;i++) {
    state.variants[i]={ src:demos[i], name:`Demo ${letters[i]}.svg`, width:1280, height:720, metrics:await calculateMetrics(demos[i]) };
  }
  renderAll();
}

['input','change'].forEach(ev => {
  [els.videoTitle,els.channelName,els.viewsText,els.publishedText,els.previewSize,els.blurToggle,els.grayToggle,els.dimToggle].forEach(el => el.addEventListener(ev, renderAll));
});

els.avatarInput.addEventListener('change', async e => { if(e.target.files[0]) { state.avatar=await fileToDataURL(e.target.files[0]); renderAll(); } });
els.layoutTabs.addEventListener('click', e => { const b=e.target.closest('button[data-layout]'); if(!b)return; state.layout=b.dataset.layout; [...els.layoutTabs.children].forEach(x=>x.classList.toggle('active',x===b)); renderYouTubeStage(); });
els.compareLeft.addEventListener('change', renderCompare); els.compareRight.addEventListener('change', renderCompare);
els.flickerBtn.addEventListener('click', startFlicker); els.flashBtn.addEventListener('click', startFlashTest);
els.closeRecall.addEventListener('click', ()=>els.recallModal.classList.add('hidden'));
els.saveRecall.addEventListener('click', ()=>{ const i=Number(els.recallText.dataset.index); state.recallNotes[i]=els.recallText.value.trim(); persistTextSettings(); els.recallModal.classList.add('hidden'); renderScorecard(); });
els.resetBtn.addEventListener('click', ()=>{
  if(!confirm('Reset the tester and clear saved notes/settings?')) return;
  if(state.flickerTimer) clearInterval(state.flickerTimer);
  state.variants=[null,null,null]; state.avatar=null; state.recallNotes=['','',''];
  state.scores=state.scores.map(()=>({readability:7,focal:7,curiosity:7,clarity:7}));
  localStorage.removeItem('thumbnailLabSettings');
  els.videoTitle.value="I Run Hytale's Biggest PvP Server"; els.channelName.value='MattHytale'; els.viewsText.value='43K views'; els.publishedText.value='2 hours ago';
  renderAll();
});
els.demoBtn.addEventListener('click', loadDemo);

restoreTextSettings(); buildVariants(); renderAll();


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
