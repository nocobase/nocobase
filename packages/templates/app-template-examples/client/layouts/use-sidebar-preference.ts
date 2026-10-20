import {
  createContext,
  useContext,
  useSyncExternalStore,
  type SetStateAction,
} from 'react';

// Each application shares its preference across layouts and tabs, never across scopes.
export function createSidebarPreferenceStore(scope: string) {
  const storageKey = `nocobase:sidebar:collapsed:${scope}`;
  const changeEvent = `nocobase:sidebar-preference-change:${scope}`;
  let memoryValue = false;
  let memoryOnly = false;

  function getSnapshot(): boolean {
    if (memoryOnly) return memoryValue;
    try {
      memoryValue = localStorage.getItem(storageKey) === 'true';
    } catch {
      // Storage may be unavailable; keep this application's session preference.
    }
    return memoryValue;
  }

  function subscribe(notify: () => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) notify();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(changeEvent, notify);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(changeEvent, notify);
    };
  }

  function setCollapsed(update: SetStateAction<boolean>): void {
    const current = getSnapshot();
    memoryValue = typeof update === 'function' ? update(current) : update;
    try {
      localStorage.setItem(storageKey, String(memoryValue));
    } catch {
      memoryOnly = true;
      // The toggle remains usable when storage is blocked.
    }
    window.dispatchEvent(new Event(changeEvent));
  }

  return { getSnapshot, subscribe, setCollapsed };
}

type SidebarPreferenceStore = ReturnType<typeof createSidebarPreferenceStore>;

export function createAppSidebarPreferenceStore(basename: string = '') {
  const normalizedBasename = `/${basename.replace(/^\/+|\/+$/g, '')}`;
  return createSidebarPreferenceStore(`app:${normalizedBasename}`);
}

const SidebarPreferenceContext = createContext<SidebarPreferenceStore | null>(
  null,
);

export const SidebarPreferenceProvider = SidebarPreferenceContext.Provider;

export function useSidebarPreference(): readonly [
  boolean,
  (update: SetStateAction<boolean>) => void,
] {
  const store = useContext(SidebarPreferenceContext);
  if (!store) throw new Error('SidebarPreferenceProvider is required.');
  const collapsed = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => false,
  );
  return [collapsed, store.setCollapsed];
}
