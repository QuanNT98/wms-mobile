import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { DB, User } from '@/types';
import { INITIAL_DATA, makeBlankData } from '@/data/initialData';
import { loadCurrentUserId, loadDB, persistCurrentUserId, persistDB } from '@/store/storage';
import { cloneDB } from '@/utils/clone';
import { isAdmin } from '@/engine/permissions';
import { useToast } from '@/components/layout/Toast';

export type Mutator = (db: DB, user: User | null) => DB;

interface DbContextValue {
  db: DB;
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  // Chạy 1 hàm nghiệp vụ từ engine; tự lưu + hiển thị lỗi. Trả về true nếu thành công.
  mutate: (fn: Mutator, successMessage?: string) => boolean;
  // 'DEMO' = khôi phục bộ dữ liệu mẫu; 'BLANK' = xóa sạch, chỉ giữ tài khoản admin hiện tại
  resetData: (mode: 'DEMO' | 'BLANK') => void;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(() => cloneDB(INITIAL_DATA));
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const toast = useToast();
  const dbRef = useRef(db);
  dbRef.current = db;

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

  // User đang đăng nhập luôn được tra lại từ db để phản ánh chỉnh sửa tài khoản mới nhất
  const user = useMemo(() => (userId ? db.users.find((u) => u.id === userId) ?? null : null), [db.users, userId]);

  const commit = useCallback((next: DB) => {
    setDb(next);
    persistDB(next).catch(() => {});
  }, []);

  const login = useCallback((username: string, password: string) => {
    const uname = username.trim().toLowerCase();
    const found = dbRef.current.users.find((u) => u.username === uname && u.password === password);
    if (!found) return false;
    setUserId(found.id);
    persistCurrentUserId(found.id).catch(() => {});
    return true;
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    persistCurrentUserId(null).catch(() => {});
  }, []);

  const mutate = useCallback((fn: Mutator, successMessage?: string) => {
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
  }, [userId, commit, toast]);

  const resetData = useCallback((mode: 'DEMO' | 'BLANK') => {
    if (!user || !isAdmin(user)) { toast.error('Chỉ Quản Trị Viên mới được đặt lại dữ liệu!'); return; }
    if (mode === 'DEMO') {
      Alert.alert('Đặt lại dữ liệu demo', 'Khôi phục toàn bộ dữ liệu về bộ mẫu ban đầu? Dữ liệu hiện tại sẽ bị thay thế.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đặt lại', style: 'destructive', onPress: () => { commit(cloneDB(INITIAL_DATA)); toast.success('Đã khôi phục dữ liệu demo'); } },
      ]);
      return;
    }
    Alert.alert(
      'Danh sách trắng',
      `Xóa TOÀN BỘ dữ liệu (kho, sản phẩm, đối tác, xe, tồn kho, chứng từ, tài khoản khác) để tự nhập lại từ đầu?\n\nChỉ giữ lại tài khoản đang đăng nhập: ${user.username}.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa & bắt đầu trắng', style: 'destructive', onPress: () => { commit(makeBlankData(user)); toast.success('Đã tạo danh sách trắng, hãy thêm kho & sản phẩm để bắt đầu'); } },
      ],
    );
  }, [user, commit, toast]);

  const value = useMemo<DbContextValue>(() => ({ db, user, ready, login, logout, mutate, resetData }), [db, user, ready, login, logout, mutate, resetData]);

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb(): DbContextValue {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error('useDb phải được dùng bên trong DbProvider');
  return ctx;
}
