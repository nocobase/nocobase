import type { ApiClient } from '@nocobase/app-client';
import { aiPath, requestAI } from './api-client.js';

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
  about: string;
  scope: string;
  source: string;
  tools: ManagedSkillTool[];
}

export interface ManagedSkillDetail extends ManagedSkillSummary {
  content: string;
}

export function listManagedSkills(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<ManagedSkillSummary[]> {
  return requestAI(api, aiPath('aiEmployee', 'skills'), { signal });
}

export function getManagedSkillDetails(
  api: ApiClient,
  name: string,
  signal?: AbortSignal,
): Promise<ManagedSkillDetail> {
  return requestAI(api, aiPath('aiEmployee', 'skills', name), { signal });
}
