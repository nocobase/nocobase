/* eslint-disable react-refresh/only-export-components, react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps, react-hooks/set-state-in-effect, @eslint-react/use-state */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { useService } from '@nocobase/app-client';
import { Navigate, useLocation } from 'react-router';
import { authenticationClientToken } from './tokens.js';
import type { AuthClient } from './auth-client.js';

export interface AuthenticationContextValue {
  readonly client: AuthClient;
  readonly session: AuthClient['$Infer']['Session'] | null;
  readonly isPending: boolean;
  readonly refresh: () => Promise<void>;
}
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
  const refresh = async (): Promise<void> => {
    setPendingState(true);
    try {
      setSession((await client.getSession()).data);
    } finally {
      setPendingState(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, [client]);
  return (
    <AuthenticationContext.Provider
      value={{ client, session, isPending, refresh }}
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
