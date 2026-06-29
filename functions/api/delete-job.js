export async function onRequestPost({ request, env }) {
  const body = await request.json();

  await env.DB
    .prepare("DELETE FROM jobs WHERE id = ?")
    .bind(body.id)
    .run();

  return Response.json({ success: true });
}
