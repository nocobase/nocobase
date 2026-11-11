import { useService } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  Fragment,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { authorizationClientToken } from './tokens.js';

export function AuthorizationProvider({
  children,
}: PropsWithChildren): ReactElement | null {
  const authz = useService(authorizationClientToken);
  const { session, isPending } = useAuthentication();
  const [hasResolved, setHasResolved] = useState(false);
  useEffect(() => {
    // Keep anonymous forms mounted across refreshes; initial loads and signed-in refreshes stay gated.
    // eslint-disable-next-line react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect
    if (!isPending) setHasResolved(true);
  }, [isPending]);
  const sessionKey = JSON.stringify([
    session?.user.id ?? null,
    session?.session.id ?? null,
  ]);
  const [prepared, setPrepared] = useState<{
    client: typeof authz;
    sessionKey: string;
  }>();

  useEffect(() => {
    authz.resetSession();
    // Children must not check permissions until the previous session is cleared.
    // eslint-disable-next-line react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect
    setPrepared({ client: authz, sessionKey });
  }, [authz, sessionKey]);

  if (
    (isPending && (session !== null || !hasResolved)) ||
    prepared?.client !== authz ||
    prepared.sessionKey !== sessionKey
  ) {
    return null;
  }

  // Page state and query caches belong to one session.
  return <Fragment key={sessionKey}>{children}</Fragment>;
}
