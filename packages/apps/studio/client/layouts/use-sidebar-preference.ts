import { useSyncExternalStore, type SetStateAction } from 'react';

// All applications and layout surfaces on this origin share this preference.
const storageKey = 'nocobase:sidebar:collapsed';
const changeEvent = 'nocobase:sidebar-preference-change';
let memoryValue = false;
let memoryOnly = false;

function getSnapshot(): boolean {
  if (memoryOnly) return memoryValue;
  try {
    memoryValue = localStorage.getItem(storageKey) === 'true';
  } catch {
    // Storage may be unavailable; keep the current session's preference.
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

function getServerSnapshot(): boolean {
  return false;
}

export function useSidebarPreference(): readonly [
  boolean,
  (update: SetStateAction<boolean>) => void,
] {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return [collapsed, setCollapsed];
}
