/**
 * Client tối giản cho API inka.vn.
 *
 * URL: http://inka.vn:{8000 + (hex(root) & 0x3F)}/api/{ctrl}/{root}{query} – cổng chọn theo id gốc.
 * Phiên đăng nhập là cookie `auth_token` (http.ts lo việc giữ cookie).
 *
 * Người dùng WMS là tài khoản inka: tên đăng nhập "admin" trong app ứng với tài khoản inka
 * "wmsu_admin" (tên tài khoản inka dùng chung cho mọi app nên phải có tiền tố). Mật khẩu do inka giữ;
 * vai trò và kho phụ trách nằm trong bảng `users`. Trước khi đăng nhập app đọc dữ liệu bằng phiên khách.
 */
import { clearCookies, httpRequest } from '@/services/http';

const HOST = 'http://inka.vn';
const BASE_PORT = 8000;
const TIMEOUT_MS = 8000;
// Đăng nhập / đăng ký mất ~6 giây phía server
const AUTH_TIMEOUT_MS = 20000;

export const ACCOUNT_PREFIX = 'wmsu_';

/** Mã lỗi server trả về (forbidden, data_too_large…) hoặc lỗi mạng. */
export class InkaError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

const base = (root = '') => {
  try {
    return `${HOST}:${BASE_PORT + Number(BigInt('0x' + (root || '0')) & BigInt(0x3f))}/api`;
  } catch {
    return `${HOST}:${BASE_PORT}/api`;
  }
};

async function send(url: string, method: string, body?: unknown, timeoutMs = TIMEOUT_MS): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await httpRequest(url, {
      method,
      timeoutMs,
      signal: controller.signal,
      ...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    });
    try {
      return JSON.parse(res.text);
    } catch {
      throw new InkaError(`HTTP ${res.status}`);
    }
  } catch (e) {
    if (e instanceof InkaError) throw e;
    throw new InkaError(controller.signal.aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
}

/** Tạo phiên khách. Nhanh (~0.1s) và không cần mật khẩu. */
async function guestSignIn(): Promise<void> {
  const r = await send(`${base()}/try-now/`, 'POST');
  if (!r?.success) throw new InkaError(r?.error || 'sign_in_failed');
}

async function account(kind: 'sign-in' | 'sign-up', username: string, password: string): Promise<void> {
  // Cookie cũ khiến server coi đây là thao tác trên phiên cũ
  await clearCookies();
  const r = await send(`${base()}/${kind}/`, 'POST', { username: ACCOUNT_PREFIX + username, password }, AUTH_TIMEOUT_MS);
  if (!r?.success) throw new InkaError(r?.error || `${kind}_failed`);
}

/** Đăng nhập tài khoản inka của người dùng WMS. Ném InkaError('wrong_password' | 'user_not_found' | …). */
export const signIn = (username: string, password: string) => account('sign-in', username, password);

/**
 * Tạo tài khoản inka cho người dùng WMS mới. Sau lệnh này cookie là phiên của tài khoản vừa tạo;
 * không sao vì mọi phiên đều đọc/ghi được các bảng, còn "ai đang dùng app" do app tự giữ.
 */
export const signUp = (username: string, password: string) => account('sign-up', username, password);

export async function signOut(): Promise<void> {
  try {
    await send(`${base()}/logout/`, 'POST');
  } catch {
    // Mất mạng: vẫn bỏ phiên trên máy
  }
  // Server xoá cookie bằng thuộc tính Secure trên http nên máy bỏ qua; tự xoá
  await clearCookies();
}

// Server trả các mã này khi chưa có / hết phiên
const NO_SESSION = ['user_not_found', 'unauthorized', 'invalid_token', 'token_expired'];
let signingIn: Promise<void> | null = null;

async function call<T>(method: string, ctrl: string, root: string, opts: { query?: string; body?: unknown } = {}, retried = false): Promise<T> {
  const r = await send(`${base(root)}/${ctrl}/${root}${opts.query ?? ''}`, method, opts.body);
  if (r?.status === 'ok') return r.data as T;
  const code: string = r?.error || 'api_error';
  if (!retried && NO_SESSION.includes(code)) {
    signingIn ??= guestSignIn().finally(() => { signingIn = null; });
    await signingIn;
    return call<T>(method, ctrl, root, opts, true);
  }
  throw new InkaError(code);
}

export interface Row {
  rc_id: string;
  content: Record<string, unknown>;
}

/** Dòng schema: mọi giá trị là cấu hình cột dạng { type: 'string' }. Không tin vào vị trí đầu danh sách. */
const isSchema = (content: Record<string, unknown>) => {
  const values = Object.values(content);
  return values.length > 0 && values.every((v) => v !== null && typeof v === 'object' && typeof (v as { type?: unknown }).type === 'string');
};

/** Tối đa 255 dòng mới nhất (giới hạn của server, không có phân trang). */
export async function listRows(tableId: string): Promise<Row[]> {
  let data: unknown;
  try {
    data = await call<unknown>('GET', 'record', tableId, { query: '?limit=255' });
  } catch (e) {
    if (e instanceof InkaError && (e.code === 'not_record' || e.code === 'null_handle')) return [];
    throw e;
  }
  const rows: Row[] = [];
  for (const item of Array.isArray(data) ? data : []) {
    const r = item as { rc_id?: unknown; content?: unknown } | null;
    if (!r?.rc_id || !r.content || typeof r.content !== 'object') continue;
    const content = r.content as Record<string, unknown>;
    if (!isSchema(content)) rows.push({ rc_id: String(r.rc_id), content });
  }
  return rows;
}

export async function createRow(tableId: string, content: Record<string, unknown>): Promise<string> {
  const data = await call<{ rc_id?: string }>('POST', 'record', tableId, { body: content });
  if (!data?.rc_id) throw new InkaError('no_record_id');
  return data.rc_id;
}

/** `recId` phải là id lúc TẠO dòng: sau khi sửa, server liệt kê dòng dưới id mới mà lệnh sửa theo id đó không có tác dụng. */
export async function updateRow(recId: string, content: Record<string, unknown>): Promise<void> {
  await call('PUT', 'record', recId, { body: content });
}

const MESSAGES: Record<string, string> = {
  network: 'Không kết nối được máy chủ',
  timeout: 'Máy chủ phản hồi quá chậm',
  forbidden: 'Máy chủ từ chối thao tác',
  data_too_large: 'Chứng từ quá nhiều dòng hàng, máy chủ không lưu được',
  wrong_password: 'Sai tên đăng nhập hoặc mật khẩu',
  user_not_found: 'Sai tên đăng nhập hoặc mật khẩu',
  user_exists: 'Tên đăng nhập này đã có tài khoản trên máy chủ',
};
export const inkaMessage = (e: unknown) => (e instanceof InkaError ? MESSAGES[e.code] ?? `Lỗi máy chủ: ${e.code}` : e instanceof Error ? e.message : String(e));
