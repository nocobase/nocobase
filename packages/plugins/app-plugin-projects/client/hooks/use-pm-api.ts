import { useApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

import { PmApi } from '../api/client.js';

/** The typed `/api/projects` client over the application's API client. */
export function usePmApi(): PmApi {
  const api = useApiClient();
  return useMemo(() => new PmApi(api), [api]);
}
