// admin/app.js
// Admin console interactions, real-time preview, CRUD, and batch operations

import { parseClientText, serializeClientText } from '/shared/parse.js';

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
  company_logo: '/assets/company-logo.svg',
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
  tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading profiles...</td></tr>';

  try {
    const url = statusFilter ? `/admin/api/admin/profiles?status=${statusFilter}` : '/admin/api/admin/profiles';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    currentProfiles = data.profiles || [];
    renderProfilesTable(currentProfiles);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger)">Error loading profiles: ${err.message}</td></tr>`;
  }
}

function renderProfilesTable(profiles) {
  const tbody = document.getElementById('profiles-table-body');
  if (!profiles.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted)">No profiles found</td></tr>';
    return;
  }

  tbody.innerHTML = profiles.map(p => `
    <tr>
      <td><code>${p.id}</code></td>
      <td>#${p.seq}</td>
      <td><span class="badge badge-${p.status}">${p.status}</span></td>
      <td>${p.tier || 'full'}</td>
      <td>${p.template || 'clean-white'}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted)">${p.updated_at ? p.updated_at.slice(0, 10) : ''}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="window.editProfile('${p.id}')">Edit</button>
        <a class="btn btn-sm btn-secondary" href="/u/${p.id}" target="_blank" rel="noopener">View</a>
      </td>
    </tr>
  `).join('');
}

// 3. Editor Setup & Real-time Live Preview
function setupEditor() {
  populateForm(activeProfileData);

  document.getElementById('profile-form').addEventListener('input', () => {
    updateDataFromForm();
    syncPreview();
  });

  document.getElementById('form-template').addEventListener('change', () => {
    const tmpl = document.getElementById('form-template').value;
    const iframe = document.getElementById('preview-iframe');
    iframe.src = `/t/${tmpl}/index.html`;
    iframe.onload = () => syncPreview();
  });

  document.getElementById('form-tier').addEventListener('change', (e) => {
    const isRedirect = e.target.value === 'redirect';
    document.getElementById('redirect-url-group').style.display = isRedirect ? 'block' : 'none';
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
            idBadge.textContent = '🔵 Stock card ready';
            idBadge.className = 'stock';
          } else {
            idBadge.textContent = '🔴 Already active';
            idBadge.className = 'taken';
          }
        } else {
          idBadge.textContent = '🟢 Available (New ID)';
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
  setupImageUploader('qr-file-input', 'form-qr', 'qr-preview-thumb', 1000, 1000);

  document.getElementById('btn-remove-photo').addEventListener('click', () => {
    document.getElementById('form-photo').value = '';
    document.getElementById('photo-preview-thumb').src = '/assets/profile-photo.svg';
    updateDataFromForm();
    syncPreview();
  });

  document.getElementById('btn-remove-logo').addEventListener('click', () => {
    document.getElementById('form-logo').value = '';
    document.getElementById('logo-preview-thumb').src = '/assets/company-logo.svg';
    updateDataFromForm();
    syncPreview();
  });
  document.getElementById('btn-remove-qr').addEventListener('click', () => {
    document.getElementById('form-qr').value = '';
    document.getElementById('qr-preview-thumb').src = '/assets/qr-code.svg';
    updateDataFromForm();
    syncPreview();
  });

  document.getElementById('form-photo').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    document.getElementById('photo-preview-thumb').src = val || '/assets/profile-photo.svg';
  });

  document.getElementById('form-logo').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    document.getElementById('logo-preview-thumb').src = val || '/assets/company-logo.svg';
  });
  document.getElementById('form-qr').addEventListener('input', (e) => {
    document.getElementById('qr-preview-thumb').src = e.target.value.trim() || '/assets/qr-code.svg';
  });

  document.getElementById('btn-save-profile').addEventListener('click', saveProfile);
  document.getElementById('btn-refresh-preview').addEventListener('click', syncPreview);
  document.getElementById('btn-new-profile').addEventListener('click', () => {
    document.getElementById('editor-title').textContent = 'New Profile';
    document.getElementById('edit-id').value = '';
    document.getElementById('form-id').value = '';
    document.getElementById('id-status-badge').textContent = '';
    document.getElementById('photo-preview-thumb').src = '/assets/profile-photo.svg';
    document.getElementById('logo-preview-thumb').src = '/assets/company-logo.svg';
    document.getElementById('qr-preview-thumb').src = '/assets/qr-code.svg';
    populateForm({
      schema: 1,
      template: 'clean-white',
      profile_mode: 'standard',
      name: '',
      company: '',
      title: '',
      bio: '',
      location: '',
      photo: '',
      company_logo: '',
      qr_code: '',
      links: [{ type: 'phone', value: '' }]
    });
    document.querySelector('[data-tab="editor"]').click();
  });

  document.getElementById('btn-refresh-profiles').addEventListener('click', loadProfiles);
  document.getElementById('filter-status').addEventListener('change', loadProfiles);
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
        document.getElementById(previewImgId).src = dataUrl;
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

  const logo = data.company_logo || '';
  document.getElementById('form-logo').value = logo;
  document.getElementById('logo-preview-thumb').src = logo || '/assets/company-logo.svg';
  const qr = data.qr_code || '';
  document.getElementById('form-qr').value = qr;
  document.getElementById('qr-preview-thumb').src = qr || '/assets/qr-code.svg';

  document.getElementById('form-template').value = data.template || 'clean-white';
  document.getElementById('form-mode').value = data.profile_mode || 'standard';
  document.getElementById('form-redirect-url').value = data.redirect_url || '';

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

  syncPreview();
}

function updateDataFromForm() {
  const links = [];
  document.querySelectorAll('.link-builder-row').forEach(row => {
    const type = row.querySelector('.link-type').value;
    const value = row.querySelector('.link-value').value.trim();
    const label = row.querySelector('.link-label').value.trim();
    if (value) {
      links.push({ type, value, label: label || undefined });
    }
  });

  activeProfileData = {
    schema: 1,
    template: document.getElementById('form-template').value,
    profile_mode: document.getElementById('form-mode').value,
    redirect_url: document.getElementById('form-redirect-url').value.trim() || null,
    name: document.getElementById('form-name').value.trim(),
    company: document.getElementById('form-company').value.trim(),
    title: document.getElementById('form-title').value.trim(),
    title_link: document.getElementById('form-title-link').value.trim() || null,
    bio: document.getElementById('form-bio').value.trim(),
    location: document.getElementById('form-location').value.trim(),
    photo: document.getElementById('form-photo').value.trim() || null,
    company_logo: document.getElementById('form-logo').value.trim() || null,
    qr_code: document.getElementById('form-qr').value.trim() || null,
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
      if (typeof iframe.contentWindow.renderProfile === 'function') {
        iframe.contentWindow.renderProfile(activeProfileData);
      } else {
        iframe.contentWindow.__LINKR_PROFILE__ = activeProfileData;
      }
    } catch (e) {
      // Cross-origin fallback
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

async function saveProfile() {
  updateDataFromForm();

  const editId = document.getElementById('edit-id').value.trim();
  const inputId = document.getElementById('form-id').value.trim();
  const id = editId || inputId;
  const isNew = !editId;
  const tier = document.getElementById('form-tier').value;

  const payload = {
    id: id || undefined,
    is_new: isNew,
    tier,
    template: activeProfileData.template,
    profile: activeProfileData,
    reason: isNew ? 'Created via Admin UI' : 'Updated via Admin UI'
  };

  try {
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

    alert(`Profile saved successfully!\nCard ID: ${data.id}\nLive URL: ${data.url}`);
    document.getElementById('edit-id').value = data.id;
    document.getElementById('form-id').value = data.id;
    document.getElementById('editor-title').textContent = `Editing: ${data.id}`;
    document.getElementById('id-status-badge').textContent = 'Saved';
    document.getElementById('id-status-badge').className = 'available';
    loadProfiles();
  } catch (err) {
    alert('Network error saving profile: ' + err.message);
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
