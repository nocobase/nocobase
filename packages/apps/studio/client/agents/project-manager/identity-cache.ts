import { agentsQueryClient } from '@nocobase/app-plugin-agents/client/chat';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { pmKeys } from '@nocobase/app-plugin-projects/client/kit';
import type { QueryClient } from '@tanstack/react-query';

/** Refetch existing views, including completed runs, through their original authorization boundaries. */
export async function refreshManagerIdentity(
  client: QueryClient,
): Promise<void> {
  await Promise.all([
    agentsQueryClient().invalidateQueries({ queryKey: ['agents'] }),
    client.invalidateQueries({ queryKey: pmKeys.all }),
    client.invalidateQueries({ queryKey: inboxKeys.all }),
    client.invalidateQueries({ queryKey: ['studio'] }),
  ]);
}
