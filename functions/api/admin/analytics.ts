import { Env } from '../../_lib/types';
import { getNoCacheHeaders } from '../../_lib/cache';

type CountRow = { label: string; count: number };
type ScanDay = { day: string; scans: number };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get('days') || 30);
  const days = [7, 30, 90, 365].includes(requestedDays) ? requestedDays : 30;
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - days + 1);
  const previousEnd = new Date(startDate);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - days + 1);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const start = iso(startDate);
  const end = iso(endDate);
  const prevStart = iso(previousStart);
  const prevEnd = iso(previousEnd);

  try {
    const [totals, scansByDay, previousScans, todayScans, topProfiles, statuses, tiers, templates, edits, batches, profilesByDay] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS total_profiles,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_profiles,
        SUM(CASE WHEN status = 'unassigned' THEN 1 ELSE 0 END) AS unassigned_profiles
        FROM profiles WHERE status != 'deleted' AND COALESCE(json_extract(data, '$.deleted'), 0) = 0`).first<{
          total_profiles: number; active_profiles: number; unassigned_profiles: number;
        }>(),
      env.DB.prepare('SELECT day, SUM(count) AS scans FROM scan_daily WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day').bind(start, end).all<ScanDay>(),
      env.DB.prepare('SELECT COALESCE(SUM(count), 0) AS scans FROM scan_daily WHERE day BETWEEN ? AND ?').bind(prevStart, prevEnd).first<{ scans: number }>(),
      env.DB.prepare('SELECT COALESCE(SUM(count), 0) AS scans FROM scan_daily WHERE day = ?').bind(end).first<{ scans: number }>(),
      env.DB.prepare(`SELECT p.id, COALESCE(json_extract(p.data, '$.name'), '') AS name, p.status, SUM(s.count) AS scans
        FROM scan_daily s JOIN profiles p ON p.id = s.profile_id
        WHERE s.day BETWEEN ? AND ? AND p.status != 'deleted' AND COALESCE(json_extract(p.data, '$.deleted'), 0) = 0
        GROUP BY p.id ORDER BY scans DESC, p.id LIMIT 10`).bind(start, end).all(),
      env.DB.prepare(`SELECT status AS label, COUNT(*) AS count FROM profiles
        WHERE status != 'deleted' AND COALESCE(json_extract(data, '$.deleted'), 0) = 0 GROUP BY status ORDER BY count DESC`).all<CountRow>(),
      env.DB.prepare(`SELECT COALESCE(tier, 'unspecified') AS label, COUNT(*) AS count FROM profiles
        WHERE status != 'deleted' AND COALESCE(json_extract(data, '$.deleted'), 0) = 0 GROUP BY tier ORDER BY count DESC`).all<CountRow>(),
      env.DB.prepare(`SELECT COALESCE(template, 'unspecified') AS label, COUNT(*) AS count FROM profiles
        WHERE status != 'deleted' AND COALESCE(json_extract(data, '$.deleted'), 0) = 0 GROUP BY template ORDER BY count DESC`).all<CountRow>(),
      env.DB.prepare(`SELECT status AS label, COUNT(*) AS count FROM edit_requests GROUP BY status`).all<CountRow>(),
      env.DB.prepare(`SELECT b.id, b.label, b.size, b.created_at, b.printed_at, b.encoded_at,
        SUM(CASE WHEN p.status = 'unassigned' THEN 1 ELSE 0 END) AS remaining
        FROM batches b LEFT JOIN profiles p ON p.batch_id = b.id
        GROUP BY b.id ORDER BY b.created_at DESC LIMIT 8`).all(),
      env.DB.prepare(`SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count FROM profiles
        WHERE created_at >= ? AND created_at < date(?, '+1 day') AND status != 'deleted'
        GROUP BY substr(created_at, 1, 10) ORDER BY day`).bind(start, end).all<{ day: string; count: number }>()
    ]);

    const scanTotal = (scansByDay.results || []).reduce((total, row) => total + Number(row.scans || 0), 0);
    const openEdits = (edits.results || []).find(row => row.label === 'open')?.count || 0;
    const stockCards = Number(totals?.unassigned_profiles || 0);
    return jsonResponse({
      range: { days, start, end, previous_start: prevStart, previous_end: prevEnd },
      overview: {
        total_profiles: Number(totals?.total_profiles || 0),
        active_profiles: Number(totals?.active_profiles || 0),
        unassigned_profiles: stockCards,
        scans: scanTotal,
        previous_scans: Number(previousScans?.scans || 0),
        scans_today: Number(todayScans?.scans || 0),
        open_edit_requests: Number(openEdits),
        stock_cards: stockCards
      },
      scans_by_day: scansByDay.results || [],
      top_profiles: topProfiles.results || [],
      status_breakdown: statuses.results || [],
      tier_breakdown: tiers.results || [],
      template_breakdown: templates.results || [],
      edit_requests: edits.results || [],
      recent_batches: batches.results || [],
      profiles_by_day: profilesByDay.results || []
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Could not load analytics.' }, 500);
  }
};
