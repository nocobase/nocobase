import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { NOTIFICATION_SETTINGS_RESOURCE } from '../../shared/access.js';
import { requestFailure } from '../text.js';
import { notificationSettingsApi, type NotificationSettingsApi } from './api.js';

export function useSettingsApi(): NotificationSettingsApi {
  const api = useApiClient();
  return useMemo(() => notificationSettingsApi(api), [api]);
}

/** Whether the viewer may send tests and retry deliveries. */
export function useCanManageNotifications(): boolean {
  return useCan({ resource: NOTIFICATION_SETTINGS_RESOURCE, action: 'manage' })
    .can;
}

export type Loaded<T> =
  | { readonly state: 'loading' }
  | { readonly state: 'error'; readonly error: 'forbidden' | 'notFound' | 'failed' }
  | { readonly state: 'ready'; readonly data: T };

/** Loads `load()` once per `key`, with a way to load it again. */
export function useLoaded<T>(
  load: () => Promise<T>,
  key: string,
): readonly [Loaded<T>, () => void] {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    readonly key: string;
    readonly value: Loaded<T>;
  }>();
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const id = `${key}#${revision}`;
  // `load` reads only what `key` names, so the latest one is used without reloading when it changes identity.
  const loadRef = useRef(load);
  useLayoutEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    let current = true;
    loadRef.current().then(
      (data) => {
        if (current) setResult({ key: id, value: { state: 'ready', data } });
      },
      (cause: unknown) => {
        if (current)
          setResult({
            key: id,
            value: { state: 'error', error: requestFailure(cause) },
          });
      },
    );
    return () => {
      current = false;
    };
  }, [id]);
  return [
    result?.key === id ? result.value : { state: 'loading' },
    reload,
  ] as const;
}

