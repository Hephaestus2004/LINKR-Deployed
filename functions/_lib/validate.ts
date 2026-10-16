// functions/_lib/validate.ts
// Profile validation rules adhering strictly to 03_DATA_SCHEMA.md Section 7

import { ProfileData } from './types';

const ALLOWED_SCHEMES = ['http:', 'https:', 'tel:', 'mailto:', 'viber:', 'sms:'];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProfile(profile: ProfileData, tier: string = 'full'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Redirect Tier check
  if (tier === 'redirect') {
    if (!profile.redirect_url) {
      errors.push('Redirect tier requires a valid "redirect_url".');
    } else {
      try {
        const u = new URL(profile.redirect_url);
        if (!['http:', 'https:'].includes(u.protocol)) {
          errors.push('redirect_url must be an http or https URL.');
        }
      } catch {
        errors.push('redirect_url is malformed.');
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  // 2. Minimum viable profile: name OR company_logo AND at least one link
  const hasName = Boolean(profile.name && profile.name.trim().length > 0);
  const hasLogo = Boolean(profile.company_logo && profile.company_logo.trim().length > 0);

  if (!hasName && !hasLogo) {
    errors.push('Minimum viable profile requires either "name" or "company_logo".');
  }

  const links = Array.isArray(profile.links) ? profile.links : [];
  if (links.length === 0) {
    errors.push('Profile must contain at least 1 link.');
  }

  // 3. Length caps
  if (profile.name && profile.name.length > 60) {
    errors.push(`Name exceeds 60 characters limit (${profile.name.length} chars).`);
  }
  if (profile.company && profile.company.length > 80) {
    errors.push(`Company exceeds 80 characters limit (${profile.company.length} chars).`);
  }
  if (profile.title && profile.title.length > 80) {
    errors.push(`Title exceeds 80 characters limit (${profile.title.length} chars).`);
  }
  if (profile.bio && profile.bio.length > 300) {
    errors.push(`Bio exceeds 300 characters limit (${profile.bio.length} chars).`);
  }
  if (profile.location && profile.location.length > 120) {
    errors.push(`Location exceeds 120 characters limit (${profile.location.length} chars).`);
  }

  // 4. Link validation & hard tier caps
  if (links.length > 15) {
    errors.push(`Hard limit is 15 links (submitted ${links.length}).`);
  }

  links.forEach((link, idx) => {
    if (!link.value || !String(link.value).trim()) {
      errors.push(`Link ${idx + 1} (${link.type}) has an empty value.`);
      return;
    }

    const val = String(link.value).trim();

    if (link.type === 'phone') {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 7) {
        errors.push(`Phone number "${val}" must contain at least 7 digits.`);
      }
    } else if (link.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errors.push(`Email address "${val}" is malformed.`);
      }
    } else if (['website', 'custom', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'github'].includes(link.type)) {
      const normalized = /^https?:\/\//i.test(val) ? val : 'https://' + val;
      try {
        const u = new URL(normalized);
        if (!ALLOWED_SCHEMES.includes(u.protocol)) {
          errors.push(`URL scheme "${u.protocol}" is not permitted.`);
        }
      } catch {
        errors.push(`Link URL "${val}" is invalid.`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
