import {
  agentsQueryClient,
  CHAT_PANEL_STORAGE_KEY,
  ChatProvider,
} from '@nocobase/app-plugin-agents/client/chat';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useLayoutEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

/** The application offers one chat controller per authenticated identity, never per page. */
export function OnlineAgentProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const { session, isPending } = useAuthentication();
  const userId = isPending ? null : session?.user.id;
  return userId ? (
    <IdentityChat key={userId} userId={userId}>
      {children}
    </IdentityChat>
  ) : (
    <>{children}</>
  );
}

function IdentityChat({
  userId,
  children,
}: {
  readonly userId: string;
  readonly children: ReactNode;
}): ReactElement | null {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    // The SDK's panel key and cache are not user-scoped. Clear them BEFORE its provider reads storage or mounts queries.
    // Reload deliberately starts closed/new; history remains on the server. Do not introduce a second persisted format.
    const reset = () => {
      try {
        window.sessionStorage.removeItem(CHAT_PANEL_STORAGE_KEY);
      } catch {
        /* Storage may be unavailable. */
      }
      agentsQueryClient().clear();
    };
    reset();
    let active = true;
    // Let the previous identity's passive controller cleanup finish before mounting the next one.
    queueMicrotask(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
      reset();
    };
  }, []);
  return ready ? (
    <ChatProvider
      memoryScope={userId}
      conversationPath={(id) => `/chat/${encodeURIComponent(id)}`}
    >
      {children}
    </ChatProvider>
  ) : null;
}
