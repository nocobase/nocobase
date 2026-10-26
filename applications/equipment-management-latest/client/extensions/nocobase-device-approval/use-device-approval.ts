import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Where an approval stands: `checking` the code, `ready` to decide, `approving` or `denying`, decided (`approved`,
 * `denied`), or a code that cannot be decided here: `expired`, `invalid`, `notYours` (another account claimed it), or
 * an `error` worth retrying. `idle` means there is no code yet.
 */
export type DeviceApprovalStatus =
  | 'idle'
  | 'checking'
  | 'ready'
  | 'approving'
  | 'denying'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'invalid'
  | 'notYours'
  | 'error';

export interface DeviceApprovalState {
  readonly status: DeviceApprovalStatus;
  /** The client that asked, such as `acme`, once the code is claimed for the signed-in person. */
  readonly clientId?: string;
  readonly approve: () => Promise<void>;
  readonly deny: () => Promise<void>;
  /** Checks the code again, after an `error`. */
  readonly retry: () => void;
}

interface Verification {
  readonly status?: string;
  readonly client_id?: string;
}

interface FetchResult {
  readonly data: unknown;
  readonly error: unknown;
}

/** `abcd2345` as `ABCD-2345`: upper case, and an eight-character code in two groups of four. */
export function formatUserCode(userCode: string): string {
  const normalized = userCode.replace(/[^a-z0-9]/giu, '').toUpperCase();
  return normalized.length === 8
    ? `${normalized.slice(0, 4)}-${normalized.slice(4)}`
    : normalized;
}

/** The status a failed device request means, read from Better Auth's `{ error, error_description }` body. */
export function deviceErrorStatus(error: unknown): DeviceApprovalStatus {
  const body =
    typeof error === 'object' && error !== null
      ? (error as Record<string, unknown>)
      : {};
  const code =
    typeof body.error === 'string'
      ? body.error
      : typeof body.code === 'string'
        ? body.code
        : '';
  switch (code.toLowerCase()) {
    case 'expired_token':
      return 'expired';
    case 'invalid_request':
    case 'invalid_user_code':
      return 'invalid';
    case 'access_denied':
      return 'notYours';
    default:
      return 'error';
  }
}

/**
 * Drives one device authorization through Better Auth's `deviceAuthorization()` endpoints with the signed-in person's
 * session: `GET /device` checks the code and claims it for this person, which Better Auth requires before the code can
 * be approved or denied, then `POST /device/approve` or `/device/deny` decides it. The check runs once per code, since
 * Better Auth rate-limits it, and never polls.
 */
export function useDeviceApproval(
  userCode: string | undefined,
): DeviceApprovalState {
  const { client } = useAuthentication();
  const code = userCode?.trim() ?? '';
  const [attempt, setAttempt] = useState(0);
  // Which check the state answers: a new code or a retry is being checked until its answer arrives.
  const key = `${code}#${attempt}`;
  const [state, setState] = useState<{
    key: string;
    status: DeviceApprovalStatus;
    clientId?: string;
  }>({ key: '', status: 'idle' });
  const checkedRef = useRef<string | null>(null);

  const request = useCallback(
    (path: string, init: Record<string, unknown>): Promise<FetchResult> =>
      client.$fetch(path, init),
    [client],
  );

  useEffect(() => {
    // Once per code: StrictMode runs effects twice, and the endpoint counts every call against its rate limit.
    if (code === '' || checkedRef.current === key) return;
    checkedRef.current = key;
    void request('/device', {
      method: 'GET',
      query: { user_code: code },
    }).then(
      ({ data, error }) => {
        if (checkedRef.current !== key) return;
        if (error) {
          setState({ key, status: deviceErrorStatus(error) });
          return;
        }
        const verification = (data ?? {}) as Verification;
        // Better Auth names the client only to the person the code is claimed for.
        if (verification.client_id === undefined) {
          setState({
            key,
            status: verification.status === 'pending' ? 'notYours' : 'invalid',
          });
          return;
        }
        setState({
          key,
          clientId: verification.client_id,
          status:
            verification.status === 'approved'
              ? 'approved'
              : verification.status === 'denied'
                ? 'denied'
                : 'ready',
        });
      },
      () => {
        if (checkedRef.current === key) setState({ key, status: 'error' });
      },
    );
  }, [code, key, request]);

  const decide = useCallback(
    async (decision: 'approve' | 'deny'): Promise<void> => {
      setState((current) => ({
        ...current,
        status: decision === 'approve' ? 'approving' : 'denying',
      }));
      try {
        const { error } = await request(`/device/${decision}`, {
          method: 'POST',
          body: { userCode: code },
        });
        setState((current) => ({
          ...current,
          status: error
            ? deviceErrorStatus(error)
            : decision === 'approve'
              ? 'approved'
              : 'denied',
        }));
      } catch {
        setState((current) => ({ ...current, status: 'error' }));
      }
    },
    [code, request],
  );

  const current = state.key === key ? state : undefined;
  return {
    status: code === '' ? 'idle' : (current?.status ?? 'checking'),
    ...(current?.clientId === undefined ? {} : { clientId: current.clientId }),
    approve: () => decide('approve'),
    deny: () => decide('deny'),
    retry: () => setAttempt((value) => value + 1),
  };
}
