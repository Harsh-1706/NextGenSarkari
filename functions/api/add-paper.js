import {
  CATEGORY_OPTIONS,
  ensurePapersTable,
  isAdminRequest,
  adminUnauthorized,
  normalizeTags,
  uploadFile,
  buildObjectUrl
} from './papers-db.js';

export async function onRequestPost({ request, env }) {
  if (!isAdminRequest(request, env)) {
    return adminUnauthorized();
  }

  await ensurePapersTable(env.DB);
  const form = await request.formData();

  const title = form.get('title')?.toString().trim() || '';
  const organization = form.get('organization')?.toString().trim() || '';
  const examName = form.get('exam_name')?.toString().trim() || '';
  const category = form.get('category')?.toString().trim() || '';
  const year = parseInt(form.get('year')?.toString().trim() || '', 10);
  const subject = form.get('subject')?.toString().trim() || '';
  const description = form.get('description')?.toString().trim() || '';
  const tags = normalizeTags(form.get('tags')?.toString());
  const pdfFile = form.get('pdf');
  const thumbnailFile = form.get('thumbnail');

  if (!title || !organization || !examName || !category || !year || !pdfFile) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!CATEGORY_OPTIONS.includes(category)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid category.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!(pdfFile instanceof File) || !pdfFile.type.includes('pdf')) {
    return new Response(JSON.stringify({ success: false, error: 'Please upload a valid PDF file.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const pdfKey = await uploadFile(env, pdfFile, 'papers');
    const pdfUrl = buildObjectUrl(request, pdfKey);

    let thumbnailKey = null;
    let thumbnailUrl = '';
    if (thumbnailFile && thumbnailFile.size > 0) {
      thumbnailKey = await uploadFile(env, thumbnailFile, 'thumbnails');
      thumbnailUrl = buildObjectUrl(request, thumbnailKey);
    }

    const createdAt = new Date().toISOString();
    const result = await env.DB
      .prepare(
        `INSERT INTO papers (title, organization, exam_name, category, year, subject, description, tags, pdf_url, thumbnail_url, pdf_key, thumbnail_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(title, organization, examName, category, year, subject, description, tags, pdfUrl, thumbnailUrl, pdfKey, thumbnailKey, createdAt)
      .run();

    return new Response(JSON.stringify({ success: true, id: result.lastInsertRowid }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Upload failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
