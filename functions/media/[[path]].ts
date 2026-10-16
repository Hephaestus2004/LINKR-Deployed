import { Env } from '../_lib/types';
import { getNoCacheHeaders } from '../_lib/cache';

const KEY_PATTERN = /^(photos|logos|qr)\/[a-z0-9_-]+\.(?:webp|png|jpg)$/i;

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const path = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!KEY_PATTERN.test(path)) return new Response('Not found', { status: 404, headers: getNoCacheHeaders() });
  if (!env.R2_STORAGE) return new Response('Media storage unavailable', { status: 503, headers: getNoCacheHeaders() });

  const object = await env.R2_STORAGE.get(path);
  if (!object) return new Response('Not found', { status: 404, headers: getNoCacheHeaders() });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
};
