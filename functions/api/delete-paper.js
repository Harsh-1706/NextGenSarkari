import { isAdminRequest, adminUnauthorized, deleteObject } from './papers-db.js';

export async function onRequestPost({ request, env }) {
  if (!isAdminRequest(request, env)) {
    return adminUnauthorized();
  }

  const body = await request.json();
  const id = Number(body.id);
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Paper ID is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const paper = await env.DB
    .prepare('SELECT pdf_key, thumbnail_key FROM papers WHERE id = ?')
    .bind(id)
    .first();

  if (!paper) {
    return new Response(JSON.stringify({ success: false, error: 'Paper not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare('DELETE FROM papers WHERE id = ?').bind(id).run();
  await deleteObject(env, paper.pdf_key);
  await deleteObject(env, paper.thumbnail_key);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
