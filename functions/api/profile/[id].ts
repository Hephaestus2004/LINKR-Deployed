// functions/api/profile/[id].ts
// Edge-cached JSON endpoint for profile data

import { Env, ProfileRecord, ProfileData } from '../../_lib/types';
import { normalizeId, isValidId } from '../../_lib/ids';
import { getProfileCacheHeaders, getNoCacheHeaders } from '../../_lib/cache';
import { resolveProfileMedia } from '../../_lib/r2';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context;
  const rawId = params.id as string;
  const id = normalizeId(rawId);

  if (!isValidId(id)) {
    return new Response(JSON.stringify({ error: 'Invalid profile ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }

  try {
    const record = await env.DB
      .prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProfileRecord>();

    if (!record) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    if (record.status !== 'active') {
      return new Response(JSON.stringify({
        id: record.id,
        status: record.status,
        message: `Profile is ${record.status}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    const storedData: ProfileData = typeof record.data === 'string'
      ? JSON.parse(record.data)
      : record.data;
    const data = resolveProfileMedia(storedData, new URL(request.url).origin);

    return new Response(JSON.stringify({
      ...data,
      id: record.id,
      status: record.status,
      tier: record.tier,
      template: record.template || data.template || 'clean-white'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...getProfileCacheHeaders(300)
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }
};
