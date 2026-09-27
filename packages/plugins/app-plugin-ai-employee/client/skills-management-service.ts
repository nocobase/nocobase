import type { ApiClient } from '@nocobase/app-client';
import { requestAIAction } from './api-client.js';

export interface ManagedSkillTool {
  name: string;
  i18n?: { namespace: string };
  title: string;
  description: string;
  about: string;
  available: boolean;
}

export interface ManagedSkillSummary {
  name: string;
  i18n?: { namespace: string };
  title: string;
  description: string;
  tools: ManagedSkillTool[];
}

export interface ManagedSkillDetail extends ManagedSkillSummary {
  content: string;
}

export async function listManagedSkills(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<ManagedSkillSummary[]> {
  const result = await requestAIAction<{ rows: ManagedSkillSummary[] }>(
    api,
    'aiSkills',
    'listAll',
    { signal },
  );
  return result.rows;
}

export function getManagedSkillDetails(
  api: ApiClient,
  name: string,
  signal?: AbortSignal,
): Promise<ManagedSkillDetail> {
  return requestAIAction(api, 'aiSkills', 'getDetails', {
    query: { name },
    signal,
  });
}
