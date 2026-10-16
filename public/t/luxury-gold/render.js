// public/t/luxury-gold/render.js
// Luxury Gold template renderer

import { ICONS, TYPES, partitionLinks } from '/shared/links.js';
import { setupSaveContact } from '/shared/vcard.js';
import { setupProfileFlip, shareProfile, applyTheme, generateInitialsAvatar } from '/shared/ui.js';

export function renderProfile(profile) {
  if (!profile) return;

  const show = profile.show || {};
  const isLogoOnly = profile.profile_mode === 'logo_only';

  const theme = { mode: 'dark', accent: '#d4af37', ...profile.theme };
  applyTheme(theme);

  if (profile.name) {
    document.title = profile.company ? `${profile.name} — ${profile.company}` : profile.name;
  }

  const front = document.querySelector('.profile-front');
  if (front) front.classList.toggle('logo-only', isLogoOnly);

  const nameEl = document.getElementById('name');
  if (nameEl) nameEl.textContent = (!isLogoOnly && show.name !== false) ? (profile.name || '') : '';

  const titleEl = document.getElementById('title');
  if (titleEl) {
    titleEl.innerHTML = '';
    if (!isLogoOnly && show.title !== false && profile.title) {
      if (profile.title_link) {
        const a = document.createElement('a');
        a.href = profile.title_link;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = profile.title;
        titleEl.appendChild(a);
      } else {
        titleEl.textContent = profile.title;
      }
    }
  }

  const locEl = document.getElementById('location');
  if (locEl) {
    if (!isLogoOnly && profile.location) {
      locEl.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.location}</svg><span>${profile.location}</span>`;
      locEl.hidden = false;
    } else {
      locEl.hidden = true;
    }
  }

  const bioEl = document.getElementById('bio');
  if (bioEl) bioEl.textContent = (!isLogoOnly && show.bio !== false) ? (profile.bio || '') : '';

  // Photo
  const photoEl = document.getElementById('photo');
  if (photoEl) {
    if (!isLogoOnly && show.photo !== false) {
      if (profile.photo) {
        photoEl.src = profile.photo;
        photoEl.alt = profile.name || 'Profile photo';
        photoEl.hidden = false;
        photoEl.onerror = () => {
          photoEl.src = generateInitialsAvatar(profile.name, '#d4af37');
        };
      } else if (profile.name) {
        photoEl.src = generateInitialsAvatar(profile.name, '#d4af37');
        photoEl.alt = profile.name;
        photoEl.hidden = false;
      } else {
        photoEl.hidden = true;
      }
    } else {
      photoEl.hidden = true;
    }
  }

  // Company Logo (strictly optional)
  const logoLinkEl = document.getElementById('company-logo-link');
  const logoEl = document.getElementById('company-logo');
  if (logoEl && logoLinkEl) {
    if (show.company_logo !== false && profile.company_logo) {
      logoEl.src = profile.company_logo;
      logoEl.alt = profile.company || 'Company logo';
      if (profile.title_link) logoLinkEl.href = profile.title_link;
      logoLinkEl.hidden = false;
    } else {
      logoLinkEl.hidden = true;
    }
  }

  // QR Code
  const qrEl = document.getElementById('profile-qr');
  if (qrEl) qrEl.src = profile.qr_code || '/assets/qr-code.svg';

  // Quick actions (max 6)
  const { quickActions, remainingLinks } = partitionLinks(profile.links, 6);
  const quickNav = document.getElementById('quick-actions');
  if (quickNav) {
    quickNav.innerHTML = '';
    quickActions.forEach(link => {
      const typeDef = TYPES[link.type] || TYPES.custom;
      const href = typeDef.href(link.value);
      const label = link.label || typeDef.label;

      const a = document.createElement('a');
      a.href = href;
      a.setAttribute('aria-label', label);
      a.title = label;
      if (href.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener';
      }

      const iconSpan = document.createElement('span');
      iconSpan.className = 'action-icon';
      iconSpan.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[typeDef.icon] || ICONS.custom}</svg>`;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'action-label';
      labelSpan.textContent = label;

      a.appendChild(iconSpan);
      a.appendChild(labelSpan);
      quickNav.appendChild(a);
    });
  }

  // Links List
  const linksList = document.getElementById('links');
  if (linksList) {
    linksList.innerHTML = '';

    // Share button
    const shareLi = document.createElement('li');
    const shareBtn = document.createElement('button');
    shareBtn.className = 'share-profile';
    shareBtn.type = 'button';
    shareBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.share}</svg><span>Share profile</span>`;
    shareBtn.onclick = async () => {
      const res = await shareProfile(profile);
      if (res === 'copied') {
        const label = shareBtn.querySelector('span');
        if (label) {
          const orig = label.textContent;
          label.textContent = 'Link copied!';
          setTimeout(() => { label.textContent = orig; }, 1600);
        }
      }
    };
    shareLi.appendChild(shareBtn);
    linksList.appendChild(shareLi);

    remainingLinks.forEach(link => {
      const typeDef = TYPES[link.type] || TYPES.custom;
      const href = typeDef.href(link.value);
      const label = link.label || typeDef.label;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      if (href.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener';
      }

      a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[typeDef.icon] || ICONS.custom}</svg>`;

      const content = document.createElement('span');
      content.className = 'link-content';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'link-label';
      labelSpan.textContent = label;
      content.appendChild(labelSpan);

      if (link.value && link.type !== 'phone' && link.type !== 'email') {
        const valSpan = document.createElement('span');
        valSpan.className = 'link-value';
        valSpan.textContent = link.value;
        content.appendChild(valSpan);
      }

      a.appendChild(content);
      li.appendChild(a);

      if (link.type === 'phone' || link.type === 'email') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-link';
        copyBtn.type = 'button';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = async (e) => {
          e.preventDefault();
          await navigator.clipboard.writeText(link.value);
          copyBtn.textContent = 'Copied';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
        };
        li.appendChild(copyBtn);
      }

      linksList.appendChild(li);
    });
  }

  // Save Contact & Flip
  setupSaveContact(document.getElementById('save'), document.getElementById('vcf-fallback'), profile);
  setupProfileFlip();
}

if (window.__LINKR_PROFILE__) {
  renderProfile(window.__LINKR_PROFILE__);
} else {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const pid = (parts[0] === 'u' && parts[1]) ? parts[1] : null;
  if (pid) {
    fetch(`/api/profile/${pid}`)
      .then(r => r.json())
      .then(d => renderProfile(d))
      .catch(() => loadClientFallback());
  } else {
    loadClientFallback();
  }
}

function loadClientFallback() {
  import('/shared/parse.js').then(({ parseClientText }) => {
    fetch('client.txt', { cache: 'no-store' })
      .then(r => r.ok ? r.text() : '')
      .then(txt => { if (txt) renderProfile(parseClientText(txt).profile); });
  });
}
