/** Data access, hooks and small building blocks for application-owned Agent pages. */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import type { ChatAgent } from '../shared/conversations.js';
import { RUNNERS_TOPIC } from '../shared/realtime.js';
import { agentsKeys } from './api/keys.js';
import { coalescedInvalidation } from './chat/coalesced-invalidation.js';
import { useAgentsApi } from './hooks/use-agents-api.js';
import { useQuotaExpiry } from './hooks/use-quota-expiry.js';
import { useRealtimeTopic } from './hooks/use-realtime-topic.js';
import { useAgentText } from './hooks/use-vocabulary.js';
import { pickerAgentOf } from './lib/agents.js';
import { agentsQueryClient } from './query.js';

export type { QuotaMarkTarget } from '../shared/quota.js';
export type { AgentsApi } from './api/client.js';
export { agentsKeys } from './api/keys.js';
export {
  AgentAvatar,
  type AgentAvatarSize,
} from './components/agent-avatar.js';
export {
  AgentQuotaHint,
  QuotaLabel,
  QuotaQueueHint,
} from './components/quota-status.js';
export { useAgentsApi } from './hooks/use-agents-api.js';
export { useQuotaClock, useQuotaExpiry } from './hooks/use-quota-expiry.js';
export { useServerUrl } from './hooks/use-server-url.js';
export {
  useAgentText,
  useText,
  useVocabulary,
  type AgentText,
} from './hooks/use-vocabulary.js';
export {
  compactDateTime,
  durationText,
  quotaWindowLabel,
  useFormatters,
  type Formatters,
} from './lib/format.js';
export {
  guessSystem,
  installCommand,
  INSTALL_SYSTEMS,
  upgradeCommand,
  type InstallSystem,
} from './lib/install.js';
export { noCodingToolsFound } from './lib/runner-tools.js';
export { valueTooLong } from './lib/text.js';
export {
  readToolSlots,
  toolSlotsDraft,
  toolsOverTotal,
  type ToolSlotsDraft,
} from './lib/tool-slots.js';
export { modelSuggestion } from './model-suggestion.js';
export { agentsQueryClient } from './query.js';

export interface PickerOption {
  readonly value: string;
  readonly label: string;
  /** Such as `darwin/arm64 · online`. */
  readonly description?: string;
}

export interface RunnerOptions {
  readonly options: readonly PickerOption[];
  readonly loading: boolean;
  /** How many of them are online now, able to take work. */
  readonly online: number;
}

/** An agent as a picker offers it. */
export type AgentPickerOption = PickerOption;

export interface AgentOptions {
  readonly options: readonly AgentPickerOption[];
  /** The same agents as the agent picker takes them, with their availability. */
  readonly agents: readonly ChatAgent[];
  readonly loading: boolean;
  /** The viewer may not list agents. */
  readonly failed: boolean;
  /** An agent's name, or null when the viewer cannot see it. */
  nameOf(agentId: string): string | null;
}

/** The runners the viewer may see, as picker options. A hook: reads this plugin's cache from any tree. */
export function useRunnerOptions(): RunnerOptions {
  const api = useAgentsApi();
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const runners = useQuery(
    {
      queryKey: agentsKeys.runners,
      queryFn: () => api.runners(),
    },
    agentsQueryClient(),
  );
  return {
    loading: runners.isPending,
    online: (runners.data ?? []).filter((runner) => runner.status === 'online')
      .length,
    options: (runners.data ?? [])
      .filter((runner) => runner.status !== 'revoked')
      .map((runner) => ({
        value: runner.id,
        label: runner.name,
        description: [
          `${runner.os}/${runner.arch}`,
          t(`runtimes.status.${runner.status}`),
        ]
          .filter(Boolean)
          .join(' · '),
      })),
  };
}

/** The enabled agents, as picker options. A hook for any tree. */
export function useAgentOptions(): AgentOptions {
  const text = useAgentText();
  const api = useAgentsApi();
  const agents = useQuery(
    {
      queryKey: agentsKeys.agents,
      queryFn: () => api.agents(),
      staleTime: 30_000,
    },
    agentsQueryClient(),
  );
  const list = agents.data ?? [];
  useQuotaExpiry(list);
  const offered = list.filter((agent) => agent.status === 'enabled');
  return {
    loading: agents.isPending,
    failed: agents.isError,
    agents: offered.map((agent) => pickerAgentOf(agent, text.name(agent))),
    options: offered.map((agent) => ({
      value: agent.id,
      label: text.name(agent),
      description: text.description(agent) ?? undefined,
    })),
    nameOf: (agentId) => {
      const agent = list.find((item) => item.id === agentId);
      return agent ? text.name(agent) : null;
    },
  };
}

const candidateRefreshes = new WeakMap<
  QueryClient,
  Map<
    string,
    { refs: number; refresh: ReturnType<typeof coalescedInvalidation> }
  >
>();

/** One candidate, including an application's system agent, using the viewer-scoped detail API. */
export function useAgentOption(agentId: string): ChatAgent | null {
  const api = useAgentsApi();
  const text = useAgentText();
  const cache = agentsQueryClient();
  useEffect(() => {
    let entries = candidateRefreshes.get(cache);
    if (!entries) {
      entries = new Map<
        string,
        { refs: number; refresh: ReturnType<typeof coalescedInvalidation> }
      >();
      candidateRefreshes.set(cache, entries);
    }
    let entry = entries.get(agentId);
    if (!entry) {
      entry = { refs: 0, refresh: coalescedInvalidation(cache) };
      entries.set(agentId, entry);
    }
    entry.refs += 1;
    return () => {
      if (--entry.refs === 0) {
        entry.refresh.stop();
        entries.delete(agentId);
      }
    };
  }, [cache, agentId]);
  const ready = useRealtimeTopic(
    RUNNERS_TOPIC,
    () => {
      candidateRefreshes
        .get(cache)
        ?.get(agentId)
        ?.refresh.add(agentsKeys.agent(agentId));
    },
    true,
  );
  const result = useQuery(
    {
      queryKey: agentsKeys.agent(agentId),
      enabled: ready,
      queryFn: () => api.agent(agentId),
      staleTime: 60_000,
    },
    cache,
  );
  useQuotaExpiry(result.data ? [result.data] : []);
  return result.data
    ? pickerAgentOf(result.data, text.name(result.data))
    : null;
}
