import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB } from '../types';
import { INITIAL_DATA } from '../data/initialData';
import { cloneDB } from '../utils/clone';

const DB_KEY = 'WMS_MULTI_FLEET_DB';
const USER_KEY = 'WMS_CURRENT_USER';

export async function loadDB(): Promise<DB> {
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (!raw) return cloneDB(INITIAL_DATA);
    const db = JSON.parse(raw) as Partial<DB>;
    // Tương thích ngược với dữ liệu cũ thiếu bảng
    return {
      ...cloneDB(INITIAL_DATA),
      ...db,
      users: db.users ?? cloneDB(INITIAL_DATA.users),
      incidents: db.incidents ?? [],
      damagedStock: db.damagedStock ?? [],
    } as DB;
  } catch {
    return cloneDB(INITIAL_DATA);
  }
}

export async function persistDB(db: DB): Promise<void> {
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
}

export async function loadCurrentUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export async function persistCurrentUserId(id: string | null): Promise<void> {
  if (id) await AsyncStorage.setItem(USER_KEY, id);
  else await AsyncStorage.removeItem(USER_KEY);
}
