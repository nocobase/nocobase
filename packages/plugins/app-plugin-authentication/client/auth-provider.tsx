/* eslint-disable react-refresh/only-export-components, react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps, react-hooks/set-state-in-effect, @eslint-react/use-state */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import {
  realtimeClientToken,
  useClientApplication,
  useService,
} from '@nocobase/app-client';
import { Navigate, useLocation } from 'react-router';
import { authenticationClientToken } from './tokens.js';
import type { AuthClient } from './auth-client.js';

export interface AuthenticationContextValue {
  readonly client: AuthClient;
  readonly session: AuthClient['$Infer']['Session'] | null;
  readonly isPending: boolean;
  readonly refresh: () => Promise<void>;
  /** First realtime identity preparation; independent of the session query. */
  readonly preparation: 'preparing' | 'ready' | 'failed';
  readonly retryPreparation: () => void;
}

const PREPARATION_TIMEOUT_MS = 10_000;
const AuthenticationContext = createContext<
  AuthenticationContextValue | undefined
>(undefined);
export function AuthenticationProvider({
  children,
}: PropsWithChildren): ReactElement {
  const client = useService(authenticationClientToken) as AuthClient;
  const [session, setSession] =
    useState<AuthenticationContextValue['session']>(null);
  const [isPending, setPendingState] = useState(true);
  const refreshAttemptRef = useRef(0);
  const refresh = async (): Promise<void> => {
    const attempt = ++refreshAttemptRef.current;
    setPendingState(true);
    try {
      const result = await client.getSession();
      if (attempt === refreshAttemptRef.current) setSession(result.data);
    } finally {
      if (attempt === refreshAttemptRef.current) setPendingState(false);
    }
  };
  useEffect(() => {
    void refresh();
    return () => {
      refreshAttemptRef.current += 1;
    };
  }, [client]);
  const services = useClientApplication().services;
  const sessionKey = JSON.stringify([
    session?.user.id ?? null,
    session?.session.id ?? null,
  ]);
  const signedIn = session !== null;
  const [retry, setRetry] = useState(0);
  const retryPreparation = useCallback(
    (): void => setRetry((value) => value + 1),
    [],
  );
  const [prepared, setPrepared] = useState<{
    sessionKey: string;
    retry: number;
    status: AuthenticationContextValue['preparation'];
  }>();
  const previousSessionRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (isPending) return;
    const realtime = services.has(realtimeClientToken)
      ? services.resolveIfCreated(realtimeClientToken)
      : undefined;
    const changed = previousSessionRef.current !== sessionKey;
    const hadSession = previousSessionRef.current !== undefined;
    previousSessionRef.current = sessionKey;
    if (!signedIn) {
      // Sign-out must also remove the identity from an existing connection.
      if (changed && hadSession) realtime?.reconnect();
      return;
    }
    if (
      !changed &&
      prepared?.sessionKey === sessionKey &&
      prepared.retry === retry &&
      prepared.status === 'ready'
    )
      return;
    const publish = (
      status: AuthenticationContextValue['preparation'],
    ): void => {
      // Preparation is an external connection lifecycle, independent of rendering.
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPrepared({ sessionKey, retry, status });
    };
    if (!realtime?.active) {
      publish('ready');
      return;
    }
    let cancelled = false;
    publish('preparing');
    const unsubscribe = realtime.onOpen(() => {
      // Let connection callbacks finish before rendering signed-in providers.
      // Permission snapshots wait for their own topic acknowledgements.
      queueMicrotask(() => {
        if (cancelled) return;
        cancelled = true;
        clearTimeout(timer);
        unsubscribe();
        publish('ready');
      });
    });
    const timer = setTimeout(() => {
      cancelled = true;
      unsubscribe();
      publish('failed');
    }, PREPARATION_TIMEOUT_MS);
    // Even cookie startup reconnects: connected alone does not prove identity.
    realtime.reconnect();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [isPending, sessionKey, signedIn, services, retry]);
  const preparation = !signedIn
    ? 'ready'
    : !isPending &&
        prepared?.sessionKey === sessionKey &&
        prepared.retry === retry
      ? prepared.status
      : 'preparing';
  return (
    <AuthenticationContext.Provider
      value={{
        client,
        session,
        isPending,
        refresh,
        preparation,
        retryPreparation,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
export function useAuthentication(): AuthenticationContextValue {
  const value = useContext(AuthenticationContext);
  if (!value) throw new Error('AuthenticationProvider is not mounted.');
  return value;
}
export function useAuthenticationClient(): AuthClient {
  return useAuthentication().client;
}
export default AuthenticationProvider;

/**
 * Where a guest page sends a person once they are signed in: the path in its `redirect` search parameter, such as
 * `/login?redirect=%2Fdevice%3Fuser_code%3DWDJB-MJHT`, when it names a path in this application, and `/` otherwise.
 */
function signedInDestination(search: string): string {
  const target = new URLSearchParams(search).get('redirect');
  return target?.startsWith('/') &&
    !target.startsWith('//') &&
    !target.startsWith('/\\')
    ? target
    : '/';
}

export function AuthenticationGuard({
  mode,
  children,
}: PropsWithChildren<{ mode: 'required' | 'guest' }>): ReactElement | null {
  const { session, isPending } = useAuthentication();
  const { search } = useLocation();

  if (isPending) return null;
  if (mode === 'required' && !session) {
    return <Navigate to='/login' replace />;
  }
  if (mode === 'guest' && session) {
    return <Navigate to={signedInDestination(search)} replace />;
  }
  return <>{children}</>;
}

export function RequiredAuthentication({
  children,
}: PropsWithChildren): ReactElement | null {
  return <AuthenticationGuard mode='required'>{children}</AuthenticationGuard>;
}

export function GuestAuthentication({
  children,
}: PropsWithChildren): ReactElement | null {
  return <AuthenticationGuard mode='guest'>{children}</AuthenticationGuard>;
}
