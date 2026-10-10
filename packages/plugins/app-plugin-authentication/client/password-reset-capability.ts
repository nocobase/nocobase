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

let cachedCapability:
  | { readonly value: PasswordResetCapability; readonly expiresAt: number }
  | undefined;
let capabilityRequest: Promise<PasswordResetCapability> | undefined;

async function requestCapability(
  api: ApiClient,
  refresh = false,
): Promise<PasswordResetCapability> {
  if (refresh) cachedCapability = undefined;
  if (cachedCapability && cachedCapability.expiresAt > Date.now())
    return cachedCapability.value;
  capabilityRequest ??= api
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
      cachedCapability = { value, expiresAt: Date.now() + 60_000 };
      return value;
    })
    .finally(() => {
      capabilityRequest = undefined;
    });
  return capabilityRequest;
}

/** Reads and briefly caches the server's password-reset policy. */
export function usePasswordResetCapability(): PasswordResetCapabilityQuery {
  const api = useApiClient();
  const [state, setState] = useState<{
    readonly data?: PasswordResetCapability;
    readonly isPending: boolean;
    readonly isError: boolean;
  }>(() => ({
    data:
      cachedCapability && cachedCapability.expiresAt > Date.now()
        ? cachedCapability.value
        : undefined,
    isPending: !cachedCapability || cachedCapability.expiresAt <= Date.now(),
    isError: false,
  }));

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
