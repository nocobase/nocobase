import { useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useState } from 'react';

import type { AuthenticationSettings } from '../../server/settings.js';
import type { AuthenticationProviderSummary } from '../../server/settings-service.js';

export type {
  AuthenticationSettings,
  AuthenticationSignInMethod,
  SettingValue,
} from '../../server/settings.js';
export type { AuthenticationProviderSummary } from '../../server/settings-service.js';
export type { ConfigOrigin } from '../../server/sign-in-methods.js';

export interface Query<TData> {
  readonly data?: TData;
  readonly error?: unknown;
  readonly isPending: boolean;
  readonly refetch: () => void;
}

function useRead<TData>(path: string): Query<TData> {
  const api = useApiClient();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    readonly data?: TData;
    readonly error?: unknown;
    readonly isPending: boolean;
  }>({ isPending: true });
  useEffect(() => {
    let active = true;
    api.request<{ readonly data: TData }>({ path }).then(
      (response) => {
        if (active) setState({ data: response.data, isPending: false });
      },
      (error: unknown) => {
        if (active) setState({ error, isPending: false });
      },
    );
    return () => {
      active = false;
    };
  }, [api, path, attempt]);
  const refetch = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, refetch };
}

/** `GET /api/authentication/settings`: the effective settings, for those who may read them. */
export function useAuthenticationSettings(): Query<AuthenticationSettings> {
  return useRead<AuthenticationSettings>('authentication/settings');
}

/** `GET /api/authentication/providers`: the single sign-on and social providers a person can link. */
export function useAuthenticationProviders(): Query<
  readonly AuthenticationProviderSummary[]
> {
  return useRead<readonly AuthenticationProviderSummary[]>(
    'authentication/providers',
  );
}
