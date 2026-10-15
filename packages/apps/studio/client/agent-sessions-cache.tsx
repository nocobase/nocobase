import { AgentSessionsProvider } from '@nocobase/app-plugin-agent-sessions/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { type PropsWithChildren } from 'react';

export function AgentSessionsApplication({ children }: PropsWithChildren) {
  const { session } = useAuthentication();
  return (
    <AgentSessionsProvider owner={session?.user.id ?? null}>
      {children}
    </AgentSessionsProvider>
  );
}
