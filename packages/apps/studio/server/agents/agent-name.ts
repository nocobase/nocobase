/**
 * A built-in agent's name as a notice or plan carries it: its i18n key and namespace beside the English name, as
 * strings (a notice keeps only strings), so the inbox words the name in the reader's language
 * (`client/inbox/contributions/projects-wording.ts`). Nothing for an agent people named.
 */
import type { I18nText } from '@nocobase/app-plugin-agents/shared/i18n';

export interface AgentNameParams {
  readonly agentNameKey?: string;
  readonly agentNameNs?: string;
}

export function agentNameParams(
  nameText: I18nText | null | undefined,
): AgentNameParams {
  return nameText
    ? { agentNameKey: nameText.key, agentNameNs: nameText.ns }
    : {};
}
