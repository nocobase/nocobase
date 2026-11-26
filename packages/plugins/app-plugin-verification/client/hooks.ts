import {
  ApiClientError,
  useApiClient,
  type ApiClient,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  isServer,
  skipToken,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import type {
  CodeTiming,
  IssueStepUpTokenInput,
  PhoneView,
  SendVerificationCodeInput,
  StepUpCredential,
} from '../shared/contracts.js';
import {
  bindPhone,
  getMyVerifiedPhone,
  issueStepUpToken,
  sendVerificationCode,
  type BindVerifiedPhoneInput,
} from './api.js';

function useSessionKey(): string | null {
  const { session, isPending } = useAuthentication();
  return isPending || !session
    ? null
    : JSON.stringify([session.user.id, session.session.id]);
}

function phoneKey(
  sessionKey: string | null,
): readonly ['verification', 'myPhone', string | null] {
  return ['verification', 'myPhone', sessionKey];
}

export function useMyVerifiedPhone(): UseQueryResult<PhoneView, Error> {
  const api = useApiClient();
  const sessionKey = useSessionKey();
  const queryKey = phoneKey(sessionKey);
  const queryClient = useQueryClient();
  const { retry = isServer ? 0 : 3 } = queryClient.defaultQueryOptions({
    queryKey,
  });
  return useQuery({
    queryKey,
    queryFn:
      sessionKey === null
        ? skipToken
        : ({ signal }) => getMyVerifiedPhone(api, signal),
    retry(failureCount, error) {
      if (
        error instanceof ApiClientError &&
        error.status >= 400 &&
        error.status < 500
      )
        return false;
      if (typeof retry === 'function') return retry(failureCount, error);
      return typeof retry === 'number' ? failureCount < retry : retry;
    },
    // The application's default placeholder would display the former account's result.
    placeholderData: undefined,
    // Also discard inactive phone data in hosts that keep their query client across sessions.
    gcTime: 0,
  });
}

export interface VerificationAction<Input, Result> {
  readonly isPending: boolean;
  readonly isSuccess: boolean;
  readonly error: unknown;
  /** Submit once and return the result. Rejects with the original request error. */
  submit(input: Input): Promise<Result>;
  /** Clear local status. An outstanding request may still complete on the server. */
  reset(): void;
}

interface ActionState {
  readonly scope: object;
  readonly status: 'idle' | 'pending' | 'success' | 'error';
  readonly error?: unknown;
}

// As in the authentication actions, keep request status local to the mounted hook.
// Codes and credentials travel only through the request and the caller's promise.
function useVerificationAction<Input, Result>(
  execute: (
    api: ApiClient,
    input: Input,
    sessionKey: string | null,
  ) => Promise<Result>,
): VerificationAction<Input, Result> {
  const api = useApiClient();
  const sessionKey = useSessionKey();
  const scope = useMemo(() => ({ api, sessionKey }), [api, sessionKey]);
  const [state, setState] = useState<ActionState>({ scope, status: 'idle' });
  if (state.scope !== scope) setState({ scope, status: 'idle' });

  return {
    isPending: state.status === 'pending',
    isSuccess: state.status === 'success',
    error: state.error,
    async submit(input) {
      const attempt: ActionState = { scope, status: 'pending' };
      setState(attempt);
      try {
        const result = await execute(api, input, sessionKey);
        setState((current) =>
          current === attempt ? { scope, status: 'success' } : current,
        );
        return result;
      } catch (error) {
        setState((current) =>
          current === attempt ? { scope, status: 'error', error } : current,
        );
        throw error;
      }
    },
    reset: () => setState({ scope, status: 'idle' }),
  };
}

export function useSendVerificationCode(): VerificationAction<
  SendVerificationCodeInput,
  CodeTiming
> {
  return useVerificationAction(sendVerificationCode);
}

export function useIssueStepUpToken(): VerificationAction<
  IssueStepUpTokenInput,
  StepUpCredential
> {
  return useVerificationAction(issueStepUpToken);
}

export function useBindPhone(): VerificationAction<
  BindVerifiedPhoneInput,
  PhoneView
> {
  const queryClient = useQueryClient();
  return useVerificationAction(async (api, input, sessionKey) => {
    const phone = await bindPhone(api, input);
    if (sessionKey !== null) {
      const filters = { queryKey: phoneKey(sessionKey), exact: true };
      // A read started before the write may have seen the previous binding.
      await queryClient.cancelQueries(filters);
      void queryClient.invalidateQueries(filters);
    }
    return phone;
  });
}
