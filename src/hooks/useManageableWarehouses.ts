import { useMemo } from 'react';
import { getManageableWarehouses } from '@/engine/permissions';
import { useDb } from '@/store/DbContext';
import { Warehouse } from '@/types';

// Danh sách kho/xe user hiện tại được phép thao tác (nguồn/đích khi tạo chứng từ)
export function useManageableWarehouses(): Warehouse[] {
  const { db, user } = useDb();
  return useMemo(() => getManageableWarehouses(db, user), [db, user]);
}
