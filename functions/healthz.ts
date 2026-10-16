// functions/healthz.ts
// Uptime check endpoint for monitoring

import { Env } from './_lib/types';
import { getNoCacheHeaders } from './_lib/cache';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const start = Date.now();

  let dbOk = false;
  try {
    const res = await env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();
    dbOk = res?.ok === 1;
  } catch (err) {
    dbOk = false;
  }

  const durationMs = Date.now() - start;

  return new Response(JSON.stringify({
    status: dbOk ? 'healthy' : 'degraded',
    database: dbOk ? 'connected' : 'error',
    latency_ms: durationMs,
    timestamp: new Date().toISOString()
  }), {
    status: dbOk ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      ...getNoCacheHeaders()
    }
  });
};
