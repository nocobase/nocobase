import type { ApiClient } from '@nocobase/app-client';
import { aiPath, requestAI } from './api-client.js';

export interface ManagedToolSummary {
  name: string;
  i18n?: { namespace: string };
  title: string;
  description: string;
  about: string;
  scope: string;
  source: string;
  defaultPermission: string;
}

export interface ManagedToolDetail extends ManagedToolSummary {
  inputSchema: Record<string, unknown> | null;
}

export function listManagedTools(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<ManagedToolSummary[]> {
  return requestAI(api, aiPath('aiEmployee', 'tools'), { signal });
}

export function getManagedToolDetails(
  api: ApiClient,
  name: string,
  signal?: AbortSignal,
): Promise<ManagedToolDetail> {
  return requestAI(api, aiPath('aiEmployee', 'tools', name), { signal });
}
