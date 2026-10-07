/**
 * The signed-in person's preferences in the browser: `/api/users/me/preferences` with a local cache.
 *
 * The server is the source of truth, so a choice follows the person to every browser. The cache in `localStorage`
 * exists only so the first frame paints with the last known values instead of the defaults; once the server answers,
 * its values replace the cache. A value a page kept in `localStorage` before preferences existed can be handed to
 * `useUserPreference` as `legacy`: if the server holds nothing for the key, it is written there once.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

export type UserPreferenceValues = Readonly<Record<string, unknown>>;

const PATH = 'users/me/preferences';
const CACHE_PREFIX = 'nocobase:user-preferences:';

/** The HTTP API of the signed-in person's preferences; responses are unwrapped from `{ data }`. */
export class UserPreferencesClient {
  public constructor(private readonly api: ApiClient) {}

  public async list(): Promise<UserPreferenceValues> {
    const { data } = await this.api.request<{
      readonly data: UserPreferenceValues;
    }>({ path: PATH });
    return data;
  }

  public async set(key: string, value: unknown): Promise<void> {
    await this.api.request({
      path: `${PATH}/${encodeURIComponent(key)}`,
      method: 'PUT',
      json: { value },
    });
  }

  public async setMany(values: UserPreferenceValues): Promise<void> {
    await this.api.request({ path: PATH, method: 'PATCH', json: values });
  }

  public async remove(key: string): Promise<void> {
    await this.api.request({
      path: `${PATH}/${encodeURIComponent(key)}`,
      method: 'DELETE',
    });
  }
}

function readCache(userId: string): Record<string, unknown> {
  try {
    const text = globalThis.localStorage?.getItem(CACHE_PREFIX + userId);
    const value: unknown = text ? JSON.parse(text) : {};
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {};
  } catch {
    return {};
  }
}

function writeCache(userId: string, values: UserPreferenceValues): void {
  try {
    globalThis.localStorage?.setItem(
      CACHE_PREFIX + userId,
      JSON.stringify(values),
    );
  } catch {
    // Storage refused (private mode): the server still keeps the values.
  }
}

/**
 * One person's preferences: the cached values at once, the server's once loaded. Writes apply locally at once and
 * are sent to the server; a failed write is reported to `onError` and the server's value is read back.
 */
export class UserPreferenceStore {
  private values: Record<string, unknown>;
  private serverKeys = new Set<string>();
  private loading: Promise<void> | null = null;
  private loadedFlag = false;
  private readonly listeners = new Set<() => void>();
  private version = 0;

  public constructor(
    private readonly client: UserPreferencesClient,
    public readonly userId: string,
    private readonly onError: (error: unknown) => void = () => undefined,
  ) {
    this.values = readCache(userId);
  }

  public get loaded(): boolean {
    return this.loadedFlag;
  }

  /** A number that changes with every change, for `useSyncExternalStore`. */
  public snapshot = (): number => this.version;

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public get(key: string): unknown {
    return this.values[key];
  }

  /** Whether the server holds a value for the key; false until loaded. */
  public stored(key: string): boolean {
    return this.serverKeys.has(key);
  }

  /** Reads the server's values once; later calls wait for the same read. */
  public load(): Promise<void> {
    this.loading ??= this.client.list().then(
      (values) => {
        // An answer that is not an object of values is no answer: keep the cache, and read again next time.
        if (
          typeof values !== 'object' ||
          values === null ||
          Array.isArray(values)
        ) {
          this.loading = null;
          return;
        }
        this.replace(values);
      },
      (error: unknown) => {
        // Keep the cache; the next mount tries again.
        this.loading = null;
        this.onError(error);
      },
    );
    return this.loading;
  }

  public async set(key: string, value: unknown): Promise<void> {
    this.values = { ...this.values, [key]: value };
    this.serverKeys.add(key);
    this.changed();
    try {
      await this.client.set(key, value);
    } catch (error) {
      this.onError(error);
      this.loading = null;
      await this.load();
    }
  }

  private replace(values: UserPreferenceValues): void {
    this.values = { ...values };
    this.serverKeys = new Set(Object.keys(values));
    this.loadedFlag = true;
    this.changed();
  }

  private changed(): void {
    this.version += 1;
    writeCache(this.userId, this.values);
    for (const listener of this.listeners) listener();
  }
}

const stores = new Map<string, UserPreferenceStore>();

/** The store of whoever is signed in; null while nobody is. One store per person and page, shared by every hook. */
export function useUserPreferenceStore(): UserPreferenceStore | null {
  const api = useApiClient();
  const userId = useAuthentication().session?.user.id ?? null;
  const store = useMemo(() => {
    if (!userId) return null;
    let existing = stores.get(userId);
    if (!existing) {
      existing = new UserPreferenceStore(
        new UserPreferencesClient(api),
        userId,
      );
      stores.set(userId, existing);
    }
    return existing;
  }, [api, userId]);
  useEffect(() => {
    void store?.load();
  }, [store]);
  return store;
}

export interface UseUserPreferenceOptions<T> {
  /** What the preference is while nothing is stored, or nobody is signed in. */
  readonly defaultValue: T;
  /** Turns a stored value into `T`; undefined when it is not one (the default then applies). */
  readonly parse?: (value: unknown) => T | undefined;
  /**
   * A value kept before preferences existed, such as one in `localStorage`. Read once the server has answered; when
   * the server holds nothing for the key and this returns a value, it is written to the server.
   */
  readonly legacy?: () => T | undefined;
}

export interface UserPreferenceState {
  /** Whether the server's values have arrived; before that the value is the cache's or the default. */
  readonly loaded: boolean;
  /** Whether the server holds a value for the key. */
  readonly stored: boolean;
}

/** One preference of the signed-in person: its value, a setter, and whether the server has answered. */
export function useUserPreference<T>(
  key: string,
  options: UseUserPreferenceOptions<T>,
): readonly [T, (next: T) => void, UserPreferenceState] {
  const store = useUserPreferenceStore();
  const subscribe = useCallback(
    (listener: () => void) => store?.subscribe(listener) ?? (() => undefined),
    [store],
  );
  useSyncExternalStore(
    subscribe,
    () => store?.snapshot() ?? 0,
    () => 0,
  );
  const { defaultValue, parse, legacy } = options;
  const raw = store?.get(key);
  const parsed =
    raw === undefined ? undefined : parse ? parse(raw) : (raw as T);
  const value = parsed === undefined ? defaultValue : parsed;
  const loaded = store?.loaded ?? false;
  const stored = store?.stored(key) ?? false;

  useEffect(() => {
    if (!store || !loaded || stored || !legacy) return;
    const previous = legacy();
    if (previous !== undefined) void store.set(key, previous);
  }, [store, loaded, stored, legacy, key]);

  const set = useCallback(
    (next: T) => {
      void store?.set(key, next);
    },
    [store, key],
  );
  return [value, set, { loaded, stored }];
}
