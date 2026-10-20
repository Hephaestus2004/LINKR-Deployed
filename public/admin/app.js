// admin/app.js
// Admin console interactions, real-time preview, CRUD, and batch operations

import { parseClientText, serializeClientText } from '/shared/parse.js';

const AVAILABLE_TEMPLATES = new Set(['clean-white', 'glass-dark', 'luxury-gold', 'bold-pop']);
const normalizeTemplate = (template) => AVAILABLE_TEMPLATES.has(template) ? template : 'clean-white';
let isSavingProfile = false;
let qrPreviewTimer = null;
let qrPreviewRevision = 0;
let qrDownloadData = null;
let profileSearchTimer = null;
let profileLoadRevision = 0;

const QR_PROFILE_BASE_URL = 'https://linkr-tap.site/u/';
const QR_ID_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';
const QR_ARTWORK_SIZE = 1200;
const QR_CODE_SIZE = 1120;

function normalizeQrId(value) {
  return String(value || '').trim().toLowerCase().replace(/[ilo]/g, character => character === 'o' ? '0' : '1');
}

function generateCardId() {
  const random = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(random, byte => QR_ID_ALPHABET[byte % QR_ID_ALPHABET.length]).join('');
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke, lineWidth = 0) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

async function generateStyledQr(profileUrl, id) {
  if (!window.QRCode?.toCanvas) throw new Error('The QR encoder did not load. Refresh the admin page and try again.');
  if (document.fonts?.load) await document.fonts.load('700 56px "JetBrains Mono"');

  const qr = window.QRCode.create(profileUrl, { errorCorrectionLevel: 'H' });
  const qrCanvas = document.createElement('canvas');
  await window.QRCode.toCanvas(qrCanvas, profileUrl, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: QR_CODE_SIZE,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const canvas = document.createElement('canvas');
  canvas.width = QR_ARTWORK_SIZE;
  canvas.height = QR_ARTWORK_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not create the QR artwork.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const qrSize = QR_CODE_SIZE;
  const qrX = (canvas.width - qrSize) / 2;
  const qrY = 10;
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  const moduleCount = qr.modules.size;
  const quietZone = 4;
  const unit = qrSize / (moduleCount + quietZone * 2);
  const eyeSize = unit * 7;
  const eyes = [
    [quietZone, quietZone],
    [quietZone + moduleCount - 7, quietZone],
    [quietZone, quietZone + moduleCount - 7]
  ];

  eyes.forEach(([col, row]) => {
    const x = qrX + col * unit;
    const y = qrY + row * unit;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, eyeSize, eyeSize);
    drawRoundedRect(ctx, x + unit / 2, y + unit / 2, eyeSize - unit, eyeSize - unit, unit * 2, null, '#000000', unit);
    drawRoundedRect(ctx, x + unit * 2, y + unit * 2, unit * 3, unit * 3, unit * 0.7, '#000000');
  });

  ctx.fillStyle = '#000000';
  ctx.font = '700 56px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(id).toUpperCase(), canvas.width / 2, 1164, 1040);

  return canvas.toDataURL('image/png');
}

function displayGeneratedQr(dataUrl, id) {
  qrDownloadData = dataUrl;
  const image = document.getElementById('qr-preview-composite');
  image.src = dataUrl;
  image.hidden = false;
  document.getElementById('btn-download-qr-composite').hidden = false;
  document.getElementById('qr-preview-status').textContent = `Print-ready QR + ${String(id).toUpperCase()} artwork for https://linkr-tap.site/u/${id}`;
}

function queueQrPreview() {
  clearTimeout(qrPreviewTimer);
  const id = normalizeQrId(document.getElementById('edit-id').value || document.getElementById('form-id').value);
  const status = document.getElementById('qr-preview-status');
  const revision = ++qrPreviewRevision;
  const clearQrPreviews = () => {
    qrDownloadData = null;
    document.getElementById('qr-preview-composite').hidden = true;
    document.getElementById('btn-download-qr-composite').hidden = true;
  };

  if (document.getElementById('form-tier').value === 'direct') {
    activeProfileData.qr_code = null;
    clearQrPreviews();
    status.textContent = 'Direct social records reserve the ID and do not publish a profile QR.';
    syncPreview();
    return;
  }

  if (!id) {
    activeProfileData.qr_code = null;
    clearQrPreviews();
    status.textContent = 'A branded QR code will be generated for this profile when it is saved.';
    syncPreview();
    return;
  }
  if (!/^[0-9a-km-z]{7,10}$/.test(id)) {
    activeProfileData.qr_code = null;
    clearQrPreviews();
    status.textContent = 'Enter a valid 7–10 character card ID to preview its QR code.';
    syncPreview();
    return;
  }

  status.textContent = 'Generating branded QR code…';
  clearQrPreviews();
  qrPreviewTimer = setTimeout(async () => {
    try {
      const composite = await generateStyledQr(`${QR_PROFILE_BASE_URL}${id}`, id);
      if (revision !== qrPreviewRevision) return;
      activeProfileData.qr_code = composite;
      displayGeneratedQr(composite, id);
      syncPreview();
    } catch (error) {
      if (revision !== qrPreviewRevision) return;
      clearQrPreviews();
      status.textContent = error.message || 'Could not generate the profile QR code.';
    }
  }, 120);
}

let currentProfiles = [];
let activeProfileData = {
  schema: 1,
  template: 'clean-white',
  profile_mode: 'standard',
  name: 'Alex Example',
  company: 'Studio Co.',
  title: 'Photographer',
  bio: 'Weddings and events in Metro Manila.',
  location: 'Makati, Metro Manila',
  photo: '/assets/profile-photo.svg',
  company_logo: '',
  qr_code: '',
  theme: { mode: 'light', accent: '#6f91a5' },
  links: [
    { type: 'phone', value: '0917 123 4567' },
    { type: 'email', value: 'alex@example.com' },
    { type: 'instagram', value: 'instagram.com/alexexample' },
    { type: 'custom', label: 'Portfolio', value: 'https://example.com' }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadProfiles();
  setupAnalytics();
  setupEditor();
  setupBatchGenerator();
  setupClientTxtIO();
  setupResellersAndTasks();
  loadResellers();
  loadTasks();
});

// 1. Navigation Tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      panes.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));

      if (target === 'editor') {
        syncPreview();
      }
      if (target === 'analytics') loadAnalytics();
      if (target === 'resellers') loadResellers();
      if (target === 'tasks') loadTasks();
    });
  });
}

let analyticsLoadRevision = 0;

function setupAnalytics() {
  document.getElementById('analytics-range').addEventListener('change', loadAnalytics);
  document.getElementById('btn-refresh-analytics').addEventListener('click', loadAnalytics);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function renderAnalyticsChart(container, rows, valueKey, label) {
  if (!rows.length) { container.innerHTML = '<p class="analytics-empty">No activity in this period.</p>'; return; }
  const width = 760, height = container.classList.contains('analytics-chart-small') ? 150 : 220;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const values = rows.map(row => Number(row[valueKey] || 0));
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = pad.left + (rows.length === 1 ? 0 : index * (width - pad.left - pad.right) / (rows.length - 1));
    const y = height - pad.bottom - value / max * (height - pad.top - pad.bottom);
    return [x, y];
  });
  const path = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${path} L ${points.at(-1)[0]} ${height - pad.bottom} L ${points[0][0]} ${height - pad.bottom} Z`;
  const stride = Math.max(1, Math.ceil(rows.length / 6));
  const ticks = rows.map((row, index) => index % stride === 0 || index === rows.length - 1
    ? `<text x="${points[index][0]}" y="${height - 5}" text-anchor="middle">${escapeHtml(row.day.slice(5))}</text>` : '').join('');
  const dots = rows.length <= 31 ? points.map(([x,y],i) => `<circle cx="${x}" cy="${y}" r="2.5"><title>${escapeHtml(rows[i].day)}: ${formatNumber(values[i])}</title></circle>`).join('') : '';
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="${escapeHtml(label)}">
    <line class="chart-gridline" x1="${pad.left}" y1="${height-pad.bottom}" x2="${width-pad.right}" y2="${height-pad.bottom}"/>
    <line class="chart-gridline" x1="${pad.left}" y1="${pad.top}" x2="${width-pad.right}" y2="${pad.top}"/>
    <path class="chart-area" d="${area}"/><path class="chart-line" d="${path}"/>${dots}<g class="chart-labels">${ticks}</g></svg>`;
}

function renderBreakdown(container, rows) {
  const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  container.innerHTML = rows.length ? rows.map(row => {
    const count = Number(row.count || 0);
    const percent = total ? Math.round(count / total * 100) : 0;
    return `<div class="breakdown-row"><div class="breakdown-label"><span>${escapeHtml(row.label || 'Unspecified')}</span><strong>${formatNumber(count)}</strong></div><div class="breakdown-track"><span style="width:${percent}%"></span></div></div>`;
  }).join('') : '<p class="analytics-empty">No records yet.</p>';
}

async function loadAnalytics() {
  const revision = ++analyticsLoadRevision;
  const days = document.getElementById('analytics-range').value;
  const error = document.getElementById('analytics-error');
  error.hidden = true;
  document.getElementById('analytics-kpis').innerHTML = '<div class="analytics-loading">Loading analytics…</div>';
  try {
    const response = await fetch(`/admin/api/admin/analytics?days=${encodeURIComponent(days)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    if (revision !== analyticsLoadRevision) return;
    const o = data.overview;
    const change = o.previous_scans ? ((o.scans - o.previous_scans) / o.previous_scans) * 100 : null;
    const changeLabel = change === null ? 'No prior-period baseline' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs prior period`;
    document.getElementById('analytics-period').textContent = `${data.range.start} through ${data.range.end} · compared with ${data.range.previous_start} through ${data.range.previous_end}`;
    const kpis = [
      ['QR scans', formatNumber(o.scans), changeLabel],
      ['Scans today', formatNumber(o.scans_today), 'Recorded card opens today'],
      ['Active profiles', formatNumber(o.active_profiles), `${formatNumber(o.total_profiles)} total profiles`],
      ['Stock cards', formatNumber(o.stock_cards), 'Unassigned cards available'],
      ['Open edit requests', formatNumber(o.open_edit_requests), 'Awaiting review']
    ];
    document.getElementById('analytics-kpis').innerHTML = kpis.map(([title,value,detail]) => `<article class="analytics-kpi"><span>${title}</span><strong>${value}</strong><small>${detail}</small></article>`).join('');
    document.getElementById('analytics-scan-total').textContent = `${formatNumber(o.scans)} scans`;
    const scanRows = Array.from({ length: data.range.days }, (_, index) => {
      const date = new Date(`${data.range.start}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + index);
      const day = date.toISOString().slice(0, 10);
      return { day, scans: Number(data.scans_by_day.find(row => row.day === day)?.scans || 0) };
    });
    renderAnalyticsChart(document.getElementById('analytics-scan-chart'), scanRows, 'scans', 'Daily QR scans');
    const profileRows = scanRows.map(row => ({ ...row, count: Number(data.profiles_by_day.find(item => item.day === row.day)?.count || 0) }));
    renderAnalyticsChart(document.getElementById('analytics-profile-chart'), profileRows, 'count', 'Daily profile creations');
    document.getElementById('analytics-top-profiles').innerHTML = data.top_profiles.length ? data.top_profiles.map((profile, index) => `<div class="analytics-list-row"><span class="analytics-rank">${index + 1}</span><div class="analytics-list-main"><strong>${escapeHtml(profile.name || profile.id)}</strong><small>${escapeHtml(profile.id)} · ${escapeHtml(profile.status)}</small></div><b>${formatNumber(profile.scans)}</b></div>`).join('') : '<p class="analytics-empty">No scans recorded in this period.</p>';
    renderBreakdown(document.getElementById('analytics-status'), data.status_breakdown);
    renderBreakdown(document.getElementById('analytics-tiers'), data.tier_breakdown);
    renderBreakdown(document.getElementById('analytics-templates'), data.template_breakdown);
    renderBreakdown(document.getElementById('analytics-edits'), data.edit_requests);
    document.getElementById('analytics-batches').innerHTML = data.recent_batches.length ? data.recent_batches.map(batch => `<div class="analytics-list-row"><span class="batch-dot"></span><div class="analytics-list-main"><strong>${escapeHtml(batch.label)}</strong><small>${batch.created_at ? escapeHtml(batch.created_at.slice(0, 10)) : 'Date unavailable'}${batch.printed_at ? ' · Printed' : ''}${batch.encoded_at ? ' · Encoded' : ''}</small></div><b>${formatNumber(batch.remaining || 0)} / ${formatNumber(batch.size)}</b></div>`).join('') : '<p class="analytics-empty">No batches created yet.</p>';
  } catch (err) {
    if (revision !== analyticsLoadRevision) return;
    document.getElementById('analytics-kpis').innerHTML = '';
    error.textContent = `Could not load analytics: ${err.message}`;
    error.hidden = false;
  }
}

// 2. Profiles Table
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

async function loadProfiles() {
  const tbody = document.getElementById('profiles-table-body');
  const statusFilter = document.getElementById('filter-status').value;
  const searchTerm = document.getElementById('filter-search').value.trim();
  const dateView = document.getElementById('filter-date-view').value;
  const dateDay = document.getElementById('filter-date-day').value;
  const dateSort = document.getElementById('filter-date-sort').value;
  const revision = ++profileLoadRevision;
  document.getElementById('select-all-profiles').checked = false;
  tbody.innerHTML = '<tr><td colspan="10" class="loading">Loading profiles...</td></tr>';

  try {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (searchTerm) params.set('search', searchTerm);
    if (dateView) params.set('date_view', dateView);
    if (dateDay) params.set('date_day', dateDay);
    if (dateSort) params.set('date_sort', dateSort);
    const query = params.toString();
    const res = await fetch(`/admin/api/admin/profiles${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (revision !== profileLoadRevision) return;
    currentProfiles = data.profiles || [];
    renderProfilesTable(currentProfiles);
  } catch (err) {
    if (revision !== profileLoadRevision) return;
    tbody.innerHTML = `<tr><td colspan="10" style="color: var(--danger)">Error loading profiles: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderProfilesTable(profiles) {
  const tbody = document.getElementById('profiles-table-body');
  if (!profiles.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color: var(--text-muted)">No profiles found</td></tr>';
    updateBulkDeleteButton();
    return;
  }

  tbody.innerHTML = profiles.map(p => `
    <tr>
      <td><input type="checkbox" class="profile-select" data-id="${p.id}" aria-label="Select profile ${p.id}"></td>
      <td><code>${p.id}</code></td>
      <td>${escapeHtml(p.name || '')}</td>
      <td>#${p.seq}</td>
      <td><span class="badge badge-${p.status}">${p.tier === 'direct' && p.status === 'archived' ? 'Reserved' : p.status}</span></td>
      <td>${p.tier || 'full'}</td>
      <td>${p.template || 'clean-white'}</td>
      <td>${escapeHtml(p.reseller_name || '')}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted)">${escapeHtml(p.created_day || (p.created_at ? p.created_at.slice(0, 10) : ''))}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="window.editProfile('${p.id}')">Edit</button>
        ${p.tier === 'direct' ? '' : `<a class="btn btn-sm btn-secondary" href="/u/${p.id}" target="_blank" rel="noopener">View</a>`}
        <button class="btn btn-sm btn-danger" onclick="window.deleteProfile('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
  updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
  const selected = [...document.querySelectorAll('.profile-select:checked')];
  const all = [...document.querySelectorAll('.profile-select')];
  const selectAll = document.getElementById('select-all-profiles');
  const bulkButton = document.getElementById('btn-delete-selected');
  const exportButton = document.getElementById('btn-export-selected-qr');
  const mergedExportButton = document.getElementById('btn-export-merged-qr');
  if (!selectAll || !bulkButton || !exportButton || !mergedExportButton) return;
  selectAll.checked = all.length > 0 && selected.length === all.length;
  selectAll.indeterminate = selected.length > 0 && selected.length < all.length;
  bulkButton.hidden = selected.length === 0;
  bulkButton.textContent = `Delete selected (${selected.length})`;
  bulkButton.disabled = false;
  exportButton.hidden = selected.length === 0;
  exportButton.textContent = `Export combined QR + UID PNGs (${selected.length})`;
  exportButton.disabled = false;
  mergedExportButton.hidden = selected.length === 0;
  mergedExportButton.textContent = `Export 9 × 6 sheets ZIP (${selected.length})`;
  mergedExportButton.disabled = false;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const content = file.data;
    const crc = crc32(content);
    const local = new Uint8Array(30 + name.length + content.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, content.length, true);
    localView.setUint32(22, content.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(content, 30 + name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, content.length, true);
    centralView.setUint32(24, content.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centralParts.push(central);
    offset += local.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the merged PNG.')), 'image/png');
  });
}

async function loadImage(src) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

async function invertPngColors(dataUrl, fillWhiteBackground = false) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('This browser could not create the inverted QR artwork.');
    ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    pixels.data[index] = 255 - pixels.data[index];
    pixels.data[index + 1] = 255 - pixels.data[index + 1];
    pixels.data[index + 2] = 255 - pixels.data[index + 2];
    }
    ctx.putImageData(pixels, 0, 0);
    let outputCanvas = canvas;
    if (fillWhiteBackground) {
      outputCanvas = document.createElement('canvas');
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) throw new Error('This browser could not create the inverted QR sheet.');
      outputCtx.fillStyle = '#ffffff';
      outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
      outputCtx.drawImage(canvas, 0, 0);
    }
    const blob = await canvasToBlob(outputCanvas);
  return new Uint8Array(await blob.arrayBuffer());
}

async function makeTransparentQrInk(dataUrl, invertInk = false) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser could not prepare the QR artwork.');
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const luminance = Math.round(pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114);
    const inkAlpha = Math.round(pixels.data[index + 3] * (255 - luminance) / 255);
    pixels.data[index] = invertInk ? 255 : 0;
    pixels.data[index + 1] = invertInk ? 255 : 0;
    pixels.data[index + 2] = invertInk ? 255 : 0;
    pixels.data[index + 3] = inkAlpha;
  }
  ctx.putImageData(pixels, 0, 0);
  return loadImage(canvas.toDataURL('image/png'));
}

async function exportMergedQrSheet() {
  const selectedIds = [...document.querySelectorAll('.profile-select:checked')].map((checkbox) => checkbox.dataset.id);
  if (!selectedIds.length) return;
  const profiles = selectedIds.map((id) => currentProfiles.find((profile) => profile.id === id)).filter(Boolean);
  const exportable = profiles.filter((profile) => profile.tier !== 'direct');
  const skipped = profiles.length - exportable.length;
  if (!exportable.length) {
    alert('Selected direct-social records do not have public profile QR codes.');
    return;
  }

  const button = document.getElementById('btn-export-merged-qr');
  button.disabled = true;
  const columns = 9;
  const rowsPerPage = 6;
  const perPage = columns * rowsPerPage;
  const qrSize = 400;
  const cellWidth = 420;
  const cellHeight = 420;
  const gap = 24;
  const margin = 48;
  const files = [];
  const pageCount = Math.ceil(exportable.length / perPage);
  try {
    await document.fonts.load('700 56px "JetBrains Mono"');
    for (let page = 0; page < pageCount; page++) {
      const pageProfiles = exportable.slice(page * perPage, (page + 1) * perPage);
      const canvas = document.createElement('canvas');
      canvas.width = margin * 2 + columns * cellWidth + (columns - 1) * gap;
      canvas.height = margin * 2 + rowsPerPage * cellHeight + (rowsPerPage - 1) * gap;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('This browser could not create the merged PNG canvas.');
      ctx.imageSmoothingEnabled = false;
      const blackCanvas = document.createElement('canvas');
      blackCanvas.width = canvas.width;
      blackCanvas.height = canvas.height;
      const blackCtx = blackCanvas.getContext('2d');
      if (!blackCtx) throw new Error('This browser could not create the black QR sheet.');
      blackCtx.imageSmoothingEnabled = false;
      for (let index = 0; index < pageProfiles.length; index++) {
        const id = pageProfiles[index].id;
        button.textContent = `Building sheet ${page + 1}/${pageCount} (${index + 1}/${pageProfiles.length})...`;
        const qrData = await generateStyledQr(`${QR_PROFILE_BASE_URL}${id}`, id);
        const qrImage = await makeTransparentQrInk(qrData);
        const invertedQrImage = await makeTransparentQrInk(qrData, true);
        const column = index % columns;
        const row = Math.floor(index / columns);
        const cellX = margin + column * (cellWidth + gap);
        const cellY = margin + row * (cellHeight + gap);
        const tileX = cellX + (cellWidth - qrSize) / 2;
        const tileY = cellY + (cellHeight - qrSize) / 2;
        // Each tile owns its solid frame. The unused cell and page margins remain transparent for cutting.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tileX, tileY, qrSize, qrSize);
        ctx.drawImage(qrImage, tileX, tileY, qrSize, qrSize);
        blackCtx.fillStyle = '#000000';
        blackCtx.fillRect(tileX, tileY, qrSize, qrSize);
        blackCtx.drawImage(invertedQrImage, tileX, tileY, qrSize, qrSize);
      }

      const blob = await canvasToBlob(canvas);
      const data = await blob.arrayBuffer();
      const sheetNumber = String(page + 1).padStart(2, '0');
      files.push({ name: `linkr-qr-sheet-${sheetNumber}.png`, data: new Uint8Array(data) });
      const blackBlob = await canvasToBlob(blackCanvas);
      files.push({ name: `linkr-qr-sheet-${sheetNumber} (black).png`, data: new Uint8Array(await blackBlob.arrayBuffer()) });
    }

    const blob = createZip(files);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `linkr-qr-sheets-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    if (skipped) alert(`Exported ${exportable.length} QR codes across ${files.length} sheet${files.length === 1 ? '' : 's'}. Skipped ${skipped} direct-social record${skipped === 1 ? '' : 's'} because they do not use profile QR codes.`);
  } catch (error) {
    alert(`Could not export the merged QR PNG: ${error.message}`);
  } finally {
    updateBulkDeleteButton();
  }
}

async function exportSelectedQrUidArtworks() {
  const selectedIds = [...document.querySelectorAll('.profile-select:checked')].map((checkbox) => checkbox.dataset.id);
  if (!selectedIds.length) return;
  const selectedProfiles = selectedIds.map((id) => currentProfiles.find((profile) => profile.id === id)).filter(Boolean);
  const exportable = selectedProfiles.filter((profile) => profile.tier !== 'direct');
  const skipped = selectedProfiles.length - exportable.length;
  if (!exportable.length) {
    alert('Selected direct-social records do not have public profile QR codes.');
    return;
  }
  const button = document.getElementById('btn-export-selected-qr');
  button.disabled = true;
  const files = [];
  try {
    for (let index = 0; index < exportable.length; index++) {
      const id = exportable[index].id;
      button.textContent = `Generating ${index + 1}/${exportable.length}...`;
      const dataUrl = await generateStyledQr(`${QR_PROFILE_BASE_URL}${id}`, id);
      const image = await fetch(dataUrl).then((response) => response.arrayBuffer());
      files.push({ name: `${id}-qr-uid.png`, data: new Uint8Array(image) });
      files.push({ name: `${id}-qr-uid (black).png`, data: await invertPngColors(dataUrl) });
    }
    const zip = createZip(files);
    const url = URL.createObjectURL(zip);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `linkr-qr-uid-artworks-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    if (skipped) alert(`Exported ${files.length} combined QR + UID artworks. Skipped ${skipped} direct-social record${skipped === 1 ? '' : 's'} because they do not use profile QR codes.`);
  } catch (error) {
    alert(`Could not export QR codes: ${error.message}`);
  } finally {
    updateBulkDeleteButton();
  }
}

async function deleteProfileRequest(id) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetch(`/admin/api/admin/profiles?id=${encodeURIComponent(id)}`, { method: 'DELETE', signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Delete request timed out. Refresh the directory to check whether the profile was removed.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const responseText = await res.text();
  let data = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { error: responseText || `Server returned an empty response (HTTP ${res.status}).` };
  }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  if (!data.success) throw new Error(data.error || `Delete was not confirmed (HTTP ${res.status}).`);
  return data;
}

async function deleteSelectedProfiles() {
  const ids = [...document.querySelectorAll('.profile-select:checked')].map((checkbox) => checkbox.dataset.id);
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} selected profile${ids.length === 1 ? '' : 's'}? Their IDs will remain reserved, while saved profile data and images are removed.`)) return;

  const button = document.getElementById('btn-delete-selected');
  button.disabled = true;
  button.textContent = `Deleting ${ids.length}...`;
  const results = await Promise.allSettled(ids.map((id) => deleteProfileRequest(id)));
  const failures = results.flatMap((result, index) => result.status === 'rejected' ? [`${ids[index]}: ${result.reason.message}`] : []);
  // Hide successful deletions immediately, then reload from the server to reconcile.
  const removed = new Set(ids.filter((_, index) => results[index].status === 'fulfilled'));
  currentProfiles = currentProfiles.filter((profile) => !removed.has(profile.id));
  renderProfilesTable(currentProfiles);
  try {
    await loadProfiles();
  } finally {
    updateBulkDeleteButton();
  }
  if (failures.length) {
    alert(`Deleted ${ids.length - failures.length} of ${ids.length} profiles.\n\nCould not delete:\n${failures.join('\n')}`);
  }
}

let adminResellers = [];
let adminTasks = [];

function resellerOptionLabel(reseller) {
  const id = reseller.code ? `${reseller.code} · ` : `ID ${reseller.id} · `;
  return `${id}${reseller.name}`;
}

async function loadResellers() {
  try {
    const response = await fetch('/admin/api/admin/resellers');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    adminResellers = data.resellers || [];
    const editorSelect = document.getElementById('form-reseller-id');
    const taskSelect = document.getElementById('task-reseller');
    const selectedEditor = editorSelect.value;
    const selectedTask = taskSelect.value;
    editorSelect.innerHTML = '<option value="">No reseller</option>' + adminResellers.map(r => `<option value="${r.id}">${escapeHtml(resellerOptionLabel(r))}</option>`).join('');
    taskSelect.innerHTML = '<option value="">Select reseller</option>' + adminResellers.map(r => `<option value="${r.id}">${escapeHtml(resellerOptionLabel(r))}</option>`).join('');
    editorSelect.value = selectedEditor;
    taskSelect.value = selectedTask;
    document.getElementById('reseller-list').innerHTML = adminResellers.length ? adminResellers.map(r => `
      <div class="analytics-list-row"><span class="analytics-rank">${Number(r.resale_count || 0)}</span><div class="analytics-list-main"><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.code)}${r.contact ? ` · ${escapeHtml(r.contact)}` : ''}</small></div><button class="btn btn-sm btn-secondary" type="button" onclick="window.editReseller(${Number(r.id)})">Edit</button></div>`).join('') : '<p class="analytics-empty">No resellers yet. Add one to start tracking sales.</p>';
    document.getElementById('recent-resells-body').innerHTML = data.recent_resells?.length ? data.recent_resells.map(row => `<tr><td>${escapeHtml(row.created_day || (row.created_at || '').slice(0, 10))}</td><td>${escapeHtml(row.client_name || '')}</td><td><code>${escapeHtml(row.id)}</code></td><td>${escapeHtml(row.reseller_name || '')}</td><td>${escapeHtml(row.tier || '')}</td></tr>`).join('') : '<tr><td colspan="5" class="analytics-empty">No reseller-linked profiles yet.</td></tr>';
  } catch (error) {
    document.getElementById('reseller-list').innerHTML = `<p class="analytics-error">Could not load resellers: ${escapeHtml(error.message)}</p>`;
  }
}

async function loadTasks() {
  try {
    const response = await fetch('/admin/api/admin/tasks');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    adminTasks = data.tasks || [];
    if (!adminResellers.length) adminResellers = data.resellers || [];
    const editorSelect = document.getElementById('form-reseller-id');
    const editorValue = editorSelect.value;
    editorSelect.innerHTML = '<option value="">No reseller</option>' + adminResellers.map(r => `<option value="${r.id}">${escapeHtml(resellerOptionLabel(r))}</option>`).join('');
    editorSelect.value = editorValue;
    const resellerSelect = document.getElementById('task-reseller');
    const resellerValue = resellerSelect.value;
    resellerSelect.innerHTML = '<option value="">Select reseller</option>' + adminResellers.map(r => `<option value="${r.id}">${escapeHtml(resellerOptionLabel(r))}</option>`).join('');
    resellerSelect.value = resellerValue;
    const clientSelect = document.getElementById('task-clients');
    const prior = new Set([...clientSelect.selectedOptions].map(option => option.value));
    clientSelect.innerHTML = (data.clients || []).map(client => `<option value="${escapeHtml(client.name)}">${escapeHtml(client.name)} · ${escapeHtml(client.id)}</option>`).join('');
    [...clientSelect.options].forEach(option => { option.selected = prior.has(option.value); });
    renderAdminTasks();
  } catch (error) {
    document.getElementById('task-list').innerHTML = `<p class="analytics-error">Could not load tasks: ${escapeHtml(error.message)}</p>`;
  }
}

function renderAdminTasks() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const daysUntil = task => Math.ceil((new Date(`${task.deadline}T00:00:00`) - now) / 86400000);
  const openTasks = adminTasks.filter(task => !Number(task.completed));
  const overdue = openTasks.filter(task => daysUntil(task) < 0);
  const near = openTasks.filter(task => daysUntil(task) >= 0 && daysUntil(task) <= 3);
  document.getElementById('task-alerts').innerHTML = `<span class="task-alert alert-danger">${overdue.length} overdue</span><span class="task-alert alert-warning">${near.length} due within 3 days</span><span class="task-alert alert-neutral">${openTasks.length} open tasks</span>`;
  const filter = document.getElementById('task-filter').value;
  const filtered = adminTasks.filter(task => {
    if (filter === 'near') return !Number(task.completed) && daysUntil(task) >= 0 && daysUntil(task) <= 3;
    if (filter === 'overdue') return !Number(task.completed) && daysUntil(task) < 0;
    if (['system', 'printing', 'add_client'].includes(filter)) return task.category === filter;
    return true;
  });
  document.getElementById('task-list').innerHTML = filtered.length ? filtered.map(task => {
    let clients = task.client_name || '';
    try { clients = clients || JSON.parse(task.client_names || '[]').join(', '); } catch {}
    const due = daysUntil(task);
    return `<article class="task-card ${Number(task.completed) ? 'task-complete' : ''}">
      <div class="task-card-head"><span class="badge task-category-${escapeHtml(task.category)}">${escapeHtml(task.category.replace('_', ' '))}</span><span class="task-deadline ${due < 0 && !Number(task.completed) ? 'is-overdue' : due <= 3 && !Number(task.completed) ? 'is-near' : ''}">${escapeHtml(task.deadline)}${due < 0 && !Number(task.completed) ? ' · overdue' : ''}</span></div>
      <strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.description || '')}</p>
      <small>${escapeHtml([task.reseller_name, clients, task.package].filter(Boolean).join(' · '))}</small>
      <div class="task-card-actions"><button class="btn btn-sm btn-secondary" onclick="window.toggleAdminTask(${Number(task.id)})">${Number(task.completed) ? 'Reopen' : 'Complete'}</button><button class="btn btn-sm btn-secondary" onclick="window.editAdminTask(${Number(task.id)})">Edit</button><button class="btn btn-sm btn-danger" onclick="window.deleteAdminTask(${Number(task.id)})">Delete</button></div>
    </article>`;
  }).join('') : '<p class="analytics-empty">No tasks match this view.</p>';
}

function resetResellerForm() {
  document.getElementById('reseller-edit-id').value = '';
  document.getElementById('reseller-name').value = '';
  document.getElementById('reseller-contact').value = '';
  document.getElementById('reseller-form-title').textContent = 'Add reseller';
  document.getElementById('btn-cancel-reseller').hidden = true;
}

function resetAdminTaskForm() {
  document.getElementById('task-form').reset();
  document.getElementById('task-edit-id').value = '';
  document.getElementById('task-form-title').textContent = 'Create task';
  document.getElementById('btn-cancel-task').hidden = true;
  setAdminTaskFields();
}

function setAdminTaskFields() {
  const category = document.getElementById('task-category').value;
  document.querySelectorAll('.task-field-system').forEach(node => { node.hidden = category !== 'system'; });
  document.querySelectorAll('.task-field-printing').forEach(node => { node.hidden = category !== 'printing'; });
  document.querySelectorAll('.task-field-client').forEach(node => { node.hidden = category !== 'add_client'; });
  document.getElementById('task-reseller').required = category === 'add_client';
  document.getElementById('task-client-name').required = category === 'add_client';
  document.getElementById('task-package').required = category === 'add_client';
}

function setupResellersAndTasks() {
  document.getElementById('filter-date-view').addEventListener('change', loadProfiles);
  document.getElementById('filter-date-day').addEventListener('change', loadProfiles);
  document.getElementById('filter-date-sort').addEventListener('change', loadProfiles);
  document.getElementById('task-category').addEventListener('change', setAdminTaskFields);
  document.getElementById('task-filter').addEventListener('change', renderAdminTasks);
  document.getElementById('btn-refresh-resellers').addEventListener('click', loadResellers);
  document.getElementById('btn-refresh-tasks').addEventListener('click', loadTasks);
  document.getElementById('btn-cancel-reseller').addEventListener('click', resetResellerForm);
  document.getElementById('btn-cancel-task').addEventListener('click', resetAdminTaskForm);
  document.getElementById('reseller-form').addEventListener('submit', async event => {
    event.preventDefault();
    const payload = { id: Number(document.getElementById('reseller-edit-id').value) || undefined, name: document.getElementById('reseller-name').value.trim(), contact: document.getElementById('reseller-contact').value.trim() };
    try { const response = await fetch('/admin/api/admin/resellers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Save failed'); resetResellerForm(); await loadResellers(); await loadTasks(); }
    catch (error) { alert(`Could not save reseller: ${error.message}`); }
  });
  document.getElementById('task-form').addEventListener('submit', async event => {
    event.preventDefault();
    const category = document.getElementById('task-category').value;
    const dateId = 'task-deadline';
    const payload = { id: Number(document.getElementById('task-edit-id').value) || undefined, category, title: document.getElementById('task-title').value.trim(), description: document.getElementById('task-description').value.trim(), reseller_id: Number(document.getElementById('task-reseller').value) || null, client_name: document.getElementById('task-client-name').value.trim(), package: document.getElementById('task-package').value.trim(), client_names: [...document.getElementById('task-clients').selectedOptions].map(option => option.value), deadline: document.getElementById(dateId)?.value || '' };
    try { const response = await fetch('/admin/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Save failed'); resetAdminTaskForm(); await loadTasks(); }
    catch (error) { alert(`Could not save task: ${error.message}`); }
  });
  setAdminTaskFields();
}

window.editReseller = id => {
  const reseller = adminResellers.find(item => Number(item.id) === Number(id)); if (!reseller) return;
  document.getElementById('reseller-edit-id').value = reseller.id;
  document.getElementById('reseller-name').value = reseller.name || '';
  document.getElementById('reseller-contact').value = reseller.contact || '';
  document.getElementById('reseller-form-title').textContent = 'Edit reseller';
  document.getElementById('btn-cancel-reseller').hidden = false;
};

window.editAdminTask = id => {
  const task = adminTasks.find(item => Number(item.id) === Number(id)); if (!task) return;
  document.getElementById('task-edit-id').value = task.id;
  document.getElementById('task-category').value = task.category;
  document.getElementById('task-title').value = task.category === 'system' ? task.title : '';
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-reseller').value = task.reseller_id || '';
  document.getElementById('task-client-name').value = task.client_name || '';
  document.getElementById('task-package').value = task.package || '';
  document.getElementById('task-deadline').value = task.deadline || '';
  let clients = []; try { clients = JSON.parse(task.client_names || '[]'); } catch {}
  if (!clients.length && task.client_name) clients = [task.client_name];
  [...document.getElementById('task-clients').options].forEach(option => { option.selected = clients.includes(option.value); });
  document.getElementById('task-form-title').textContent = `Edit task #${task.id}`;
  document.getElementById('btn-cancel-task').hidden = false;
  setAdminTaskFields();
  document.getElementById('task-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.toggleAdminTask = async id => {
  const task = adminTasks.find(item => Number(item.id) === Number(id)); if (!task) return;
  try { const response = await fetch('/admin/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, id, completed: !Number(task.completed), client_names: JSON.parse(task.client_names || '[]') }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Update failed'); await loadTasks(); }
  catch (error) { alert(`Could not update task: ${error.message}`); }
};

window.deleteAdminTask = async id => {
  if (!confirm('Delete this task?')) return;
  try { const response = await fetch(`/admin/api/admin/tasks?id=${id}`, { method: 'DELETE' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Delete failed'); await loadTasks(); }
  catch (error) { alert(`Could not delete task: ${error.message}`); }
};

// 3. Editor Setup & Real-time Live Preview
function setupEditor() {
  const previewIframe = document.getElementById('preview-iframe');
  previewIframe.addEventListener('load', syncPreview);
  populateForm(activeProfileData);

  document.getElementById('profile-form').addEventListener('input', () => {
    updateDataFromForm();
    syncPreview();
  });

  document.getElementById('form-template').addEventListener('change', () => {
    updateDataFromForm();
    const tmpl = normalizeTemplate(document.getElementById('form-template').value);
    previewIframe.src = `/t/${tmpl}/index.html`;
  });

  document.getElementById('form-tier').addEventListener('change', (e) => {
    applyTierVisibility(e.target.value);
    updateDataFromForm();
    queueQrPreview();
    syncPreview();
  });

  document.getElementById('form-accent-picker').addEventListener('input', (e) => {
    document.getElementById('form-accent').value = e.target.value;
    updateDataFromForm();
    syncPreview();
  });

  document.getElementById('form-accent').addEventListener('input', (e) => {
    document.getElementById('form-accent-picker').value = e.target.value;
  });

  document.getElementById('btn-add-link').addEventListener('click', () => {
    addLinkRow({ type: 'website', value: '', label: '' });
  });

  // ID Check on Input
  let idCheckTimeout = null;
  const idInput = document.getElementById('form-id');
  const idBadge = document.getElementById('id-status-badge');

  idInput.addEventListener('input', () => {
    queueQrPreview();
    clearTimeout(idCheckTimeout);
    const val = idInput.value.trim().toLowerCase();
    const editId = document.getElementById('edit-id').value.trim().toLowerCase();

    if (!val || val === editId) {
      idBadge.textContent = '';
      idBadge.className = '';
      return;
    }

    idBadge.textContent = 'Checking...';
    idBadge.className = '';

    idCheckTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/admin/api/admin/profiles?check_id=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data.exists) {
          if (data.status === 'unassigned' || data.status === 'assigned') {
            idBadge.textContent = 'Stock card ready';
            idBadge.className = 'stock';
          } else {
            idBadge.textContent = data.status === 'archived' || data.status === 'deleted' || data.status === 'reserved' ? 'Reserved ID' : 'Already active';
            idBadge.className = 'taken';
          }
        } else {
          idBadge.textContent = 'Available (New ID)';
          idBadge.className = 'available';
        }
      } catch (err) {
        idBadge.textContent = '';
      }
    }, 350);
  });

  // Image Upload Handlers with Canvas Optimizer
  setupImageUploader('photo-file-input', 'form-photo', 'photo-preview-thumb', 360, 360);
  setupImageUploader('logo-file-input', 'form-logo', 'logo-preview-thumb', 480, 160);

  document.getElementById('btn-remove-photo').addEventListener('click', () => {
    document.getElementById('form-photo').value = '';
    document.getElementById('photo-preview-thumb').src = '/assets/profile-photo.svg';
    updateDataFromForm();
    syncPreview();
  });

  document.getElementById('btn-remove-logo').addEventListener('click', () => {
    document.getElementById('form-logo').value = '';
    document.getElementById('logo-preview-thumb').removeAttribute('src');
    document.getElementById('logo-preview-thumb').hidden = true;
    updateDataFromForm();
    syncPreview();
  });

  document.getElementById('form-photo').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    document.getElementById('photo-preview-thumb').src = val || '/assets/profile-photo.svg';
  });

  document.getElementById('form-logo').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const image = document.getElementById('logo-preview-thumb');
    image.hidden = !val;
    if (val) image.src = val;
    else image.removeAttribute('src');
  });
  document.getElementById('btn-download-qr-composite').addEventListener('click', () => {
    const dataUrl = qrDownloadData;
    if (!dataUrl) return;
    const id = normalizeQrId(document.getElementById('edit-id').value || document.getElementById('form-id').value);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${(id || 'linkr-profile').toUpperCase()}-qr-uid.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  document.getElementById('btn-save-profile').addEventListener('click', saveProfile);
  document.getElementById('btn-refresh-preview').addEventListener('click', syncPreview);
  document.getElementById('btn-new-profile').addEventListener('click', () => {
    resetNewProfileForm();
    document.querySelector('[data-tab="editor"]').click();
  });

  document.getElementById('btn-refresh-profiles').addEventListener('click', loadProfiles);
  document.getElementById('filter-status').addEventListener('change', loadProfiles);
  document.getElementById('filter-search').addEventListener('input', () => {
    clearTimeout(profileSearchTimer);
    profileSearchTimer = setTimeout(loadProfiles, 250);
  });
  document.getElementById('select-all-profiles').addEventListener('change', (event) => {
    document.querySelectorAll('.profile-select').forEach((checkbox) => { checkbox.checked = event.target.checked; });
    updateBulkDeleteButton();
  });
  document.getElementById('profiles-table-body').addEventListener('change', (event) => {
    if (event.target.matches('.profile-select')) updateBulkDeleteButton();
  });
  document.getElementById('btn-delete-selected').addEventListener('click', deleteSelectedProfiles);
  document.getElementById('btn-export-selected-qr').addEventListener('click', exportSelectedQrUidArtworks);
  document.getElementById('btn-export-merged-qr').addEventListener('click', exportMergedQrSheet);
}

// Client-side image compressor & data-url generator
function setupImageUploader(fileInputId, textInputId, previewImgId, maxWidth, maxHeight) {
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP (or PNG for logos)
        const format = file.type === 'image/png' ? 'image/png' : 'image/webp';
        const dataUrl = canvas.toDataURL(format, 0.85);

        document.getElementById(textInputId).value = dataUrl;
        const previewImage = document.getElementById(previewImgId);
        previewImage.src = dataUrl;
        previewImage.hidden = false;
        updateDataFromForm();
        syncPreview();
      };
      img.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });
}

function addLinkRow(link = { type: 'custom', value: '', label: '' }) {
  const container = document.getElementById('links-container');
  const row = document.createElement('div');
  row.className = 'link-builder-row';
  row.innerHTML = `
    <select class="select link-type">
      <option value="phone" ${link.type === 'phone' ? 'selected' : ''}>Phone</option>
      <option value="email" ${link.type === 'email' ? 'selected' : ''}>Email</option>
      <option value="website" ${link.type === 'website' ? 'selected' : ''}>Website</option>
      <option value="facebook" ${link.type === 'facebook' ? 'selected' : ''}>Facebook</option>
      <option value="instagram" ${link.type === 'instagram' ? 'selected' : ''}>Instagram</option>
      <option value="tiktok" ${link.type === 'tiktok' ? 'selected' : ''}>TikTok</option>
      <option value="youtube" ${link.type === 'youtube' ? 'selected' : ''}>YouTube</option>
      <option value="linkedin" ${link.type === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
      <option value="whatsapp" ${link.type === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
      <option value="telegram" ${link.type === 'telegram' ? 'selected' : ''}>Telegram</option>
      <option value="viber" ${link.type === 'viber' ? 'selected' : ''}>Viber</option>
      <option value="custom" ${link.type === 'custom' ? 'selected' : ''}>Custom</option>
    </select>
    <input type="text" class="input link-value" placeholder="Number, Handle, or URL" value="${link.value || ''}">
    <input type="text" class="input link-label" placeholder="Custom Label" value="${link.label || ''}">
    <button type="button" class="btn btn-sm btn-danger remove-link-btn">&times;</button>
  `;

  row.querySelector('.remove-link-btn').onclick = () => {
    row.remove();
    updateDataFromForm();
    syncPreview();
  };

  row.querySelectorAll('input, select').forEach(el => {
    el.oninput = () => {
      updateDataFromForm();
      syncPreview();
    };
  });

  container.appendChild(row);
}

function populateForm(data) {
  activeProfileData = data;
  document.getElementById('form-name').value = data.name || '';
  document.getElementById('form-reseller-id').value = data.reseller_id || '';
  document.getElementById('form-company').value = data.company || '';
  document.getElementById('form-title').value = data.title || '';
  document.getElementById('form-title-link').value = data.title_link || '';
  document.getElementById('form-bio').value = data.bio || '';
  document.getElementById('form-location').value = data.location || '';
  const photo = data.photo || '';
  document.getElementById('form-photo').value = photo;
  document.getElementById('photo-preview-thumb').src = photo || '/assets/profile-photo.svg';

  const logo = isPlaceholderCompanyLogo(data.company_logo) ? '' : (data.company_logo || '');
  data.company_logo = logo;
  document.getElementById('form-logo').value = logo;
  const logoImage = document.getElementById('logo-preview-thumb');
  logoImage.hidden = !logo;
  if (logo) logoImage.src = logo;
  else logoImage.removeAttribute('src');
  data.qr_code = null;

  data.template = normalizeTemplate(data.template);
  document.getElementById('form-template').value = data.template;
  const previewIframe = document.getElementById('preview-iframe');
  const previewUrl = `/t/${data.template}/index.html`;
  if (previewIframe.getAttribute('src') !== previewUrl) previewIframe.src = previewUrl;
  document.getElementById('form-mode').value = data.profile_mode || 'standard';
  document.getElementById('form-redirect-url').value = data.redirect_url || '';
  applyTierVisibility(document.getElementById('form-tier').value);

  const accent = data.theme?.accent || '#6f91a5';
  document.getElementById('form-accent').value = accent;
  if (/^#[0-9a-f]{6}$/i.test(accent)) {
    document.getElementById('form-accent-picker').value = accent;
  }

  // Links
  const container = document.getElementById('links-container');
  container.innerHTML = '';
  if (Array.isArray(data.links) && data.links.length) {
    data.links.forEach(l => addLinkRow(l));
  } else {
    addLinkRow({ type: 'phone', value: '', label: '' });
  }

  applyTierVisibility(document.getElementById('form-tier').value);
  updateDataFromForm();
  queueQrPreview();
}

function isPlaceholderCompanyLogo(value) {
  return typeof value === 'string' && /(?:^|\/)assets\/company-logo\.svg(?:[?#].*)?$/.test(value);
}

function applyTierVisibility(tier) {
  const full = tier === 'full';
  document.querySelectorAll('[data-full-tier]').forEach(group => { group.hidden = !full; });
  document.querySelectorAll('[data-qr-tier]').forEach(group => { group.hidden = tier === 'direct'; });
  document.getElementById('btn-add-link').hidden = !full;
  document.getElementById('links-title').textContent = full
    ? 'Links & Contacts'
    : tier === 'redirect' ? 'Client Social Link and Redirect Destination' : 'Client Social Link (Record Only)';
  const rows = [...document.querySelectorAll('.link-builder-row')];
  if (!full && rows.length > 1) rows.slice(1).forEach(row => row.remove());
  document.querySelectorAll('.remove-link-btn').forEach(button => { button.hidden = !full; });
  if (!full) {
    const type = document.querySelector('.link-builder-row .link-type');
    if (type && ['phone', 'email'].includes(type.value)) type.value = 'website';
  }
}

function resetNewProfileForm() {
  document.getElementById('editor-title').textContent = 'New Profile';
  document.getElementById('edit-id').value = '';
  document.getElementById('form-id').value = '';
  document.getElementById('id-status-badge').textContent = '';
  document.getElementById('form-tier').value = 'full';
  for (const inputId of ['photo-file-input', 'logo-file-input']) {
    const input = document.getElementById(inputId);
    if (input) input.value = '';
  }
  populateForm({
    schema: 1,
    template: 'clean-white',
    profile_mode: 'standard',
    name: '',
    company: '',
    title: '',
    title_link: '',
    bio: '',
    location: '',
    photo: '',
    company_logo: '',
    qr_code: '',
    theme: { mode: 'light', accent: '#6f91a5' },
    links: [{ type: 'phone', value: '' }]
  });
}

function updateDataFromForm() {
  const links = [];
  document.querySelectorAll('.link-builder-row').forEach((row, index) => {
    if (document.getElementById('form-tier').value !== 'full' && index > 0) return;
    const type = row.querySelector('.link-type').value;
    const value = row.querySelector('.link-value').value.trim();
    const label = row.querySelector('.link-label').value.trim();
    if (value) {
      links.push({ type, value, label: label || undefined });
    }
  });

  const tier = document.getElementById('form-tier').value;
  const redirectLink = links[0]?.value || '';
  activeProfileData = {
    schema: 1,
    template: tier === 'full' ? document.getElementById('form-template').value : 'clean-white',
    profile_mode: tier === 'full' ? document.getElementById('form-mode').value : 'standard',
    redirect_url: tier === 'redirect' && redirectLink
      ? (/^https?:\/\//i.test(redirectLink) ? redirectLink : `https://${redirectLink}`)
      : null,
    name: document.getElementById('form-name').value.trim(),
    reseller_id: Number(document.getElementById('form-reseller-id').value) || null,
    company: tier === 'full' ? document.getElementById('form-company').value.trim() : '',
    title: tier === 'full' ? document.getElementById('form-title').value.trim() : '',
    title_link: tier === 'full' ? (document.getElementById('form-title-link').value.trim() || null) : null,
    bio: tier === 'full' ? document.getElementById('form-bio').value.trim() : '',
    location: tier === 'full' ? document.getElementById('form-location').value.trim() : null,
    photo: tier === 'full' ? (document.getElementById('form-photo').value.trim() || null) : null,
    company_logo: tier === 'full' ? (document.getElementById('form-logo').value.trim() || null) : null,
    qr_code: activeProfileData.qr_code || null,
    theme: {
      mode: document.getElementById('form-template').value.includes('dark') || document.getElementById('form-template').value.includes('gold') ? 'dark' : 'light',
      accent: document.getElementById('form-accent').value.trim() || null
    },
    links
  };
}

function syncPreview() {
  const iframe = document.getElementById('preview-iframe');
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.__LINKR_PROFILE__ = activeProfileData;
      iframe.contentWindow.renderProfile?.(activeProfileData);
    } catch (e) {
      console.warn('Live preview could not be updated', e);
    }
  }
}

window.editProfile = async function(id) {
  try {
    await loadResellers();
    const res = await fetch(`/admin/api/admin/profiles?id=${id}`);
    if (!res.ok) throw new Error('Failed to load profile');
    const { profile, data } = await res.json();
    data.reseller_id = data.reseller_id || profile.retailer_id || null;

    document.getElementById('editor-title').textContent = `Editing: ${id}`;
    document.getElementById('edit-id').value = id;
    document.getElementById('form-id').value = id;
    document.getElementById('id-status-badge').textContent = `Editing (${profile.status})`;
    document.getElementById('id-status-badge').className = 'stock';
    document.getElementById('form-tier').value = profile.tier || 'full';

    populateForm(data);
    document.querySelector('[data-tab="editor"]').click();
  } catch (err) {
    alert('Error loading profile: ' + err.message);
  }
};

window.deleteProfile = async function(id) {
  if (!confirm(`Delete profile ${id}? Its ID will remain reserved, while its saved profile data and images are removed.`)) return;
  try {
    await deleteProfileRequest(id);
    await loadProfiles();
  } catch (error) {
    alert(`Could not delete profile: ${error.message}`);
  }
};

async function saveProfile() {
  if (isSavingProfile) return;
  isSavingProfile = true;
  const saveButton = document.getElementById('btn-save-profile');
  saveButton.disabled = true;
  try {
    const editId = document.getElementById('edit-id').value.trim();
    const isNew = !editId;
    const id = normalizeQrId(editId || document.getElementById('form-id').value || generateCardId());
    document.getElementById('form-id').value = id;
    updateDataFromForm();
    const tier = document.getElementById('form-tier').value;
    let qrCode = null;
    if (tier !== 'direct') {
      const profileUrl = `${QR_PROFILE_BASE_URL}${id}`;
      qrCode = await generateStyledQr(profileUrl, id);
      displayGeneratedQr(qrCode, id);
    }
    activeProfileData.qr_code = qrCode;
    const payload = {
      id,
      is_new: isNew,
      tier,
      status: tier === 'direct' ? 'archived' : 'active',
      template: activeProfileData.template,
      profile: activeProfileData,
      reason: isNew ? 'Created via Admin UI' : 'Updated via Admin UI'
    };

    const res = await fetch('/admin/api/admin/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`Save error (${res.status}):\n${data.error || 'Unknown error'}\n${(data.details || []).join('\n')}`);
      return;
    }

    alert(tier === 'direct'
      ? `Direct social record saved.\nReserved ID: ${data.id}\nNo public profile or QR is generated for this tier.`
      : `${isNew ? 'Profile created' : 'Profile updated'} successfully!\nCard ID: ${data.id}\nLive URL: ${data.url}`);
    if (isNew) {
      resetNewProfileForm();
    } else {
      document.getElementById('id-status-badge').textContent = 'Saved';
    }
    await loadProfiles();
  } catch (err) {
    alert('Network error saving profile: ' + err.message);
  } finally {
    isSavingProfile = false;
    saveButton.disabled = false;
  }
}

// 4. Batch Generator
function setupBatchGenerator() {
  const form = document.getElementById('batch-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const label = document.getElementById('batch-label').value.trim();
    const size = Number(document.getElementById('batch-size').value);
    const tier = document.getElementById('batch-tier').value;
    if (!Number.isInteger(size) || size < 1 || size > 500) {
      alert('Enter a quantity from 1 to 500.');
      return;
    }

    const btn = document.getElementById('btn-generate-batch');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const res = await fetch('/admin/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, size, tier })
      });

      const data = await res.json();
      btn.disabled = false;
      btn.textContent = 'Generate Stock IDs';

      if (!res.ok) throw new Error(data.error || 'Failed');

      document.getElementById('batch-output-status').textContent =
        `Successfully generated ${data.size} IDs in batch #${data.batch_id} (${data.label})`;

      const csvHeader = 'id,url,seq\n';
      const csvRows = data.items.map(item => `${item.id},${item.url},${item.seq}`).join('\n');
      const csvContent = csvHeader + csvRows;

      document.getElementById('batch-csv-preview').value = csvContent;
      document.getElementById('batch-result-actions').style.display = 'block';

      document.getElementById('btn-download-csv').onclick = () => {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${label}.csv`;
        a.click();
      };
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Generate Stock IDs';
      alert('Batch creation error: ' + err.message);
    }
  };
}

// 5. client.txt I/O
function setupClientTxtIO() {
  document.getElementById('btn-parse-txt').addEventListener('click', () => {
    const raw = document.getElementById('client-txt-area').value;
    const { profile, warnings } = parseClientText(raw);

    const warnBox = document.getElementById('txt-warnings');
    if (warnings.length) {
      warnBox.innerHTML = `<strong>Warnings:</strong><br>${warnings.join('<br>')}`;
      warnBox.style.display = 'block';
    } else {
      warnBox.style.display = 'none';
    }

    populateForm(profile);
    document.querySelector('[data-tab="editor"]').click();
  });

  document.getElementById('btn-export-txt').addEventListener('click', () => {
    updateDataFromForm();
    const txt = serializeClientText(activeProfileData);
    document.getElementById('client-txt-area').value = txt;
  });
}
