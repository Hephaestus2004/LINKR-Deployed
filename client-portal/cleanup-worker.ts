interface CleanupEnv {
  PORTAL_DB: D1Database;
  PORTAL_UPLOADS: R2Bucket;
}

/** Remove expired invitation data and uploads while preserving published snapshots. */
export default {
  async scheduled(_event: ScheduledEvent, env: CleanupEnv, _context: ExecutionContext): Promise<void> {
    const expired = await env.PORTAL_DB.prepare(`
      SELECT i.id, r.req_uid, r.status
      FROM portal_invites i
      LEFT JOIN portal_requests r ON r.invite_id = i.id
      WHERE i.expires_at <= datetime('now')
        AND (r.status IS NULL OR r.status IN ('pending', 'rejected', 'expired'))
    `).all<{ id: string; req_uid: string | null; status: string | null }>();

    const inviteIds = [...new Set(expired.results.map(row => row.id))];
    for (const inviteId of inviteIds) {
      let cursor: string | undefined;
      do {
        const page = await env.PORTAL_UPLOADS.list({ prefix: `requests/${inviteId}/`, cursor });
        if (page.objects.length) await env.PORTAL_UPLOADS.delete(page.objects.map(object => object.key));
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);
    }

    await env.PORTAL_DB.batch([
      env.PORTAL_DB.prepare(`
        UPDATE portal_requests SET status = 'expired', data = '{}', updated_at = datetime('now')
        WHERE expires_at <= datetime('now') AND status IN ('pending', 'rejected')
      `),
      env.PORTAL_DB.prepare(`
        UPDATE portal_invites SET status = 'expired', session_hash = NULL
        WHERE expires_at <= datetime('now') AND status IN ('open', 'submitted', 'revoked')
      `)
    ]);
  }
};
