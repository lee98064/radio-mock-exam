const DB_NAME = 'raido-mock-exam';
const DB_VERSION = 1;
const STORE_NAME = 'examAttempts';

let dbPromise = null;

function openDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB 不支援於此環境'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('無法開啟 IndexedDB'));
    };
  });
}

async function getDatabase() {
  if (!dbPromise) {
    dbPromise = openDatabase().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function saveExamAttempt(attempt) {
  try {
    const db = await getDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(attempt);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error ?? new Error('無法寫入考試紀錄'));
      tx.onabort = () => reject(tx.error ?? new Error('考試紀錄寫入中止'));
    });
    return true;
  } catch (error) {
    console.warn('[historyStorage] 保存考試紀錄失敗', error);
    return false;
  }
}

export async function getExamAttempts() {
  try {
    const db = await getDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error ?? new Error('無法讀取考試紀錄'));
    });
    return result
      .filter(Boolean)
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  } catch (error) {
    console.warn('[historyStorage] 取得考試紀錄失敗', error);
    throw error;
  }
}
