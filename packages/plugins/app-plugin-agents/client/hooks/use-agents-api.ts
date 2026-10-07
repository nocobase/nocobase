import { useApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

import { AgentsApi } from '../api/client.js';

/** The typed `/api/agents/admin` client over the application's API client. */
export function useAgentsApi(): AgentsApi {
  const api = useApiClient();
  return useMemo(() => new AgentsApi(api), [api]);
}
