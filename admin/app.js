// admin/app.js
// Admin console interactions, real-time preview, CRUD, and batch operations

import { parseClientText, serializeClientText } from '/shared/parse.js';

const AVAILABLE_TEMPLATES = new Set(['clean-white', 'glass-dark', 'luxury-gold', 'bold-pop']);
const normalizeTemplate = (template) => AVAILABLE_TEMPLATES.has(template) ? template : 'clean-white';
let isSavingProfile = false;
let qrPreviewTimer = null;
let qrPreviewRevision = 0;
let qrDownloadData = { standard: null, transparent: null };

const QR_LOGO_URL = '/assets/linkr-qr-logo.png';
const QR_PROFILE_BASE_URL = 'https://linkr-tap.site/u/';
const QR_ID_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

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

async function generateStyledQr(profileUrl, format = 'standard') {
  if (!window.QRCode?.toCanvas) throw new Error('The QR encoder did not load. Refresh the admin page and try again.');

  const transparent = format === 'transparent';
  const foreground = transparent ? '#ffffff' : '#000000';
  const background = transparent ? '#ffffff00' : '#ffffff';
  const qr = window.QRCode.create(profileUrl, { errorCorrectionLevel: 'H' });
  const canvas = document.createElement('canvas');
  await window.QRCode.toCanvas(canvas, profileUrl, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 640,
    color: { dark: foreground, light: background }
  });

  const ctx = canvas.getContext('2d');
  const moduleCount = qr.modules.size;
  const quietZone = 4;
  const unit = canvas.width / (moduleCount + quietZone * 2);
  const eyeSize = unit * 7;
  const eyes = [
    [quietZone, quietZone],
    [quietZone + moduleCount - 7, quietZone],
    [quietZone, quietZone + moduleCount - 7]
  ];

  eyes.forEach(([col, row]) => {
    const x = col * unit;
    const y = row * unit;
    if (transparent) ctx.clearRect(x, y, eyeSize, eyeSize);
    else {
      ctx.fillStyle = background;
      ctx.fillRect(x, y, eyeSize, eyeSize);
    }
    drawRoundedRect(ctx, x + unit / 2, y + unit / 2, eyeSize - unit, eyeSize - unit, unit * 2, null, foreground, unit);
    drawRoundedRect(ctx, x + unit * 2, y + unit * 2, unit * 3, unit * 3, unit * 0.7, foreground);
  });

  if (transparent) return canvas.toDataURL('image/png');

  const logo = new Image();
  logo.src = QR_LOGO_URL;
  try {
    await logo.decode();
  } catch {
    // The QR remains scannable without the optional centered brand mark.
    return canvas.toDataURL('image/png');
  }
  const panelSize = canvas.width * 0.22;
  const logoSize = canvas.width * 0.17;
  const panelX = (canvas.width - panelSize) / 2;
  const panelY = (canvas.height - panelSize) / 2;
  drawRoundedRect(ctx, panelX, panelY, panelSize, panelSize, panelSize * 0.13, '#000000');
  ctx.drawImage(logo, (canvas.width - logoSize) / 2, (canvas.height - logoSize) / 2, logoSize, logoSize);

  return canvas.toDataURL('image/png');
}

function displayGeneratedQrs(standard, transparent, id) {
  qrDownloadData = { standard, transparent };
  for (const [format, dataUrl] of Object.entries(qrDownloadData)) {
    const image = document.getElementById(`qr-preview-${format}`);
    image.src = dataUrl;
    image.hidden = false;
    document.getElementById(`btn-download-qr-${format}`).hidden = false;
  }
  document.getElementById('qr-preview-status').textContent = `QR codes ready for https://linkr-tap.site/u/${id}`;
}

function queueQrPreview() {
  clearTimeout(qrPreviewTimer);
  const id = normalizeQrId(document.getElementById('edit-id').value || document.getElementById('form-id').value);
  const status = document.getElementById('qr-preview-status');
  const revision = ++qrPreviewRevision;
  const clearQrPreviews = () => {
    qrDownloadData = { standard: null, transparent: null };
    for (const format of ['standard', 'transparent']) {
      document.getElementById(`qr-preview-${format}`).hidden = true;
      document.getElementById(`btn-download-qr-${format}`).hidden = true;
    }
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
      const [standard, transparent] = await Promise.all([
        generateStyledQr(`${QR_PROFILE_BASE_URL}${id}`, 'standard'),
        generateStyledQr(`${QR_PROFILE_BASE_URL}${id}`, 'transparent')
      ]);
      if (revision !== qrPreviewRevision) return;
      activeProfileData.qr_code = standard;
      displayGeneratedQrs(standard, transparent, id);
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
  setupEditor();
  setupBatchGenerator();
  setupClientTxtIO();
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
    });
  });
}

// 2. Profiles Table
async function loadProfiles() {
  const tbody = document.getElementById('profiles-table-body');
  const statusFilter = document.getElementById('filter-status').value;
  document.getElementById('select-all-profiles').checked = false;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading profiles...</td></tr>';

  try {
    const url = statusFilter ? `/admin/api/admin/profiles?status=${statusFilter}` : '/admin/api/admin/profiles';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    currentProfiles = data.profiles || [];
    renderProfilesTable(currentProfiles);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger)">Error loading profiles: ${err.message}</td></tr>`;
  }
}

function renderProfilesTable(profiles) {
  const tbody = document.getElementById('profiles-table-body');
  if (!profiles.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-muted)">No profiles found</td></tr>';
    updateBulkDeleteButton();
    return;
  }

  tbody.innerHTML = profiles.map(p => `
    <tr>
      <td><input type="checkbox" class="profile-select" data-id="${p.id}" aria-label="Select profile ${p.id}"></td>
      <td><code>${p.id}</code></td>
      <td>#${p.seq}</td>
      <td><span class="badge badge-${p.status}">${p.tier === 'direct' && p.status === 'archived' ? 'Reserved' : p.status}</span></td>
      <td>${p.tier || 'full'}</td>
      <td>${p.template || 'clean-white'}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted)">${p.updated_at ? p.updated_at.slice(0, 10) : ''}</td>
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
  exportButton.textContent = `Export transparent QR + ID PNGs (${selected.length})`;
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

async function generateUserIdPng(id) {
  if (document.fonts?.load) {
    await document.fonts.load('italic 6px "JetBrains Mono"');
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = 'italic 6px "JetBrains Mono", monospace';
  const metrics = ctx.measureText(id);
  canvas.width = Math.ceil(metrics.width) + 2;
  canvas.height = 9;
  ctx.font = 'italic 6px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  ctx.fillText(id, 1, 1);
  const image = await fetch(canvas.toDataURL('image/png')).then((response) => response.arrayBuffer());
  return new Uint8Array(image);
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
  const qrSize = 360;
  const cellWidth = 420;
  const cellHeight = 420;
  const gap = 24;
  const margin = 48;
  const files = [];
  const pageCount = Math.ceil(exportable.length / perPage);
  try {
    await document.fonts.load('italic 700 26px "JetBrains Mono"');
    for (let page = 0; page < pageCount; page++) {
      const pageProfiles = exportable.slice(page * perPage, (page + 1) * perPage);
      const canvas = document.createElement('canvas');
      canvas.width = margin * 2 + columns * cellWidth + (columns - 1) * gap;
      canvas.height = margin * 2 + rowsPerPage * cellHeight + (rowsPerPage - 1) * gap;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('This browser could not create the merged PNG canvas.');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 700 26px "JetBrains Mono", monospace';

      for (let index = 0; index < pageProfiles.length; index++) {
        const id = pageProfiles[index].id;
        button.textContent = `Building sheet ${page + 1}/${pageCount} (${index + 1}/${pageProfiles.length})...`;
        const qrData = await generateStyledQr(`${QR_PROFILE_BASE_URL}${id}`, 'transparent');
        const qrImage = await loadImage(qrData);
        const column = index % columns;
        const row = Math.floor(index / columns);
        const cellX = margin + column * (cellWidth + gap);
        const cellY = margin + row * (cellHeight + gap);
        ctx.drawImage(qrImage, cellX + (cellWidth - qrSize) / 2, cellY, qrSize, qrSize);
        ctx.fillText(id, cellX + cellWidth / 2, cellY + qrSize + 20, cellWidth - 12);
      }

      const blob = await canvasToBlob(canvas);
      const data = await blob.arrayBuffer();
      files.push({ name: `linkr-qr-sheet-${String(page + 1).padStart(2, '0')}.png`, data: new Uint8Array(data) });
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

async function exportSelectedTransparentQrs() {
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
      const dataUrl = await generateStyledQr(`${QR_PROFILE_BASE_URL}${id}`, 'transparent');
      const image = await fetch(dataUrl).then((response) => response.arrayBuffer());
      files.push({ name: `${id}-qr-transparent.png`, data: new Uint8Array(image) });
      files.push({ name: `${id}-userid.png`, data: await generateUserIdPng(id) });
    }
    const zip = createZip(files);
    const url = URL.createObjectURL(zip);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `linkr-transparent-qr-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    if (skipped) alert(`Exported ${files.length} transparent QR codes. Skipped ${skipped} direct-social record${skipped === 1 ? '' : 's'} because they do not use profile QR codes.`);
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
  for (const format of ['standard', 'transparent']) {
    document.getElementById(`btn-download-qr-${format}`).addEventListener('click', () => {
    const dataUrl = qrDownloadData[format];
    if (!dataUrl) return;
    const id = normalizeQrId(document.getElementById('edit-id').value || document.getElementById('form-id').value);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${id || 'linkr-profile'}-qr-${format}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    });
  }

  document.getElementById('btn-save-profile').addEventListener('click', saveProfile);
  document.getElementById('btn-refresh-preview').addEventListener('click', syncPreview);
  document.getElementById('btn-new-profile').addEventListener('click', () => {
    resetNewProfileForm();
    document.querySelector('[data-tab="editor"]').click();
  });

  document.getElementById('btn-refresh-profiles').addEventListener('click', loadProfiles);
  document.getElementById('filter-status').addEventListener('change', loadProfiles);
  document.getElementById('select-all-profiles').addEventListener('change', (event) => {
    document.querySelectorAll('.profile-select').forEach((checkbox) => { checkbox.checked = event.target.checked; });
    updateBulkDeleteButton();
  });
  document.getElementById('profiles-table-body').addEventListener('change', (event) => {
    if (event.target.matches('.profile-select')) updateBulkDeleteButton();
  });
  document.getElementById('btn-delete-selected').addEventListener('click', deleteSelectedProfiles);
  document.getElementById('btn-export-selected-qr').addEventListener('click', exportSelectedTransparentQrs);
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
    const res = await fetch(`/admin/api/admin/profiles?id=${id}`);
    if (!res.ok) throw new Error('Failed to load profile');
    const { profile, data } = await res.json();

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
      const [standard, transparent] = await Promise.all([
        generateStyledQr(profileUrl, 'standard'),
        generateStyledQr(profileUrl, 'transparent')
      ]);
      qrCode = standard;
      displayGeneratedQrs(standard, transparent, id);
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
