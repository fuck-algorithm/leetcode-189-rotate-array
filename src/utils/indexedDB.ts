import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { StarCache, ProgrammingLanguage } from '../types';

interface AppDB extends DBSchema {
  settings: {
    key: string;
    value: {
      key: string;
      value: string | number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: StarCache;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('leetcode-189-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

// 保存编程语言偏好
export const saveLanguagePreference = async (language: ProgrammingLanguage): Promise<void> => {
  const db = await getDB();
  await db.put('settings', { key: 'language', value: language });
};

// 获取编程语言偏好
export const getLanguagePreference = async (): Promise<ProgrammingLanguage> => {
  const db = await getDB();
  const result = await db.get('settings', 'language');
  return (result?.value as ProgrammingLanguage) || 'java';
};

// 保存播放速度
export const savePlaybackSpeed = async (speed: number): Promise<void> => {
  const db = await getDB();
  await db.put('settings', { key: 'playbackSpeed', value: speed });
};

// 获取播放速度
export const getPlaybackSpeed = async (): Promise<number> => {
  const db = await getDB();
  const result = await db.get('settings', 'playbackSpeed');
  return (result?.value as number) || 1;
};

// 保存GitHub Star缓存
export const saveStarCache = async (count: number): Promise<void> => {
  const db = await getDB();
  const cache: StarCache = {
    count,
    timestamp: Date.now(),
  };
  await db.put('cache', { key: 'githubStars', data: cache });
};

// 获取GitHub Star缓存
export const getStarCache = async (): Promise<StarCache | null> => {
  const db = await getDB();
  const result = await db.get('cache', 'githubStars');
  return result?.data || null;
};

// 检查缓存是否有效（1小时内）
export const isStarCacheValid = (cache: StarCache | null): boolean => {
  if (!cache) return false;
  const oneHour = 60 * 60 * 1000;
  return Date.now() - cache.timestamp < oneHour;
};
