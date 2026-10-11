import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';

/** Refetches the inbox once a proposal is decided in the knowledge view, so its count and cards settle at once. */
export function useRefreshInbox(): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
  }, [queryClient]);
}
