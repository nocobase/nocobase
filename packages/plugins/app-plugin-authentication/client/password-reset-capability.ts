import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useState } from 'react';

export interface PasswordResetCapability {
  readonly passwordResetAvailable: boolean;
}

export interface PasswordResetCapabilityQuery {
  readonly data?: PasswordResetCapability;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly refetch: () => Promise<void>;
}

interface CapabilityHostState {
  cached?: {
    readonly value: PasswordResetCapability;
    readonly expiresAt: number;
  };
  request?: Promise<PasswordResetCapability>;
}

// Keyed by the host's own `ApiClient` instance, which the application's service container creates one of per
// application, so one host's cached or in-flight capability is never handed to another.
const hostState = new WeakMap<ApiClient, CapabilityHostState>();

function stateOf(api: ApiClient): CapabilityHostState {
  let state = hostState.get(api);
  if (!state) {
    state = {};
    hostState.set(api, state);
  }
  return state;
}

async function requestCapability(
  api: ApiClient,
  refresh = false,
): Promise<PasswordResetCapability> {
  const state = stateOf(api);
  if (refresh) state.cached = undefined;
  if (state.cached && state.cached.expiresAt > Date.now())
    return state.cached.value;
  state.request ??= api
    .request<{
      readonly data?: { readonly passwordResetAvailable?: unknown };
    }>({ path: 'authentication/capabilities' })
    .then((response) => {
      if (typeof response?.data?.passwordResetAvailable !== 'boolean') {
        throw new Error(
          'The server returned an invalid authentication capability.',
        );
      }
      const value = {
        passwordResetAvailable: response.data.passwordResetAvailable,
      };
      state.cached = { value, expiresAt: Date.now() + 60_000 };
      return value;
    })
    .finally(() => {
      state.request = undefined;
    });
  return state.request;
}

/** Reads and briefly caches the server's password-reset policy. */
export function usePasswordResetCapability(): PasswordResetCapabilityQuery {
  const api = useApiClient();
  const [state, setState] = useState<{
    readonly data?: PasswordResetCapability;
    readonly isPending: boolean;
    readonly isError: boolean;
  }>(() => {
    const cached = hostState.get(api)?.cached;
    return {
      data: cached && cached.expiresAt > Date.now() ? cached.value : undefined,
      isPending: !cached || cached.expiresAt <= Date.now(),
      isError: false,
    };
  });

  useEffect(() => {
    let active = true;
    void requestCapability(api).then(
      (data) => {
        if (active) setState({ data, isPending: false, isError: false });
      },
      () => {
        if (active)
          setState((current) => ({
            ...current,
            isPending: false,
            isError: true,
          }));
      },
    );
    return () => {
      active = false;
    };
  }, [api]);

  const refetch = useCallback(async (): Promise<void> => {
    setState((current) => ({ ...current, isPending: true, isError: false }));
    try {
      const data = await requestCapability(api, true);
      setState({ data, isPending: false, isError: false });
    } catch {
      setState((current) => ({ ...current, isPending: false, isError: true }));
    }
  }, [api]);

  return {
    data: state.data,
    isPending: state.isPending,
    isError: state.isError,
    refetch,
  };
}
