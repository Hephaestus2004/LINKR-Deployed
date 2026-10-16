interface BackupEnv {
  DB: D1Database;
  BACKUPS: R2Bucket;
}

const TABLES = [
  ['retailers', 'id'],
  ['orders', 'id'],
  ['batches', 'id'],
  ['profiles', 'id'],
  ['profile_versions', 'id'],
  ['edit_requests', 'id'],
  ['slugs', 'slug'],
  ['scan_daily', 'profile_id, day']
] as const;

const RETENTION_DAYS = 90;

export default {
  async scheduled(_event: ScheduledController, env: BackupEnv, context: ExecutionContext): Promise<void> {
    context.waitUntil(createBackup(env));
  }
} satisfies ExportedHandler<BackupEnv>;

async function createBackup(env: BackupEnv): Promise<void> {
  const createdAt = new Date();
  const statements = TABLES.map(([table, orderBy]) =>
    env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`)
  );
  const results = await env.DB.batch(statements);
  const tables: Record<string, unknown[]> = {};
  TABLES.forEach(([table], index) => { tables[table] = results[index].results || []; });

  const snapshot = JSON.stringify({
    format: 'linkr-d1-backup-v1',
    created_at: createdAt.toISOString(),
    tables
  });
  const datePath = createdAt.toISOString().slice(0, 10).replaceAll('-', '/');
  const timestamp = createdAt.toISOString().replace(/[:.]/g, '-');
  const key = `backups/d1/${datePath}/${timestamp}.json.gz`;
  const compressed = new Response(snapshot).body!.pipeThrough(new CompressionStream('gzip'));

  await env.BACKUPS.put(key, compressed, {
    httpMetadata: { contentType: 'application/gzip', cacheControl: 'private, no-store' },
    customMetadata: {
      format: 'linkr-d1-backup-v1',
      createdAt: createdAt.toISOString(),
      tables: String(TABLES.length)
    }
  });

  await pruneOldBackups(env, createdAt.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  console.log(`Created D1 backup ${key}`);
}

async function pruneOldBackups(env: BackupEnv, cutoff: number): Promise<void> {
  let cursor: string | undefined;
  do {
    const page = await env.BACKUPS.list({ prefix: 'backups/d1/', cursor, limit: 1000 });
    const expired = page.objects
      .filter(object => object.uploaded && object.uploaded.getTime() < cutoff)
      .map(object => object.key);
    if (expired.length) await env.BACKUPS.delete(expired);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}
