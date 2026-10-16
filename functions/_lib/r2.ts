import { Env, ProfileData } from './types';

const IMAGE_TYPES: Record<string, { extension: string; maxBytes: number }> = {
  'image/webp': { extension: 'webp', maxBytes: 300 * 1024 },
  'image/png': { extension: 'png', maxBytes: 300 * 1024 },
  'image/jpeg': { extension: 'jpg', maxBytes: 300 * 1024 }
};

export async function storeProfileImages(env: Env, id: string, source: ProfileData): Promise<ProfileData> {
  const profile = { ...source };
  const targets = [
    { field: 'photo' as const, prefix: 'photos', limit: 300 * 1024 },
    { field: 'company_logo' as const, prefix: 'logos', limit: 200 * 1024 },
    { field: 'qr_code' as const, prefix: 'qr', limit: 500 * 1024 }
  ];

  for (const { field, prefix, limit } of targets) {
    const value = profile[field];
    if (!value) continue;

    // Accept documented references and URLs returned by the media endpoint.
    const existingKey = value.match(/^(?:r2:|(?:https?:\/\/[^/]+)?\/media\/)(photos|logos|qr)\/([a-z0-9_-]+\.(?:webp|png|jpg))$/i);
    if (existingKey) {
      profile[field] = `r2:${existingKey[1]}/${existingKey[2]}`;
      continue;
    }
    if (!value.startsWith('data:')) continue;

    if (!env.R2_STORAGE) throw new Error('R2 is not configured. Set up the linkr-assets bucket and R2_STORAGE binding.');
    const match = value.match(/^data:(image\/(?:webp|png|jpeg));base64,([a-z0-9+/]+=*)$/i);
    if (!match) throw new Error(`${field} must be a base64 encoded WebP, PNG, or JPEG image.`);
    const mimeType = match[1].toLowerCase();
    const spec = IMAGE_TYPES[mimeType];
    const binary = atob(match[2]);
    if (binary.length > Math.min(limit, spec.maxBytes)) throw new Error(`${field} exceeds its ${Math.floor(limit / 1024)} KB limit.`);

    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const key = `${prefix}/${id}-${crypto.randomUUID()}.${spec.extension}`;
    await env.R2_STORAGE.put(key, bytes, { httpMetadata: { contentType: mimeType, cacheControl: 'public, max-age=31536000, immutable' } });
    profile[field] = `r2:${key}`;
  }

  return profile;
}

export function resolveProfileMedia(profile: ProfileData, origin: string): ProfileData {
  const resolved = { ...profile };
  for (const field of ['photo', 'company_logo', 'qr_code'] as const) {
    const value = resolved[field];
    if (value?.startsWith('r2:')) {
      resolved[field] = `${origin}/media/${value.slice(3)}`;
    }
  }
  return resolved;
}
