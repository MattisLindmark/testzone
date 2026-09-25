/**
 * IndexedDB Service - lagra fil-handles och behörigheter
 */

const DB_NAME = 'HealthLogMD';
const STORE_NAME = 'fileHandles';

let db;

/**
 * Initiera IndexedDB
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Lagra fil-handle i IndexedDB
 */
async function saveFileHandle(handle) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const data = { id: 'currentFile', handle };
    
    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(data);
  });
}

/**
 * Hämta lagrad fil-handle
 */
async function getFileHandle() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('currentFile');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      if (result && result.handle) {
        resolve(result.handle);
      } else {
        resolve(null);
      }
    };
  });
}

/**
 * Ta bort lagrad fil-handle (glömma fil)
 */
async function clearFileHandle() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('currentFile');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
