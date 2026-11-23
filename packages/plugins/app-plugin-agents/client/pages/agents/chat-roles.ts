/** The roles an agent's chat may be limited to (`GET /api/agents/chatRoles`), and how one reads. */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { ChatRole } from '../../../shared/agents.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';

export function useChatRoles(): UseQueryResult<ChatRole[]> {
  const api = useAgentsApi();
  return useQuery({
    queryKey: agentsKeys.chatRoles,
    queryFn: () => api.chatRoles(),
    staleTime: 60_000,
  });
}

/** A role's title in the viewer's language, else its key; a key no role has any more reads as itself. */
export function useRoleTitle(
  roles: readonly ChatRole[] | undefined,
): (key: string) => string {
  const { t } = useTranslation();
  return useCallback(
    (key: string) => {
      const title = roles?.find((role) => role.key === key)?.title;
      if (!title) return key;
      return typeof title === 'string'
        ? title
        : t(title.key, { ns: title.ns, defaultValue: key });
    },
    [roles, t],
  );
}
