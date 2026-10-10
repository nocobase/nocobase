import type { Translate } from '@nocobase/app-plugin-agents/client/chat';

import {
  DELEGATION_EVENTS,
  type DelegationEvent,
} from '../../../shared/delegations.js';

/** The milestone a delegation's news names, or null for one this version does not know. */
export function eventOf(value: string | undefined): DelegationEvent | null {
  return DELEGATION_EVENTS.find((event) => event === value) ?? null;
}

/** The card's headline in the reader's language. */
export function delegationHeadline(
  t: Translate,
  event: DelegationEvent,
  params: Readonly<Record<string, string>>,
): string {
  const { agentNameKey: key, agentNameNs: ns } = params;
  const agent = params.agentName ?? '';
  return t(`studioAgents.delegation.events.${event}`, {
    identifier: params.identifier ?? '',
    agent: key && ns ? t(key, { ns, defaultValue: agent }) : agent,
    status: params.status ?? '',
  });
}
