/**
 * IndexedDB-based file storage for handling large files
 * sessionStorage has a ~5-10MB limit, IndexedDB can store hundreds of MB
 */

const DB_NAME = "uploadFilesDB";
const DB_VERSION = 1;
const STORE_NAME = "files";

interface StoredFile {
  name: string;
  type: string;
  size: number;
  base64: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Store files in IndexedDB for transfer between pages
 */
export async function storeFilesForUpload(files: StoredFile[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Clear any existing files first
    store.clear();

    // Store the new files with a single key
    const request = store.put({ id: "uploadFiles", files });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Retrieve files from IndexedDB
 */
export async function getStoredFilesForUpload(): Promise<StoredFile[] | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get("uploadFiles");

      request.onerror = () => {
        db.close();
        reject(request.error);
      };

      request.onsuccess = () => {
        db.close();
        const result = request.result;
        resolve(result?.files || null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Clear stored files from IndexedDB
 */
export async function clearStoredFiles(): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      store.clear();

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        resolve(); // Resolve anyway, don't fail on cleanup
      };
    });
  } catch {
    // Ignore errors during cleanup
  }
}
