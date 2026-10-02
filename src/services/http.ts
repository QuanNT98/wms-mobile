/**
 * HTTP transport for the inka.vn API.
 *
 * The server reads the request body only from the first socket read. iOS
 * networking (NSURLSession, WKWebView) writes headers and body separately, so
 * the server sees "Empty request body" for every POST/PUT from an iPhone.
 *
 * On iOS native builds (react-native-tcp-socket present) every request goes
 * through a raw TCP socket that writes headers + body in one write. Cookies
 * (the `auth_token` session) are then handled by a small in-app cookie jar,
 * since the native cookie store is bypassed.
 *
 * Everywhere else (Android, iOS in Expo Go) requests use fetch with
 * credentials: 'include' and the platform cookie store.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import * as RN from 'react-native';

export interface HttpResponse {
  status: number;
  text: string;
}

export interface HttpRequest {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs: number;
  signal?: AbortSignal;
}

/* ── Raw TCP availability ── */
type TcpModule = typeof import('react-native-tcp-socket').default;
let tcp: TcpModule | null | undefined;

function getTcp(): TcpModule | null {
  if (tcp === undefined) {
    // The library builds a NativeEventEmitter at import time and throws when its
    // native module is missing (Expo Go), so only require it when present.
    if (RN.Platform.OS === 'ios' && RN.NativeModules.TcpSockets) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('react-native-tcp-socket');
      // The package is CommonJS: the API may be the module itself or its `default`.
      tcp = ((mod?.default ?? mod)?.createConnection ? (mod.default ?? mod) : null) as TcpModule | null;
    } else {
      tcp = null;
    }
  }
  return tcp;
}

/** True when requests bypass the platform HTTP stack (iOS native build). */
export const usesRawTransport = () => !!getTcp();

/* ── Cookie jar (raw transport only) ── */
const COOKIE_KEY = 'wms:cookies';
let jar: Record<string, string> | null = null;

async function loadJar(): Promise<Record<string, string>> {
  if (jar) return jar;
  try {
    jar = JSON.parse((await AsyncStorage.getItem(COOKIE_KEY)) ?? '{}') as Record<string, string>;
  } catch {
    jar = {};
  }
  return jar;
}

async function storeSetCookies(headers: string[]) {
  if (!headers.length) return;
  const j = await loadJar();
  for (const h of headers) {
    const [pair, ...attrs] = h.split(';');
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    const expired = attrs.some((a) => /^\s*max-age\s*=\s*0\s*$/i.test(a));
    if (!value || expired) delete j[name];
    else j[name] = value;
  }
  try {
    await AsyncStorage.setItem(COOKIE_KEY, JSON.stringify(j));
  } catch {
    // best effort
  }
}

async function cookieHeader(): Promise<string | undefined> {
  const j = await loadJar();
  const parts = Object.entries(j).map(([k, v]) => `${k}=${v}`);
  return parts.length ? parts.join('; ') : undefined;
}

/** Forget the session cookies, both the in-app jar and the native store. */
export async function clearCookies(): Promise<void> {
  jar = {};
  try {
    await AsyncStorage.removeItem(COOKIE_KEY);
  } catch {
    // ignore
  }
  const net = (RN as unknown as { Networking?: { clearCookies?: (cb: (ok: boolean) => void) => void } }).Networking;
  await new Promise<void>((resolve) => {
    if (!net?.clearCookies) return resolve();
    net.clearCookies(() => resolve());
  });
}

/* ── Raw HTTP/1.1 over TCP ── */
const HEADER_END = Buffer.from('\r\n\r\n');

function parseUrl(url: string) {
  const m = /^http:\/\/([^/:?#]+)(?::(\d+))?([^#]*)$/i.exec(url);
  if (!m) throw new Error(`Unsupported URL ${url}`);
  const path = m[3] || '/';
  return { host: m[1], port: m[2] ? Number(m[2]) : 80, path: path.startsWith('/') ? path : `/${path}` };
}

/** Decode a chunked body; null while incomplete. */
function decodeChunked(buf: Buffer): Buffer | null {
  const parts: Buffer[] = [];
  let pos = 0;
  for (;;) {
    const lineEnd = buf.indexOf('\r\n', pos);
    if (lineEnd < 0) return null;
    const size = parseInt(buf.slice(pos, lineEnd).toString('latin1').split(';')[0], 16);
    if (Number.isNaN(size)) throw new Error('Bad chunk size');
    const start = lineEnd + 2;
    if (size === 0) return Buffer.concat(parts);
    if (buf.length < start + size + 2) return null;
    parts.push(buf.slice(start, start + size));
    pos = start + size + 2;
  }
}

function rawRequest(
  lib: TcpModule,
  url: string,
  req: HttpRequest & { cookie?: string },
): Promise<{ status: number; text: string; setCookies: string[] }> {
  const { host, port, path } = parseUrl(url);
  const body = Buffer.from(req.body ?? '', 'utf8');
  const headers: Record<string, string> = {
    Host: port === 80 ? host : `${host}:${port}`,
    Accept: 'application/json',
    ...req.headers,
    ...(req.cookie && { Cookie: req.cookie }),
    ...(req.body !== undefined && { 'Content-Length': String(body.length) }),
    Connection: 'close',
  };
  const head = `${req.method} ${path} HTTP/1.1\r\n${Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\r\n')}\r\n\r\n`;
  // One buffer, one write: headers and body leave together.
  const payload = Buffer.concat([Buffer.from(head, 'utf8'), body]);

  return new Promise((resolve, reject) => {
    let received = Buffer.alloc(0);
    let settled = false;
    let parsed: { status: number; headers: Record<string, string>; setCookies: string[]; bodyStart: number } | null = null;

    const socket = lib.createConnection({ host, port, connectTimeout: req.timeoutMs }, () => {
      socket.write(payload);
    });

    const finish = (err: Error | null, res?: { status: number; text: string; setCookies: string[] }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.signal?.removeEventListener('abort', onAbort);
      socket.destroy();
      if (err) reject(err);
      else resolve(res!);
    };
    const onAbort = () => finish(new Error('Hết thời gian chờ server'));
    req.signal?.addEventListener('abort', onAbort);
    const timer = setTimeout(onAbort, req.timeoutMs);

    const tryComplete = (closed: boolean) => {
      if (!parsed) {
        const idx = received.indexOf(HEADER_END);
        if (idx < 0) {
          if (closed) finish(new Error('Server đóng kết nối trước khi trả header'));
          return;
        }
        const lines = received.slice(0, idx).toString('latin1').split('\r\n');
        const status = Number(/^HTTP\/\d\.\d (\d{3})/.exec(lines[0])?.[1]);
        if (!status) return finish(new Error(`Dòng trạng thái không hợp lệ: ${lines[0]}`));
        const h: Record<string, string> = {};
        const setCookies: string[] = [];
        for (const line of lines.slice(1)) {
          const c = line.indexOf(':');
          if (c <= 0) continue;
          const name = line.slice(0, c).trim().toLowerCase();
          const value = line.slice(c + 1).trim();
          if (name === 'set-cookie') setCookies.push(value);
          else h[name] = value;
        }
        parsed = { status, headers: h, setCookies, bodyStart: idx + HEADER_END.length };
      }

      const rest = received.slice(parsed.bodyStart);
      let bodyBuf: Buffer | null = null;
      if (/chunked/i.test(parsed.headers['transfer-encoding'] ?? '')) {
        bodyBuf = decodeChunked(rest);
      } else if (parsed.headers['content-length'] !== undefined) {
        const len = Number(parsed.headers['content-length']);
        if (rest.length >= len) bodyBuf = rest.slice(0, len);
      } else if (closed) {
        bodyBuf = rest;
      }
      if (bodyBuf) {
        finish(null, { status: parsed.status, text: bodyBuf.toString('utf8'), setCookies: parsed.setCookies });
      } else if (closed) {
        finish(new Error('Server đóng kết nối trước khi trả đủ dữ liệu'));
      }
    };

    socket.on('data', (chunk) => {
      received = Buffer.concat([received, typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : Buffer.from(chunk)]);
      try {
        tryComplete(false);
      } catch (e) {
        finish(e as Error);
      }
    });
    socket.on('error', (e) => finish(e instanceof Error ? e : new Error(String(e))));
    socket.on('close', () => {
      try {
        tryComplete(true);
      } catch (e) {
        finish(e as Error);
      }
    });
  });
}

/* ── Public entry point ── */
export async function httpRequest(url: string, req: HttpRequest): Promise<HttpResponse> {
  const lib = getTcp();
  if (lib) {
    const res = await rawRequest(lib, url, { ...req, cookie: await cookieHeader() });
    await storeSetCookies(res.setCookies);
    return { status: res.status, text: res.text };
  }

  const res = await fetch(url, {
    method: req.method,
    credentials: 'include',
    headers: req.headers,
    signal: req.signal,
    ...(req.body !== undefined && { body: req.body }),
  });
  return { status: res.status, text: await res.text() };
}
