import type { ApiClient } from '@nocobase/app-client';
import { requestAIAction } from './api-client.js';

export interface ManagedToolSummary {
  name: string;
  i18n?: { namespace: string };
  title: string;
  description: string;
  about: string;
  scope: string;
  source: string;
}

export interface ManagedToolDetail extends ManagedToolSummary {
  inputSchema: Record<string, unknown> | null;
}

export async function listManagedTools(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<ManagedToolSummary[]> {
  const result = await requestAIAction<{ rows: ManagedToolSummary[] }>(
    api,
    'aiTools',
    'listAll',
    { signal },
  );
  return result.rows;
}

export function getManagedToolDetails(
  api: ApiClient,
  name: string,
  signal?: AbortSignal,
): Promise<ManagedToolDetail> {
  return requestAIAction(api, 'aiTools', 'getDetails', {
    query: { name },
    signal,
  });
}
