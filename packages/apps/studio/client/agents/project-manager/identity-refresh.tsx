/** Name changes invalidate views in this tab and the other connected tabs; every refetch keeps its own authorization. */
import { useRealtimeTopic } from '@nocobase/app-plugin-agents/client/runs';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { PROJECT_MANAGER_IDENTITY_TOPIC } from '../../../shared/project-manager.js';

import { refreshManagerIdentity } from './identity-cache.js';

export function ProjectManagerIdentityRefresh({
  children,
}: {
  readonly children?: ReactNode;
}): ReactNode {
  const client = useQueryClient();
  useRealtimeTopic(PROJECT_MANAGER_IDENTITY_TOPIC, () => {
    void refreshManagerIdentity(client);
  });
  return children;
}
