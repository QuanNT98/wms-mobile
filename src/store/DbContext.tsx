import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { DB, User } from '@/types';
import { INITIAL_DATA, makeBlankData } from '@/data/initialData';
import { loadCurrentUserId, loadDB, persistCurrentUserId, persistDB } from '@/store/storage';
import { cloneDB } from '@/utils/clone';
import { isAdmin } from '@/engine/permissions';
import { useToast } from '@/components/layout/Toast';
import { InkaError, inkaMessage, signIn, signOut, signUp } from '@/services/inka';
import { serverEnabled } from '@/services/inkaConfig';
import { diffDb, emptyRefs, pull, push, type Refs } from '@/store/sync';

// Tải lại từ máy chủ định kỳ để thấy thao tác của thiết bị khác
const POLL_MS = 15000;

export interface SyncStatus {
  /** false = app chỉ lưu trên máy (chưa cấu hình máy chủ) */
  enabled: boolean;
  /** Đã tải được dữ liệu từ máy chủ ít nhất một lần trong phiên này */
  connected: boolean;
  busy: boolean;
  /** Lỗi của lần đồng bộ gần nhất, null nếu ổn */
  error: string | null;
}

export type Mutator = (db: DB, user: User | null) => DB;

interface DbContextValue {
  db: DB;
  user: User | null;
  ready: boolean;
  // Trả về null nếu đăng nhập được, hoặc thông báo lỗi để hiển thị.
  // Khi dùng máy chủ: đăng nhập bằng tài khoản inka (mất ~6 giây), quyền lấy từ bảng users.
  login: (username: string, password: string) => Promise<string | null>;
  // Tạo tài khoản đăng nhập trên máy chủ cho người dùng mới; null = xong (hoặc không dùng máy chủ)
  createAccount: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  // Chạy 1 hàm nghiệp vụ từ engine; tự lưu + hiển thị lỗi. Trả về true nếu thành công.
  mutate: (fn: Mutator, successMessage?: string) => boolean;
  // 'DEMO' = khôi phục bộ dữ liệu mẫu; 'BLANK' = xóa sạch, chỉ giữ tài khoản admin hiện tại
  resetData: (mode: 'DEMO' | 'BLANK') => void;
  sync: SyncStatus;
  // Đẩy thay đổi còn treo rồi tải lại dữ liệu từ máy chủ
  refresh: () => Promise<void>;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(() => cloneDB(INITIAL_DATA));
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const toast = useToast();
  const dbRef = useRef(db);
  dbRef.current = db;

  // ---- Đồng bộ với máy chủ (inka.vn) ----
  const [sync, setSync] = useState<SyncStatus>({ enabled: serverEnabled(), connected: false, busy: false, error: null });
  const syncedRef = useRef<DB | null>(null);   // trạng thái máy chủ đã biết; null = chưa tải được lần nào
  const refsRef = useRef<Refs>(emptyRefs());
  const dirtyRef = useRef(false);              // có thay đổi trên máy chưa đẩy xong
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  // Các lượt đẩy / tải chạy nối đuôi nhau, không bao giờ chen vào nhau
  const enqueue = useCallback((task: () => Promise<void>) => {
    const run = queueRef.current.then(async () => {
      setSync((v) => ({ ...v, busy: true }));
      try {
        await task();
        setSync((v) => ({ ...v, busy: false, error: null }));
      } catch (e) {
        setSync((v) => ({ ...v, busy: false, error: inkaMessage(e) }));
        throw e;
      }
    });
    queueRef.current = run.catch(() => {});
    return run;
  }, []);

  const pushPending = useCallback(async () => {
    const synced = syncedRef.current;
    if (!synced || !dirtyRef.current) return;
    const target = dbRef.current;
    await push(diffDb(synced, target), refsRef.current);
    syncedRef.current = target;
    if (dbRef.current === target) dirtyRef.current = false;
  }, []);

  const pullLatest = useCallback(async () => {
    const { db: remote, refs } = await pull();
    // Người dùng vừa thao tác trong lúc đang tải: giữ bản trên máy, lượt sau tải lại
    if (dirtyRef.current) return;
    refsRef.current = refs;
    syncedRef.current = remote;
    dbRef.current = remote;
    setSync((v) => (v.connected ? v : { ...v, connected: true }));
    if (JSON.stringify(remote) !== JSON.stringify(dbRef.current)) {
      setDb(remote);
      persistDB(remote).catch(() => {});
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!serverEnabled()) return;
    try {
      await enqueue(async () => {
        await pushPending();
        await pullLatest();
      });
    } catch {
      // Lỗi đã nằm trong sync.error; lượt sau thử lại
    }
  }, [enqueue, pushPending, pullLatest]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loaded, uid] = await Promise.all([loadDB(), loadCurrentUserId()]);
      if (cancelled) return;
      setDb(loaded);
      setUserId(uid);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !serverEnabled()) return;
    refresh();
    const timer = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [ready, refresh]);

  // User đang đăng nhập luôn được tra lại từ db để phản ánh chỉnh sửa tài khoản mới nhất
  const user = useMemo(() => (userId ? db.users.find((u) => u.id === userId) ?? null : null), [db.users, userId]);

  const commit = useCallback((input: DB) => {
    // Mật khẩu do máy chủ giữ: không để trong dữ liệu của app
    const next = serverEnabled() ? { ...input, users: input.users.map((u) => ({ ...u, password: '' })) } : input;
    dbRef.current = next;
    setDb(next);
    persistDB(next).catch(() => {});
    if (!serverEnabled()) return;
    dirtyRef.current = true;
    enqueue(pushPending).catch((e) => toast.error(`Chưa lưu được lên máy chủ: ${inkaMessage(e)}. Sẽ thử lại.`));
  }, [enqueue, pushPending, toast]);

  // Khi dùng máy chủ, chỉ cho thao tác sau khi đã tải được dữ liệu mới nhất
  const assertConnected = useCallback(() => {
    if (!serverEnabled() || syncedRef.current) return true;
    toast.error('Chưa kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
    refresh();
    return false;
  }, [toast, refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const uname = username.trim().toLowerCase();
    const enter = (id: string) => {
      setUserId(id);
      persistCurrentUserId(id).catch(() => {});
      return null;
    };
    if (!serverEnabled()) {
      const local = dbRef.current.users.find((u) => u.username === uname && u.password === password);
      return local ? enter(local.id) : 'Sai tên đăng nhập hoặc mật khẩu';
    }
    try {
      await signIn(uname, password);
    } catch (e) {
      return inkaMessage(e);
    }
    // Vai trò và kho phụ trách lấy từ bảng users mới nhất trên máy chủ
    await refresh();
    if (!syncedRef.current) return 'Đăng nhập được nhưng chưa tải được dữ liệu. Kiểm tra mạng rồi thử lại.';
    const found = dbRef.current.users.find((u) => u.username === uname);
    if (!found) {
      signOut().catch(() => {});
      return 'Tài khoản này chưa được cấp quyền dùng ứng dụng';
    }
    return enter(found.id);
  }, [refresh]);

  const logout = useCallback(() => {
    setUserId(null);
    persistCurrentUserId(null).catch(() => {});
    if (serverEnabled()) signOut().catch(() => {});
  }, []);

  const createAccount = useCallback(async (username: string, password: string) => {
    if (!serverEnabled()) return null;
    try {
      await signUp(username.trim().toLowerCase(), password);
      return null;
    } catch (e) {
      // Tài khoản đã có trên máy chủ (vd. người dùng từng bị xoá khỏi app): dùng lại, mật khẩu giữ như cũ
      if (e instanceof InkaError && e.code === 'user_exists') return null;
      return inkaMessage(e);
    }
  }, []);

  const mutate = useCallback((fn: Mutator, successMessage?: string) => {
    if (!assertConnected()) return false;
    try {
      const current = dbRef.current;
      const currentUser = userId ? current.users.find((u) => u.id === userId) ?? null : null;
      const next = fn(current, currentUser);
      if (next !== current) commit(next);
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Đã xảy ra lỗi');
      return false;
    }
  }, [userId, commit, toast, assertConnected]);

  const resetData = useCallback((mode: 'DEMO' | 'BLANK') => {
    if (!user || !isAdmin(user)) { toast.error('Chỉ Quản Trị Viên mới được đặt lại dữ liệu!'); return; }
    if (!assertConnected()) return;
    // Dữ liệu trên máy chủ là dùng chung: đặt lại sẽ thay đổi trên mọi thiết bị
    const shared = serverEnabled() ? '\n\nDữ liệu dùng chung trên máy chủ: mọi thiết bị đều bị thay đổi theo.' : '';
    if (mode === 'DEMO') {
      Alert.alert('Đặt lại dữ liệu demo', `Khôi phục toàn bộ dữ liệu về bộ mẫu ban đầu? Dữ liệu hiện tại sẽ bị thay thế.${shared}`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đặt lại', style: 'destructive', onPress: () => { commit(cloneDB(INITIAL_DATA)); toast.success('Đã khôi phục dữ liệu demo'); } },
      ]);
      return;
    }
    Alert.alert(
      'Danh sách trắng',
      `Xóa TOÀN BỘ dữ liệu (kho, sản phẩm, đối tác, xe, tồn kho, chứng từ, tài khoản khác) để tự nhập lại từ đầu?\n\nChỉ giữ lại tài khoản đang đăng nhập: ${user.username}.${shared}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa & bắt đầu trắng', style: 'destructive', onPress: () => { commit(makeBlankData(user)); toast.success('Đã tạo danh sách trắng, hãy thêm kho & sản phẩm để bắt đầu'); } },
      ],
    );
  }, [user, commit, toast, assertConnected]);

  const value = useMemo<DbContextValue>(() => ({ db, user, ready, login, createAccount, logout, mutate, resetData, sync, refresh }), [db, user, ready, login, createAccount, logout, mutate, resetData, sync, refresh]);

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb(): DbContextValue {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error('useDb phải được dùng bên trong DbProvider');
  return ctx;
}
