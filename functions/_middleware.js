export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'GET' && url.pathname === '/api/get-papers') {
      return context.next();
    }
    const accessEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
    const token = request.headers.get('x-admin-token');
    const adminToken = env.ADMIN_API_TOKEN;
    if (accessEmail || (adminToken && token === adminToken)) {
      return context.next();
    }
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (url.pathname === '/admin.html') {
    const accessEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
    if (accessEmail) {
      return context.next();
    }
    return new Response('Unauthorized', { status: 401 });
  }

  return context.next();
}
