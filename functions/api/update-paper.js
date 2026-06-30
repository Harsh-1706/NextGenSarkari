import {
  CATEGORY_OPTIONS,
  ensurePapersTable,
  isAdminRequest,
  adminUnauthorized,
  normalizeTags,
  uploadFile,
  buildObjectUrl,
  deleteObject
} from './papers-db.js';

async function handleUpdatePaper({ request, env }) {
  if (!isAdminRequest(request, env)) {
    return adminUnauthorized();
  }

  await ensurePapersTable(env.DB);
  const form = await request.formData();
  const id = parseInt(form.get('id')?.toString().trim() || '', 10);
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

  if (!id || !title || !organization || !examName || !category || !year) {
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

  const existing = await env.DB
    .prepare('SELECT pdf_key, thumbnail_key, pdf_url, thumbnail_url FROM papers WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return new Response(JSON.stringify({ success: false, error: 'Paper not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let pdfKey = existing.pdf_key;
  let pdfUrl = existing.pdf_url || '';
  let thumbnailKey = existing.thumbnail_key;
  let thumbnailUrl = existing.thumbnail_url || '';

  try {
    if (pdfFile && pdfFile.size > 0) {
      if (!(pdfFile instanceof File) || !pdfFile.type.includes('pdf')) {
        return new Response(JSON.stringify({ success: false, error: 'Please upload a valid PDF file.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const newPdfKey = await uploadFile(env, pdfFile, 'papers');
      const newPdfUrl = buildObjectUrl(request, newPdfKey);
      await deleteObject(env, existing.pdf_key);
      pdfKey = newPdfKey;
      pdfUrl = newPdfUrl;
    }

    if (thumbnailFile && thumbnailFile.size > 0) {
      const newThumbnailKey = await uploadFile(env, thumbnailFile, 'thumbnails');
      const newThumbnailUrl = buildObjectUrl(request, newThumbnailKey);
      if (existing.thumbnail_key) {
        await deleteObject(env, existing.thumbnail_key);
      }
      thumbnailKey = newThumbnailKey;
      thumbnailUrl = newThumbnailUrl;
    }

    const result = await env.DB
      .prepare(
        `UPDATE papers SET title = ?, organization = ?, exam_name = ?, category = ?, year = ?, subject = ?, description = ?, tags = ?, pdf_url = ?, thumbnail_url = ?, pdf_key = ?, thumbnail_key = ? WHERE id = ?`
      )
      .bind(title, organization, examName, category, year, subject, description, tags, pdfUrl, thumbnailUrl, pdfKey, thumbnailKey, id)
      .run();

    return new Response(JSON.stringify({ success: true, changes: result.changes }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Update failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut(args) {
  return await handleUpdatePaper(args);
}

export async function onRequestPost(args) {
  return await handleUpdatePaper(args);
}
