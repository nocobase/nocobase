import vm from 'node:vm';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { setAppBadge } from '../../client/browser.js';
import { workerSource } from '../../server/worker.js';
import { memoryIndexedDB } from '../fixtures/memory-indexeddb.js';

let storage: ReturnType<typeof memoryIndexedDB>;
let badge: string[];
beforeEach(() => {
  storage = memoryIndexedDB();
  badge = [];
  vi.stubGlobal('indexedDB', storage);
  Object.assign(navigator, {
    setAppBadge: vi.fn(
      async (count: number) => void badge.push(`set:${count}`),
    ),
    clearAppBadge: vi.fn(async () => void badge.push('clear')),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as { setAppBadge?: unknown }).setAppBadge;
  delete (navigator as { clearAppBadge?: unknown }).clearAppBadge;
});

/** The real worker source over the same IndexedDB the page uses, with no window open. */
function worker() {
  const handlers = new Map<string, (event: unknown) => void>();
  const shown: string[] = [];
  const self = {
    navigator,
    registration: {
      scope: 'https://app.example.test/main/',
      showNotification: async (_title: string, options: { tag: string }) =>
        void shown.push(options.tag),
    },
    clients: { claim: () => undefined, matchAll: async () => [] },
    addEventListener: (name: string, handler: (event: unknown) => void) =>
      handlers.set(name, handler),
  };
  vm.runInNewContext(workerSource({ title: 'Application' }), {
    self,
    URL,
    indexedDB: storage,
  });
  const push = async (data: object) => {
    let done: Promise<void> | undefined;
    handlers.get('push')!({
      data: { json: () => ({ title: 'T', badgeScope: '', ...data }) },
      waitUntil: (value: Promise<void>) => (done = value),
    });
    await done;
  };
  return { push, shown };
}

it('keeps a count a page cleared when an older push arrives after the page closed, and shows that push', async () => {
  const sw = worker();
  const early = 2; // A reminder's count is read: 4 wait.
  await sw.push({ dedupeKey: 'a', badge: 3, badgeVersion: early - 1 });
  const cleared = 3; // The page reads 0, clears the badge, then closes.
  expect(await setAppBadge('/main', 0, cleared)).toBe(true);
  await sw.push({ dedupeKey: 'late', badge: 4, badgeVersion: early });
  expect(badge).toEqual(['set:3', 'clear']);
  expect(sw.shown).toEqual(['a', 'late']);
  // The next newer read applies, from either side.
  await sw.push({
    dedupeKey: 'next',
    badge: 1,
    badgeVersion: 4,
  });
  expect(badge.at(-1)).toBe('set:1');
});

it('switches the badge to the account opened by the page and still shows a late push for the previous account', async () => {
  const sw = worker();
  expect(await setAppBadge('/main', 7, 100, 'alice')).toBe(true);
  expect(await setAppBadge('/main', 0, 1, 'bob')).toBe(true);
  await sw.push({
    dedupeKey: 'late',
    badge: 5,
    badgeVersion: 101,
    badgeScope: 'alice',
  });
  await sw.push({
    dedupeKey: 'legacy',
    badge: 4,
    badgeVersion: 10_000,
    badgeScope: undefined,
  });
  expect(badge).toEqual(['set:7', 'clear']);
  expect(sw.shown).toEqual(['late', 'legacy']);
});

it('lets a page set the same version again, ignores an older page read, and clears without a version', async () => {
  const sw = worker();
  const version = 10;
  await sw.push({ dedupeKey: 'a', badge: 2, badgeVersion: version });
  expect(await setAppBadge('/main', 2, version)).toBe(true);
  expect(await setAppBadge('/main', 6, version - 1)).toBe(false);
  expect(await setAppBadge('/main', 0)).toBe(true);
  expect(badge).toEqual(['set:2', 'set:2', 'clear']);
});
