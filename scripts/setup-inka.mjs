#!/usr/bin/env node
/**
 * Dựng dữ liệu của app trên inka.vn và ghi các ID vào src/services/inkaConfig.ts.
 *
 *   node scripts/setup-inka.mjs <tài-khoản-admin> <mật-khẩu>
 *
 * Cần mạng tới được inka.vn cổng 8000–8063 (wifi văn phòng chặn; 4G được).
 * Chạy lại an toàn: bảng đã có thì dùng lại, bảng đã có dòng thì không nạp lại dữ liệu mẫu.
 *
 * Mỗi bảng của DB (users, products, inventory, ordersIn…) là một bảng cùng tên; mỗi phần tử là một dòng
 * kèm _key/_seq/_ts (xem src/store/sync.ts). Cờ quyền của inka: true = mọi tài khoản đã đăng nhập đều làm được.
 * App đọc/ghi bằng tài khoản khách nên đọc, thêm, sửa đều bật; xoá tắt (xoá dòng làm hỏng bảng trên server này).
 */
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: node scripts/setup-inka.mjs <admin-username> <admin-password>');
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_NAME = 'wms_demo';
const AUTH = { read: true, write: true, edit: true, delete: false };
const MAX_ROW_BYTES = 900; // server từ chối dòng khoảng 1 KB trở lên

/* ── dữ liệu mẫu của app (initialData.ts chỉ import kiểu, nên dịch ra JS rồi nạp trực tiếp) ── */
const js = ts.transpileModule(readFileSync(join(ROOT, 'src/data/initialData.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { INITIAL_DATA } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

const COLLECTIONS = ['users', 'partners', 'drivers', 'warehouses', 'products', 'inventory', 'ordersIn', 'ordersOut', 'transfers', 'incidents', 'damagedStock'];
const NEWEST_FIRST = ['ordersIn', 'ordersOut', 'transfers', 'incidents'];

// Giữ đúng quy tắc khoá của src/store/sync.ts
const keyOf = (collection, e) =>
  collection === 'products' ? String(e.sku) : collection === 'inventory' || collection === 'damagedStock' ? `${e.warehouseId}|${e.sku}` : String(e.id);

function seedRows(collection) {
  const list = INITIAL_DATA[collection];
  const now = Date.now();
  return list.map((entity, i) => ({
    ...entity,
    _key: keyOf(collection, entity),
    _seq: NEWEST_FIRST.includes(collection) ? list.length - i : i + 1,
    _ts: now,
  }));
}

const columnType = (v) => (typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : v !== null && typeof v === 'object' ? 'json' : 'string');
function schemaFor(rows) {
  const schema = {};
  for (const row of rows) for (const [k, v] of Object.entries(row)) if (!k.startsWith('_') && !(k in schema)) schema[k] = { type: columnType(v) };
  return { ...schema, _key: { type: 'string' }, _seq: { type: 'number' }, _ts: { type: 'timestamp' }, _rec: { type: 'id' }, _del: { type: 'boolean' } };
}

/* ── client nhỏ, cùng quy tắc URL với src/services/inka.ts ── */
const port = (root = '') => {
  try {
    return 8000 + Number(BigInt('0x' + (root || '0')) & 0x3fn);
  } catch {
    return 8000;
  }
};

const admin = { cookie: '' };
async function req(method, path, root, body) {
  const res = await fetch(`http://inka.vn:${port(root)}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(admin.cookie && { Cookie: admin.cookie }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const m = c.match(/^auth_token=([^;]*)/);
    if (m) admin.cookie = `auth_token=${m[1]}`;
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: 'bad_response', error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  }
}
const api = (method, ctrl, root, { query = '', body } = {}) => req(method, `/${ctrl}/${root}${query}`, root, body);

const ok = (r) => r?.status === 'ok';
const list = (r) => (ok(r) && Array.isArray(r.data) ? r.data : []);
const isSchema = (content) => {
  const values = Object.values(content ?? {});
  return values.length > 0 && values.every((v) => v !== null && typeof v === 'object' && typeof v.type === 'string');
};
const fail = (what, r) => {
  console.error(`✗ ${what}:`, r?.error ?? JSON.stringify(r));
  process.exit(1);
};

/* ── 1. admin + database ── */
console.log('1. Đăng nhập admin…');
let login = await req('POST', '/sign-in/', '', { username, password });
if (!login.success && login.error === 'user_not_found') {
  console.log(`  tài khoản ${username} chưa có → đăng ký mới`);
  login = await req('POST', '/sign-up/', '', { username, password });
}
if (!login.success || !login.userId) fail(`đăng nhập ${username}`, login);
const adminId = login.userId;

let db = list(await api('GET', 'database', adminId, { query: '?limit=255' })).find((d) => d.db_name === DB_NAME);
if (!db) {
  const r = await api('POST', 'database', adminId, { body: DB_NAME });
  if (!ok(r) || !r.data?.db_id) fail('tạo database', r);
  db = { db_id: r.data.db_id };
}
const dbId = db.db_id;
console.log(`  database "${DB_NAME}" ${dbId}`);

/* ── 2. bảng: tạo, cột, quyền, dữ liệu mẫu ── */
console.log('2. Bảng…');
const existing = list(await api('GET', 'table', dbId, { query: '?limit=255' }));
const ids = {};
for (const name of COLLECTIONS) {
  const rows = seedRows(name);
  for (const row of rows) {
    const bytes = Buffer.byteLength(JSON.stringify(row));
    if (bytes > MAX_ROW_BYTES) fail(`dòng mẫu quá lớn ở ${name} (${row._key}, ${bytes} byte)`, { error: 'row_too_large' });
  }

  let tblId = existing.find((t) => t.tbl_name === name)?.tbl_id;
  const created = !tblId;
  if (!tblId) {
    const r = await api('POST', 'table', dbId, { body: name });
    if (!ok(r) || !r.data?.tbl_id) fail(`tạo bảng ${name}`, r);
    tblId = r.data.tbl_id;
  }
  ids[name] = tblId;

  // Lỗi server: sau một số lần xoá, dòng dữ liệu nằm ở chỗ dòng schema; lưu schema sẽ đè lên nó → ghi lại dòng đó sau.
  const current = list(await api('GET', 'record', tblId, { query: '?limit=255' }));
  const displaced = current[0] && !isSchema(current[0].content) ? current[0].content : null;
  const meta = await api('PUT', 'metadata', tblId, { body: schemaFor(rows) });
  if (!ok(meta)) fail(`lưu cột ${name}`, meta);
  if (displaced) {
    const r = await api('POST', 'record', tblId, { body: displaced });
    if (!ok(r)) fail(`khôi phục dòng bị đè ở ${name}`, r);
  }

  const auth = await api('PUT', 'table', tblId, {
    body: { auth_read: AUTH.read, auth_write: AUTH.write, auth_edit: AUTH.edit, auth_delete: AUTH.delete, auth_owner: false },
  });
  if (!ok(auth)) fail(`đặt quyền ${name}`, auth);

  const dataRows = current.filter((r) => !isSchema(r.content)).length;
  let seeded = `đã có ${dataRows} dòng`;
  if (dataRows === 0) {
    for (const row of rows) {
      const r = await api('POST', 'record', tblId, { body: row });
      if (!ok(r)) fail(`thêm dòng vào ${name}`, r);
    }
    seeded = `thêm ${rows.length} dòng`;
  }
  console.log(`  ${created ? '+' : '='} ${name.padEnd(13)} ${tblId}, ${seeded}${displaced ? ', đã sửa lại dòng schema' : ''}`);
}

/* ── 3. ghi cấu hình ── */
const configPath = join(ROOT, 'src/services/inkaConfig.ts');
const tableLines = COLLECTIONS.map((n) => `    ${n}: '${ids[n]}',`).join('\n');
writeFileSync(
  configPath,
  readFileSync(configPath, 'utf8')
    .replace(/dbId: '[^']*'/, `dbId: '${dbId}'`)
    .replace(/tables: \{[^}]*\}/, `tables: {\n${tableLines}\n  }`),
);
console.log('3. Đã ghi ID vào src/services/inkaConfig.ts');

/* ── 4. đọc lại quyền (không ghi dòng thử vào bảng thật) ── */
const saved = list(await api('GET', 'table', dbId, { query: '?limit=255' }));
const problems = [];
for (const name of COLLECTIONS) {
  const t = saved.find((x) => x.tbl_id === ids[name]);
  for (const flag of ['read', 'write', 'edit', 'delete']) {
    if (!t || t[`auth_${flag}`] !== AUTH[flag]) problems.push(`${name}: auth_${flag} = ${t?.[`auth_${flag}`]}, mong đợi ${AUTH[flag]}`);
  }
}
console.log('');
if (problems.length === 0) console.log('✓ Xong. Quyền của từng bảng đúng như thiết kế.');
else {
  console.log('⚠ Đã tạo dữ liệu nhưng quyền chưa đúng:');
  for (const p of problems) console.log(`  - ${p}`);
}
