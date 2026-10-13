/* eslint-disable react-refresh/only-export-components, @eslint-react/no-unnecessary-use-prefix -- a module stub mirrors the real module's exports and their names */
/**
 * Stands in for the agents plugin's chat entry in the shell tests (`vi.mock` of `@nocobase/app-plugin-agents/client/chat`
 * and of `client/agents/chat.js`): the chat needs the application's API, realtime and query cache, which those tests do
 * not provide. The panel says it is not available, so the agent-chat block's panel and launchers render nothing; the
 * block is tested in the UI Library.
 */
import type { AppClientRoutePageDefinition } from '@nocobase/app-client/plugins';
import type { ReactNode } from 'react';

export function StudioChat({
  children,
}: {
  readonly children?: ReactNode;
}): ReactNode {
  return children;
}

export function useChatPanel(): { readonly available: false; open: false } {
  return { available: false, open: false };
}

export function chatLinkRoutes(): readonly AppClientRoutePageDefinition[] {
  return [];
}
