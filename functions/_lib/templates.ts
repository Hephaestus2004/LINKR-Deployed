// functions/_lib/templates.ts
// Template loader and Server-Inject (Option A) HTMLRewriter processor

import { ProfileData } from './types';

/**
 * Escapes JSON for safe inlining into HTML <script> tags without XSS vulnerabilities
 */
export function escapeJsonForHtml(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Injects Open Graph meta tags and inlines profile data into template HTML response
 */
export function injectProfileIntoHtml(
  templateHtml: string,
  profile: ProfileData,
  profileUrl: string
): string {
  const name = profile.name || 'LINKR Profile';
  const title = profile.title || '';
  const company = profile.company || '';
  const bio = profile.bio || '';
  const desc = [title, company, bio].filter(Boolean).join(' • ') || 'Digital Contact Profile on LINKR';
  const photo = profile.photo || 'https://linkr-tap.site/assets/contact-favicon.svg';

  const safeJson = escapeJsonForHtml(profile);

  const headInjection = `
  <!-- LINKR Dynamic Meta & Inlined Data -->
  <title>${escapeHtml(name)}${company ? ' — ' + escapeHtml(company) : ''}</title>
  <meta property="og:title" content="${escapeHtml(name)}${company ? ' — ' + escapeHtml(company) : ''}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${escapeHtml(photo)}">
  <meta property="og:url" content="${escapeHtml(profileUrl)}">
  <meta property="og:type" content="profile">
  <meta name="twitter:card" content="summary">
  <script>window.__LINKR_PROFILE__ = ${safeJson};</script>
`;

  // Inject into <head>
  if (templateHtml.includes('</head>')) {
    return templateHtml.replace('</head>', `${headInjection}</head>`);
  }
  return headInjection + templateHtml;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a branded system page (e.g. Unassigned/Claim, Suspended, 404 Not Found)
 */
export function generateSystemPage(type: 'claim' | 'suspended' | 'archived' | '404', id: string): string {
  const config = {
    claim: {
      title: 'LINKR — Card Ready to Claim',
      heading: 'Ready to Activate',
      subheading: `Card ID: <code>${id}</code>`,
      message: 'This LINKR smart card is unassigned and ready for setup. Click below to claim and activate your profile.',
      actionText: 'Claim Your Profile',
      actionUrl: `/c/${id}`,
      badgeColor: '#4f8daa'
    },
    suspended: {
      title: 'LINKR — Profile Unavailable',
      heading: 'Profile Unavailable',
      subheading: `ID: <code>${id}</code>`,
      message: 'This profile has been temporarily suspended or is undergoing review. If you are the owner, please contact support.',
      actionText: 'Contact Support',
      actionUrl: 'https://linkr-tap.site#contact',
      badgeColor: '#e06c75'
    },
    archived: {
      title: 'LINKR — Profile No Longer Active',
      heading: 'Profile Retired',
      subheading: `ID: <code>${id}</code>`,
      message: 'This contact profile has been retired and is no longer active.',
      actionText: 'Get Your Own LINKR',
      actionUrl: 'https://linkr-tap.site',
      badgeColor: '#9aa0a8'
    },
    '404': {
      title: 'LINKR — Profile Not Found',
      heading: 'Card Not Found',
      subheading: `ID: <code>${id}</code>`,
      message: 'We could not find a registered profile for this card link. Please verify the QR code or link.',
      actionText: 'Back to Home',
      actionUrl: 'https://linkr-tap.site',
      badgeColor: '#d19a66'
    }
  }[type];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${config.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #071016;
      color: #f4f8fa;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .box {
      max-width: 420px;
      width: 100%;
      background: rgba(18, 32, 41, 0.85);
      border: 1px solid rgba(177, 213, 228, 0.2);
      border-radius: 24px;
      padding: 36px 28px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      backdrop-filter: blur(20px);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: ${config.badgeColor}22;
      border: 1px solid ${config.badgeColor}66;
      color: ${config.badgeColor};
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 20px;
    }
    h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 8px; }
    .sub { font-size: 0.9rem; color: #8ea8b7; margin-bottom: 18px; }
    code { background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; font-family: monospace; }
    p { font-size: 0.95rem; color: #9aaeb9; line-height: 1.55; margin-bottom: 28px; }
    .btn {
      display: block;
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(135deg, #a8d3e3, #6f9fb7);
      color: #071016;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.95rem;
      border-radius: 14px;
      transition: transform 0.2s, filter 0.2s;
    }
    .btn:hover { filter: brightness(1.1); transform: translateY(-2px); }
    footer { margin-top: 24px; font-size: 0.75rem; color: #5d717d; }
    footer a { color: inherit; text-decoration: none; }
  </style>
</head>
<body>
  <div class="box">
    <div class="badge">LINKR</div>
    <h1>${config.heading}</h1>
    <div class="sub">${config.subheading}</div>
    <p>${config.message}</p>
    <a href="${config.actionUrl}" class="btn">${config.actionText}</a>
    <footer>&copy; 2026 <a href="https://linkr-tap.site">linkr-tap.site</a></footer>
  </div>
</body>
</html>`;
}
