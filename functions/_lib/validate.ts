// functions/_lib/validate.ts
// Profile validation rules adhering strictly to 03_DATA_SCHEMA.md Section 7

import {
  PROFILE_ICON_PACK_IDS,
  PROFILE_SECTION_IDS,
  PROFILE_THEME_PRESET_IDS,
  ProfileData
} from './types';

const ALLOWED_SCHEMES = ['http:', 'https:', 'tel:', 'mailto:', 'viber:', 'sms:'];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProfile(profile: ProfileData, tier: string = 'full'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Design fields are optional so profiles created before customization keep
  // their existing template defaults. When present, accept only safe IDs.
  if (profile.design !== undefined) {
    const design = profile.design as unknown;
    if (!design || typeof design !== 'object' || Array.isArray(design)) {
      errors.push('Design settings must be an object.');
    } else {
      const choices = design as Record<string, unknown>;
      if (choices.sections !== undefined) {
        if (!Array.isArray(choices.sections) || choices.sections.length < 1 || choices.sections.length > PROFILE_SECTION_IDS.length) {
          errors.push('Design sections must contain between 1 and 4 sections.');
        } else {
          const sections = choices.sections;
          if (sections.some(section => typeof section !== 'string' || !PROFILE_SECTION_IDS.includes(section as typeof PROFILE_SECTION_IDS[number]))) {
            errors.push('Design contains an unsupported section.');
          } else if (new Set(sections).size !== sections.length) {
            errors.push('Design sections cannot be repeated.');
          }
        }
      }
      if (choices.themePreset !== undefined &&
        (typeof choices.themePreset !== 'string' || !PROFILE_THEME_PRESET_IDS.includes(choices.themePreset as typeof PROFILE_THEME_PRESET_IDS[number]))) {
        errors.push('Design contains an unsupported theme preset.');
      }
      if (choices.iconPack !== undefined &&
        (typeof choices.iconPack !== 'string' || !PROFILE_ICON_PACK_IDS.includes(choices.iconPack as typeof PROFILE_ICON_PACK_IDS[number]))) {
        errors.push('Design contains an unsupported icon pack.');
      }
    }
  }

  if (profile.background_image !== undefined && profile.background_image !== null && profile.background_image !== '') {
    if (typeof profile.background_image !== 'string') {
      errors.push('Background image must be an uploaded WebP, PNG, or JPEG profile asset.');
    } else {
      const imageRef = profile.background_image.trim();
      const allowedReference = /^(?:r2:backgrounds\/[a-z0-9_-]+\.(?:webp|png|jpg)|(?:https?:\/\/[^/]+)?\/media\/backgrounds\/[a-z0-9_-]+\.(?:webp|png|jpg))$/i;
      const allowedUpload = /^data:image\/(?:webp|png|jpeg);base64,[a-z0-9+/]+=*$/i;
      if (!allowedReference.test(imageRef) && !allowedUpload.test(imageRef)) {
        errors.push('Background image must be an uploaded WebP, PNG, or JPEG profile asset.');
      } else if (allowedUpload.test(imageRef) && imageRef.length > 700 * 1024) {
        errors.push('Background image exceeds the 500 KB upload limit.');
      }
    }
  }

  if (tier === 'direct' || tier === 'redirect') {
    if (!profile.name?.trim()) errors.push('Client name is required.');
    const links = Array.isArray(profile.links) ? profile.links : [];
    if (links.length !== 1 || !links[0]?.value?.trim()) {
      errors.push('Direct and redirect tiers require one client social or destination link.');
    } else {
      const value = links[0].value.trim();
      try {
        const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        if (!['http:', 'https:'].includes(url.protocol)) errors.push('The client link must use HTTP or HTTPS.');
      } catch {
        errors.push('The client link must be a valid URL.');
      }
    }
    if (tier === 'redirect') {
      try {
        const target = new URL(profile.redirect_url || '');
        if (!['http:', 'https:'].includes(target.protocol)) errors.push('Redirect destination must use HTTP or HTTPS.');
      } catch {
        errors.push('Redirect tier requires a valid destination URL.');
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  // 1. Redirect Tier check
  // Minimum viable profile: name AND at least one link; logo is optional.
  const hasName = Boolean(profile.name && profile.name.trim().length > 0);
  if (!hasName) errors.push('A client name is required.');

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
