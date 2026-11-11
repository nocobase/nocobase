import {
  AppLocalePreferenceContext,
  readStoredLocale,
  writeStoredLocale,
  resolveAppBase,
  useApiClient,
  type AppLocalePreference,
  type ApiClient,
} from '@nocobase/app-client';
import { useOptionalI18nRuntime } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { USER_LOCALE_PREFERENCE_KEY } from '../shared/preference-keys.js';
import { useUserPreferenceStore } from './preferences.js';

function guestLocale(): string | undefined {
  try {
    return (
      localStorage.getItem(`nocobase.guest-locale:${resolveAppBase()}`) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

class LocaleWork {
  private tail: Promise<unknown> = Promise.resolve();
  public constructor(private readonly api: ApiClient) {}
  public async synchronize(
    locale: string,
  ): ReturnType<AppLocalePreference['set']> {
    const { data } = await this.api.request<{
      data: Awaited<ReturnType<AppLocalePreference['set']>>;
    }>({
      path: 'i18n/locale',
      method: 'PUT',
      json: { locale },
    });
    return data;
  }
  public enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(operation);
    this.tail = result.catch(() => undefined);
    return result;
  }
}
// Authorization can remount extension providers when a session changes. Keep
// the queue on the application API client so old locale loads finish first.
const localeWork = new WeakMap<ApiClient, LocaleWork>();
function getLocaleWork(api: ApiClient): LocaleWork {
  let work = localeWork.get(api);
  if (!work) {
    work = new LocaleWork(api);
    localeWork.set(api, work);
  }
  return work;
}

class IdentityScope {
  public active = true;
  public revision = 0;
  public constructor(public readonly identity: string | null) {}
  public activate(): void {
    this.active = true;
  }
  public cancel(): void {
    this.active = false;
  }
  public select(): void {
    ++this.revision;
  }
}

/** Owns identity transitions as well as explicit switches, on one ordered queue. */
export function UserLocaleProvider({
  children,
}: PropsWithChildren): ReactElement | null {
  const auth = useAuthentication();
  const store = useUserPreferenceStore();
  const runtime = useOptionalI18nRuntime();
  const api = useApiClient();
  useSyncExternalStore(
    store?.subscribe ?? (() => () => undefined),
    store?.snapshot ?? (() => 0),
    () => 0,
  );
  const identity = auth.isPending
    ? 'pending'
    : (auth.session?.session?.id ?? auth.session?.user.id ?? null);
  const ready = !auth.isPending && (!store || store.loaded);
  const value = store?.loaded
    ? store.get(USER_LOCALE_PREFERENCE_KEY)
    : undefined;
  const [visibleIdentity, setVisibleIdentity] = useState<
    string | null | undefined
  >();
  const queue = useMemo(() => getLocaleWork(api), [api]);
  const scope = useMemo(() => new IdentityScope(identity), [identity]);
  const enqueue = useMemo(() => queue.enqueue.bind(queue), [queue]);
  useEffect(() => {
    scope.activate();
    return () => {
      scope.cancel();
    };
  }, [scope]);

  const synchronize = useMemo(() => queue.synchronize.bind(queue), [queue]);

  useEffect(() => {
    if (!runtime) return;
    let cancelled = false;
    const revision = scope.revision;
    void enqueue(async () => {
      if (cancelled || !scope.active || revision !== scope.revision) return;
      const raw = identity === null ? guestLocale() : ready ? value : undefined;
      const selected =
        typeof raw === 'string' && runtime.getLocales().includes(raw)
          ? raw
          : runtime.getDefaultLocale();
      await runtime.changeLanguage(selected);
      if (cancelled || !scope.active || revision !== scope.revision) return;
      writeStoredLocale(runtime.getLocale());
      try {
        await synchronize(runtime.getLocale());
      } finally {
        if (!cancelled && scope.active && revision === scope.revision)
          setVisibleIdentity(identity);
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [runtime, identity, ready, value, scope, enqueue, synchronize]);

  const preference = useMemo<AppLocalePreference>(
    () => ({
      identity,
      ready,
      value,
      set: (next) => {
        scope.select();
        return enqueue(async () => {
          if (!scope.active || auth.isPending)
            throw new Error('The signed-in account changed.');
          if (!runtime || !runtime.getLocales().includes(next))
            throw new Error('Unsupported locale.');
          await runtime.changeLanguage(next);
          if (!scope.active) throw new Error('The signed-in account changed.');
          writeStoredLocale(runtime.getLocale());
          if (store)
            await store.set(
              USER_LOCALE_PREFERENCE_KEY,
              next,
              () => scope.active,
            );
          else {
            try {
              localStorage.setItem(
                `nocobase.guest-locale:${resolveAppBase()}`,
                readStoredLocale() ?? next,
              );
            } catch {
              /* Browser storage is optional. */
            }
          }
          if (!scope.active) throw new Error('The signed-in account changed.');
          return synchronize(next);
        });
      },
    }),
    [
      identity,
      ready,
      value,
      scope,
      enqueue,
      runtime,
      store,
      synchronize,
      auth.isPending,
    ],
  );

  // Hide the previous identity's UI until its language has been replaced.
  if (runtime && visibleIdentity !== identity) return null;
  return (
    <AppLocalePreferenceContext.Provider value={preference}>
      {children}
    </AppLocalePreferenceContext.Provider>
  );
}
