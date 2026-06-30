export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const { title, department, state, last_date, description, apply_link, slug } = body;

  if (!title || !department || !state || !last_date || !description || !apply_link || !slug) {
    return new Response(JSON.stringify({ success: false, error: "Missing required fields." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const result = await env.DB
    .prepare(
      `INSERT INTO jobs (title, department, state, last_date, description, apply_link, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(title, department, state, last_date, description, apply_link, slug)
    .run();

  return new Response(JSON.stringify({ success: true, id: result.lastInsertRowid ?? null }), {
    headers: { "Content-Type": "application/json" }
  });
}
