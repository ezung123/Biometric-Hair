// ══════════════════════════════════════════════════════════════════════════════
// src/services/hairGeneration/cache.ts
// STEP 2h: LOCAL INDEXEDDB EPHEMERAL CACHE & PRIVACY ENGINE
// ══════════════════════════════════════════════════════════════════════════════
// 1. Keys by hash(photo + styleId + audience + colour + provider).
// 2. Zero cloud persistence: photos remain strictly local / ephemeral.
// 3. One-line privacy disclosure notice.
// ══════════════════════════════════════════════════════════════════════════════

export const PRIVACY_DISCLOSURE =
  'Privacy Notice: Your portrait is processed in real time and cached only on your device. We never store, train on, or upload your facial biometric data.';

export interface CachedHairItem {
  key: string;
  imageDataUrl: string;
  provider: string;
  styleId: string;
  audience: string;
  colour: string;
  timestamp: number;
}

// In-memory fallback map if IndexedDB is unavailable
const MEMORY_CACHE = new Map<string, CachedHairItem>();

const DB_NAME = 'BiometricHairAiCache';
const STORE_NAME = 'generations';
const DB_VERSION = 1;

function computeHash(str: string): string {
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^ Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^ Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(16);
}

export function buildCacheKey(
  photoData: string,
  styleId: string,
  audience: string,
  colour: string,
  provider: string
): string {
  const photoSample = photoData.length > 500 ? photoData.slice(0, 250) + photoData.slice(-250) : photoData;
  return computeHash(`${photoSample}_${styleId}_${audience}_${colour}_${provider}`);
}

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    } catch {
      resolve(null);
    }
  });
}

export async function getCachedGeneration(key: string): Promise<CachedHairItem | null> {
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key)!;
  }

  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const item = req.result as CachedHairItem | undefined;
        if (item) {
          MEMORY_CACHE.set(key, item);
          resolve(item);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setCachedGeneration(item: CachedHairItem): Promise<void> {
  MEMORY_CACHE.set(item.key, item);

  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

