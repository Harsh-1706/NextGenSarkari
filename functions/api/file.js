export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ success: false, error: 'Missing file key.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!env.R2_PAPERS) {
    return new Response(JSON.stringify({ success: false, error: 'R2 not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const object = await env.R2_PAPERS.get(key);
  if (!object) {
    return new Response(JSON.stringify({ success: false, error: 'File not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=604800'
    }
  });
}
