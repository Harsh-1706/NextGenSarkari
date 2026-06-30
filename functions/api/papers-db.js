export const CATEGORY_OPTIONS = [
  "PSSSB",
  "PPSC",
  "Punjab Police",
  "PSPCL",
  "District Courts",
  "High Court",
  "Universities",
  "Other Exams"
];

export function isAdminRequest(request, env) {
  const accessEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
  const token = request.headers.get("x-admin-token");
  const adminToken = env.ADMIN_API_TOKEN;
  return Boolean(accessEmail || (adminToken && token === adminToken));
}

export function adminUnauthorized() {
  return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}

export async function ensurePapersTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      organization TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      category TEXT NOT NULL,
      year INTEGER NOT NULL,
      subject TEXT,
      description TEXT,
      tags TEXT,
      pdf_url TEXT NOT NULL,
      thumbnail_url TEXT,
      pdf_key TEXT NOT NULL,
      thumbnail_key TEXT,
      created_at TEXT NOT NULL
    )
  `).run();
}

export function normalizeTags(value) {
  if (!value) return "";
  return value
    .split(/[,;]+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .join(",");
}

export function createObjectKey(folder, filename) {
  const safeName = (filename || "file").toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

export function buildObjectUrl(request, key) {
  const origin = new URL(request.url).origin;
  return `${origin}/api/file?key=${encodeURIComponent(key)}`;
}

export async function uploadFile(env, file, folder) {
  if (!env.R2_PAPERS) {
    throw new Error("R2_PAPERS binding is not configured.");
  }

  if (!file || typeof file.size !== "number" || file.size === 0) {
    throw new Error("No file uploaded.");
  }

  const key = createObjectKey(folder, file.name || "file.bin");
  const contentType = file.type || "application/octet-stream";
  const body = file.stream ? file.stream() : await file.arrayBuffer();

  await env.R2_PAPERS.put(key, body, {
    httpMetadata: { contentType }
  });

  return key;
}

export async function deleteObject(env, key) {
  if (!env.R2_PAPERS || !key) return;
  await env.R2_PAPERS.delete(key);
}
