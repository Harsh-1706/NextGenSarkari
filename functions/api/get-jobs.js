export async function onRequestGet({ env }) {
  const result = await env.DB
    .prepare("SELECT * FROM jobs ORDER BY id DESC")
    .all();

  return Response.json(result.results);
}
