// public/t/glass-dark/render.js
// Glass Dark template renderer

import { ICONS, TYPES, partitionLinks } from '/shared/links.js';
import { setupSaveContact } from '/shared/vcard.js';
import { setupProfileFlip, shareProfile, applyTheme, generateInitialsAvatar } from '/shared/ui.js';

export function renderProfile(profile) {
  if (!profile) return;

  const show = profile.show || {};
  const isLogoOnly = profile.profile_mode === 'logo_only';

  // Apply Theme (defaults to dark mode for glass-dark)
  const theme = { mode: 'dark', ...profile.theme };
  applyTheme(theme);

  // Document Title
  if (profile.name) {
    document.title = profile.company ? `${profile.name} — ${profile.company}` : profile.name;
  }

  // Toggle logo-only mode
  const front = document.querySelector('.profile-front');
  if (front) {
    front.classList.toggle('logo-only', isLogoOnly);
  }

  // Identity elements
  const nameEl = document.getElementById('name');
  if (nameEl) {
    nameEl.textContent = (!isLogoOnly && show.name !== false) ? (profile.name || '') : '';
  }

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
  if (bioEl) {
    bioEl.textContent = (!isLogoOnly && show.bio !== false) ? (profile.bio || '') : '';
  }

  // Photo / Avatar
  const photoEl = document.getElementById('photo');
  if (photoEl) {
    if (!isLogoOnly && show.photo !== false) {
      if (profile.photo) {
        photoEl.src = profile.photo;
        photoEl.alt = profile.name || 'Profile photo';
        photoEl.hidden = false;
        photoEl.onerror = () => {
          photoEl.src = generateInitialsAvatar(profile.name, profile.theme?.accent || '#8eb8cd');
        };
      } else if (profile.name) {
        photoEl.src = generateInitialsAvatar(profile.name, profile.theme?.accent || '#8eb8cd');
        photoEl.alt = profile.name;
        photoEl.hidden = false;
      } else {
        photoEl.hidden = true;
      }
    } else {
      photoEl.hidden = true;
    }
  }

  // Company Logo
  const logoLinkEl = document.getElementById('company-logo-link');
  const logoEl = document.getElementById('company-logo');
  if (logoEl && logoLinkEl) {
    if (show.company_logo !== false && profile.company_logo) {
      logoEl.src = profile.company_logo;
      logoEl.alt = profile.company || 'Company logo';
      if (profile.title_link) {
        logoLinkEl.href = profile.title_link;
      } else {
        logoLinkEl.removeAttribute('href');
      }
      logoLinkEl.hidden = false;
    } else {
      logoLinkEl.hidden = true;
    }
  }

  // QR Code
  const qrEl = document.getElementById('profile-qr');
  if (qrEl) {
    if (profile.qr_code) {
      qrEl.src = profile.qr_code;
    } else {
      qrEl.src = '/assets/qr-code.svg';
    }
  }

  // Partition links: Quick actions vs Remaining links
  const { quickActions, remainingLinks } = partitionLinks(profile.links, 8);

  // Render Quick Actions
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
      iconSpan.className = `action-icon action-${link.type}`;
      iconSpan.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[typeDef.icon] || ICONS.custom}</svg>`;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'action-label';
      labelSpan.textContent = label;

      a.appendChild(iconSpan);
      a.appendChild(labelSpan);
      quickNav.appendChild(a);
    });
  }

  // Render Full Link List
  const linksList = document.getElementById('links');
  if (linksList) {
    linksList.innerHTML = '';

    // Always include Share Profile button per 03_DATA_SCHEMA.md Section 9
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
          const original = label.textContent;
          label.textContent = 'Link copied!';
          setTimeout(() => { label.textContent = original; }, 1600);
        }
      }
    };
    shareLi.appendChild(shareBtn);
    linksList.appendChild(shareLi);

    // Remaining links
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

      // Copy button for phone and email
      if (link.type === 'phone' || link.type === 'email') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-link';
        copyBtn.type = 'button';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = async (e) => {
          e.preventDefault();
          try {
            await navigator.clipboard.writeText(link.value);
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
          } catch (err) {
            console.error('Failed to copy', err);
          }
        };
        li.appendChild(copyBtn);
      }

      linksList.appendChild(li);
    });
  }

  // Save contact button
  const saveBtn = document.getElementById('save');
  const fallbackBtn = document.getElementById('vcf-fallback');
  setupSaveContact(saveBtn, fallbackBtn, profile);

  // Setup QR Flip
  setupProfileFlip();
}

// Auto-boot: If profile injected by server, render immediately; else fetch from API or client.txt
if (window.__LINKR_PROFILE__) {
  renderProfile(window.__LINKR_PROFILE__);
} else {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const profileId = (pathParts[0] === 'u' && pathParts[1]) ? pathParts[1] : null;

  if (profileId) {
    fetch(`/api/profile/${profileId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => renderProfile(data))
      .catch(err => {
        console.warn('API profile lookup failed, trying client.txt fallback', err);
        loadClientTextFallback();
      });
  } else {
    loadClientTextFallback();
  }
}

function loadClientTextFallback() {
  import('/shared/parse.js').then(({ parseClientText }) => {
    fetch('client.txt', { cache: 'no-store' })
      .then(res => res.ok ? res.text() : '')
      .then(text => {
        if (text) {
          const { profile } = parseClientText(text);
          renderProfile(profile);
        }
      })
      .catch(e => console.error('Unable to load client.txt', e));
  });
}
