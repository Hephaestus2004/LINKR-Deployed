// functions/api/admin/batches.ts
// Pre-generated ID stock batch generation and export

import { Env } from '../../_lib/types';
import { generateRandomId } from '../../_lib/ids';
import { getNoCacheHeaders } from '../../_lib/cache';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const batches = await env.DB
      .prepare('SELECT * FROM batches ORDER BY id DESC LIMIT 50')
      .all();

    return new Response(JSON.stringify({ batches: batches.results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as {
      label: string;
      size: number;
      tier?: string;
    };

    const size = Math.min(Math.max(Number(body.size) || 50, 1), 500);
    const label = body.label || `Batch-${new Date().toISOString().slice(0, 10)}`;
    const tier = body.tier || 'full';

    // 1. Create batch record
    const batchRes = await env.DB.prepare(`
      INSERT INTO batches (label, size) VALUES (?, ?)
    `).bind(label, size).run();

    const batchId = batchRes.meta.last_row_id;

    // 2. Query starting sequence number
    const maxSeq = await env.DB
      .prepare('SELECT COALESCE(MAX(seq), 0) as max_seq FROM profiles')
      .first<{ max_seq: number }>();
    let currentSeq = (maxSeq?.max_seq || 0);

    // 3. Generate IDs and insert
    const generated: Array<{ id: string; url: string; seq: number }> = [];
    const statements: D1PreparedStatement[] = [];

    for (let i = 0; i < size; i++) {
      currentSeq++;
      const id = generateRandomId();
      generated.push({
        id,
        seq: currentSeq,
        url: `https://linkr-tap.site/u/${id}`
      });

      statements.push(
        env.DB.prepare(`
          INSERT INTO profiles (id, seq, status, tier, batch_id, data)
          VALUES (?, ?, 'unassigned', ?, ?, '{}')
        `).bind(id, currentSeq, tier, batchId)
      );
    }

    // Execute in batch transactions
    await env.DB.batch(statements);

    return new Response(JSON.stringify({
      success: true,
      batch_id: batchId,
      label,
      size,
      items: generated
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error generating batch' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }
};
