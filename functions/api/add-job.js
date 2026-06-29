export async function onRequestPost({ request, env }) {
  const body = await request.json();

  await env.DB.prepare(
    "INSERT INTO jobs (title, location) VALUES (?, ?)"
  )
    .bind(body.title, body.location)
    .run();

  return Response.json({ success: true });
}
