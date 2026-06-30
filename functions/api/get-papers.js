import { ensurePapersTable } from './papers-db.js';

export async function onRequestGet({ request, env }) {
  await ensurePapersTable(env.DB);

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim();
  const category = url.searchParams.get('category')?.trim();
  const organization = url.searchParams.get('organization')?.trim();
  const examName = url.searchParams.get('exam_name')?.trim();
  const year = url.searchParams.get('year')?.trim();

  const conditions = [];
  const binds = [];

  if (q) {
    const search = `%${q}%`;
    conditions.push(
      '(title LIKE ? OR organization LIKE ? OR exam_name LIKE ? OR description LIKE ? OR tags LIKE ?)'
    );
    binds.push(search, search, search, search, search);
  }

  if (category) {
    conditions.push('category = ?');
    binds.push(category);
  }

  if (organization) {
    conditions.push('organization LIKE ?');
    binds.push(`%${organization}%`);
  }

  if (examName) {
    conditions.push('exam_name LIKE ?');
    binds.push(`%${examName}%`);
  }

  if (year) {
    conditions.push('year = ?');
    binds.push(year);
  }

  let sql = `SELECT id, title, organization, exam_name, category, year, subject, description, tags, pdf_url, thumbnail_url, created_at FROM papers`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY created_at DESC';

  const result = await env.DB.prepare(sql).bind(...binds).all();
  return new Response(JSON.stringify(result.results), {
    headers: { 'Content-Type': 'application/json' }
  });
}
