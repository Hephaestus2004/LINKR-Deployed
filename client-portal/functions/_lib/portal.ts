export interface PortalEnv {
  PORTAL_DB: D1Database;
  PORTAL_UPLOADS?: R2Bucket;
  PORTAL_API_TOKEN?: string;
}

export interface PortalInvite {
  id: string;
  status: 'open' | 'submitted' | 'expired' | 'revoked';
  expires_at: string;
}

const SESSION_COOKIE = '__Host-linkr-client-session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;

export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  const result = new Headers(headers);
  result.set('Content-Type', 'application/json; charset=utf-8');
  result.set('Cache-Control', 'no-store');
  result.set('X-Content-Type-Options', 'nosniff');
  result.set('Referrer-Policy', 'no-referrer');
  result.set('X-Frame-Options', 'DENY');
  return new Response(JSON.stringify(body), { status, headers: result });
}

export async function readJson(request: Request, maxBytes = MAX_REQUEST_BYTES): Promise<Record<string, unknown>> {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) throw new Error('Request is too large.');
  if (!request.body) throw new Error('Request body is required.');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('Request is too large.');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const parsed = JSON.parse(new TextDecoder().decode(bytes));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Request must be a JSON object.');
  return parsed as Record<string, unknown>;
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function randomToken(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function setSessionCookie(value: string): string {
  return `${SESSION_COOKIE}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function getInviteFromSession(request: Request, env: PortalEnv): Promise<PortalInvite | null> {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([A-Za-z0-9_-]{40,60})(?:;|$)`));
  if (!match) return null;
  const sessionHash = await sha256(match[1]);
  return env.PORTAL_DB.prepare(`
    SELECT id, status, expires_at FROM portal_invites
    WHERE session_hash = ? AND status IN ('open', 'submitted') AND expires_at > datetime('now')
    LIMIT 1
  `).bind(sessionHash).first<PortalInvite>();
}

export function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) difference |= (a[i] || 0) ^ (b[i] || 0);
  return difference === 0;
}

export function requireInternalToken(request: Request, env: PortalEnv): boolean {
  if (!env.PORTAL_API_TOKEN) return false;
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;
  return constantTimeEqual(authorization.slice(7), env.PORTAL_API_TOKEN);
}

export async function storeRequestImage(
  env: PortalEnv,
  inviteId: string,
  field: 'photo' | 'company_logo' | 'background_image',
  value: unknown
): Promise<string | null> {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new Error(`${field} must be an image upload.`);

  const match = value.match(/^data:(image\/(?:webp|png|jpeg));base64,([a-z0-9+/]+=*)$/i);
  if (!match) throw new Error(`${field} must be a WebP, PNG, or JPEG upload.`);
  const bytes = Uint8Array.from(atob(match[2]), character => character.charCodeAt(0));
  const limit = field === 'company_logo' ? 200 * 1024 : field === 'background_image' ? 500 * 1024 : 300 * 1024;
  if (!bytes.length || bytes.length > limit) throw new Error(`${field} exceeds its ${Math.floor(limit / 1024)} KB limit.`);
  if (!env.PORTAL_UPLOADS) throw new Error('Client upload storage is not configured.');

  const mime = match[1].toLowerCase();
  const signature = [...bytes.subarray(0, 12)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const validImage = mime === 'image/png' ? signature.startsWith('89504e470d0a1a0a')
    : mime === 'image/jpeg' ? signature.startsWith('ffd8ff')
      : mime === 'image/webp' ? signature.startsWith('52494646') && signature.slice(16, 24) === '57454250'
        : false;
  if (!validImage) throw new Error(`${field} image data does not match its declared format.`);
  const ext = mime === 'image/jpeg' ? 'jpg' : mime.slice('image/'.length);
  const prefix = field === 'photo' ? 'photos' : field === 'company_logo' ? 'logos' : 'backgrounds';
  const key = `requests/${inviteId}/${prefix}/${crypto.randomUUID()}.${ext}`;
  await env.PORTAL_UPLOADS.put(key, bytes, {
    httpMetadata: { contentType: mime, cacheControl: 'private, no-store' }
  });
  return `r2:${key}`;
}

export async function deleteRequestAssets(env: PortalEnv, inviteId: string): Promise<void> {
  if (!env.PORTAL_UPLOADS) return;
  let cursor: string | undefined;
  do {
    const page = await env.PORTAL_UPLOADS.list({ prefix: `requests/${inviteId}/`, cursor });
    if (page.objects.length) await env.PORTAL_UPLOADS.delete(page.objects.map(object => object.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}
