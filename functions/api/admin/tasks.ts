import { Env } from '../../_lib/types';
import { getNoCacheHeaders } from '../../_lib/cache';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
});
const dateOnly = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const [tasks, resellers, clients] = await Promise.all([
      env.DB.prepare(`SELECT t.*, r.name AS reseller_name FROM admin_tasks t
        LEFT JOIN retailers r ON r.id = t.reseller_id ORDER BY t.completed ASC, t.deadline ASC, t.id DESC`).all(),
      env.DB.prepare('SELECT id, code, name FROM retailers WHERE active = 1 ORDER BY name COLLATE NOCASE').all(),
      env.DB.prepare(`SELECT id, COALESCE(json_extract(data, '$.name'), id) AS name
        FROM profiles WHERE status != 'deleted' AND COALESCE(json_extract(data, '$.deleted'), 0) = 0
        AND COALESCE(json_extract(data, '$.name'), '') != '' ORDER BY name COLLATE NOCASE LIMIT 500`).all(),
    ]);
    return json({ tasks: tasks.results || [], resellers: resellers.results || [], clients: clients.results || [] });
  } catch (error: any) {
    return json({ error: error.message || 'Could not load tasks.' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as {
      id?: number; category?: string; title?: string; description?: string; reseller_id?: number | null;
      client_name?: string; package?: string; client_names?: string[]; deadline?: string; completed?: boolean;
    };
    const category = String(body.category || '');
    if (!['system', 'printing', 'add_client'].includes(category)) return json({ error: 'Choose a valid task category.' }, 422);
    const description = String(body.description || '').trim().slice(0, 1000);
    const clientName = String(body.client_name || '').trim().slice(0, 120);
    const packageName = String(body.package || '').trim().slice(0, 80);
    const clientNames = Array.isArray(body.client_names) ? body.client_names.map(name => String(name).trim().slice(0, 120)).filter(Boolean).slice(0, 50) : [];
    const resellerId = Number(body.reseller_id) || null;
    let title = String(body.title || '').trim().slice(0, 160);
    if (category === 'add_client' && (!clientName || !resellerId || !packageName)) return json({ error: 'Choose a reseller, enter the client name, and add a package.' }, 422);
    if (category === 'printing' && !clientNames.length && !clientName) return json({ error: 'Choose at least one client to print.' }, 422);
    if (category === 'add_client') title = title || `Add client: ${clientName}`;
    if (category === 'printing') title = title || `Print: ${clientNames.join(', ') || clientName || 'client'}`;
    if (!title) return json({ error: 'Add a task title or client name.' }, 422);
    const deadline = /^\d{4}-\d{2}-\d{2}$/.test(body.deadline || '') ? body.deadline! : dateOnly(new Date(Date.now() + 3 * 86400000));
    const clientNamesJson = JSON.stringify(clientNames);
    if (body.id) {
      await env.DB.prepare(`UPDATE admin_tasks SET category=?, title=?, description=?, reseller_id=?, client_name=?,
        package=?, client_names=?, deadline=?, completed=?, updated_at=datetime('now') WHERE id=?`)
        .bind(category, title, description, resellerId, clientName, packageName, clientNamesJson, deadline, body.completed ? 1 : 0, body.id).run();
      return json({ success: true, id: body.id });
    }

    const created = await env.DB.prepare(`INSERT INTO admin_tasks
      (category, title, description, reseller_id, client_name, package, client_names, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(category, title, description, resellerId, clientName, packageName, clientNamesJson, deadline).run();
    const id = Number(created.meta.last_row_id);
    let printingTaskId: number | null = null;
    if (category === 'add_client' && clientName && !/^(?:package\s*)?1(?:\s*only)?$/i.test(packageName)) {
      const printing = await env.DB.prepare(`INSERT INTO admin_tasks
        (category, title, description, reseller_id, client_name, package, client_names, deadline, parent_task_id)
        VALUES ('printing', ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(`Print: ${clientName}`, description, resellerId, clientName, packageName, JSON.stringify([clientName]), deadline, id).run();
      printingTaskId = Number(printing.meta.last_row_id);
    }
    return json({ success: true, id, printing_task_id: printingTaskId }, 201);
  } catch (error: any) {
    return json({ error: error.message || 'Could not save task.' }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id < 1) return json({ error: 'A valid task ID is required.' }, 400);
  try {
    await env.DB.prepare('DELETE FROM admin_tasks WHERE id = ?').bind(id).run();
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message || 'Could not delete task.' }, 500);
  }
};
