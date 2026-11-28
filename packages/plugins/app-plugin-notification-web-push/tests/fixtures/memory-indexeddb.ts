/** A minimal in-memory IndexedDB: enough for the worker's single-store transactions. */
export function memoryIndexedDB() {
  const databases = new Map<string, Map<string, Map<string, unknown>>>();
  return {
    open(name: string) {
      const request: Record<string, unknown> & {
        onupgradeneeded?: () => void;
        onsuccess?: () => void;
      } = {};
      queueMicrotask(() => {
        let stores = databases.get(name);
        const fresh = !stores;
        if (!stores) databases.set(name, (stores = new Map()));
        request.result = {
          createObjectStore: (store: string) => stores!.set(store, new Map()),
          close: () => undefined,
          transaction: (storeName: string) => {
            const tx: { oncomplete?: () => void; objectStore?: unknown } = {};
            const store = stores!.get(storeName)!;
            let pending = 0;
            const run = (fn: () => unknown) => {
              const r: { result?: unknown; onsuccess?: () => void } = {};
              pending++;
              queueMicrotask(() => {
                r.result = fn();
                r.onsuccess?.();
                if (--pending === 0) queueMicrotask(() => tx.oncomplete?.());
              });
              return r;
            };
            tx.objectStore = () => ({
              get: (id: string) => run(() => store.get(id)),
              put: (value: { id: string }) =>
                run(() => store.set(value.id, value)),
              getAll: () => run(() => [...store.values()]),
              delete: (id: string) => run(() => store.delete(id)),
            });
            return tx;
          },
        };
        if (fresh) request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
}
