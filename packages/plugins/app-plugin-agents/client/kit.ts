/**
 * What the agents plugin offers the application's own pages (for example, in `client/agents/`):
 *
 * - `VariablesSection`: the variables and secrets of a scope (`workdir`, or a scope the application registers on the
 *   server), write-only and audited as on an agent;
 * - `ScopedVariablesSection`: the same for several scopes in one table with a Scope column (a project and its working
 *   directories), adding a variable choosing its scope;
 * - `DefaultSkillsSection`: the skills every run in that scope gets;
 * - `useRunnerOptions`: the runners a directory used in place may be on, for a runner picker;
 * - `useAgentOptions`: the agents the viewer may see, for an agent picker, with their names and types (Online or Runner),
 *   optionally only one type (an issue's executor is a runner agent), and as `ChatAgent`s for the UI Library's
 *   `AgentPicker`;
 * - `AgentAvatar`: an agent's generated avatar, the same on the application's pages as on this plugin's;
 * - `useAgentText`: an agent's name and description in the viewer's language, for agents the application's own API
 *   returns with their `nameText` and `descriptionText`.
 *
 * Each component brings this plugin's translations and query cache; the hooks read that cache from any tree.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { createElement, type ComponentType, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import type { AgentType } from '../shared/agents.js';
import type { ChatAgent } from '../shared/conversations.js';
import { agentsKeys } from './api/keys.js';
import { DefaultSkillsPanel } from './components/default-skills.js';
import {
  VariablesPanel,
  type VariableScopeOption,
} from './components/variables/variables-panel.js';
import { useAgentsApi } from './hooks/use-agents-api.js';
import { useAgentText } from './hooks/use-vocabulary.js';
import { pickerAgentOf } from './lib/agents.js';
import { agentsQueryClient, withAgents } from './query.js';

export {
  AgentAvatar,
  type AgentAvatarSize,
} from './components/agent-avatar.js';
export { useAgentText, type AgentText } from './hooks/use-vocabulary.js';
export { useFormatters, type Formatters } from './lib/format.js';

export interface ScopeSectionProps {
  /** `workdir`, or a scope key the application registered. */
  readonly scope: string;
  readonly scopeId: string;
  /** Whether the viewer may change it (the scope's kind decides on the server as well). */
  readonly canEdit: boolean;
  /** What the section says the values are for, in the viewer's language; a general line when absent. */
  readonly description?: string;
}

export type { VariableScopeOption };

export interface ScopedVariablesSectionProps {
  /** The scopes listed, the broadest first; each named in the Scope column. */
  readonly scopes: readonly VariableScopeOption[];
  readonly canEdit: boolean;
  /** What the section says the values are for; a general line when absent. */
  readonly description?: string;
  /** Said under the table, such as which scope wins when two set the same name. */
  readonly note?: string;
}

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

/** An agent as a picker offers it, with its type. */
export interface AgentPickerOption extends PickerOption {
  readonly type: AgentType;
}

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

function ScopeVariables({
  scope,
  scopeId,
  canEdit,
  description,
}: ScopeSectionProps): ReactElement {
  const { t } = useTranslation();
  return createElement(VariablesPanel, {
    scope,
    scopeId,
    canEdit,
    title: t('scopeVariables.title'),
    description: description ?? t('scopeVariables.description'),
    className: 'max-w-none',
  });
}

function ScopedVariables({
  scopes,
  canEdit,
  description,
  note,
}: ScopedVariablesSectionProps): ReactElement {
  const { t } = useTranslation();
  return createElement(VariablesPanel, {
    scopes,
    canEdit,
    title: t('scopeVariables.title'),
    description: description ?? t('scopeVariables.description'),
    ...(note ? { note } : {}),
    className: 'max-w-none',
  });
}

function ScopeSkills(props: ScopeSectionProps): ReactElement {
  // As wide as the card or dialog it is placed in, like the variables.
  return createElement(DefaultSkillsPanel, {
    ...props,
    className: 'max-w-none',
  });
}

export const VariablesSection: ComponentType<ScopeSectionProps> =
  withAgents(ScopeVariables);
export const ScopedVariablesSection: ComponentType<ScopedVariablesSectionProps> =
  withAgents(ScopedVariables);
export const DefaultSkillsSection: ComponentType<ScopeSectionProps> =
  withAgents(ScopeSkills);

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

/**
 * The agents the viewer may see, as picker options, archived ones left out; only agents of `type` when given. A hook
 * for any tree.
 */
export function useAgentOptions(
  filter: { readonly type?: AgentType } = {},
): AgentOptions {
  const { t } = useTranslation(ACCESS_NAMESPACE);
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
  const offered = list.filter(
    (agent) =>
      !agent.archivedAt && (!filter.type || agent.type === filter.type),
  );
  return {
    loading: agents.isPending,
    failed: agents.isError,
    agents: offered.map((agent) => pickerAgentOf(agent, text.name(agent))),
    options: offered.map((agent) => ({
      value: agent.id,
      label: text.name(agent),
      type: agent.type,
      description: [t(`agentTypes.${agent.type}`), text.description(agent)]
        .filter(Boolean)
        .join(' · '),
    })),
    nameOf: (agentId) => {
      const agent = list.find((item) => item.id === agentId);
      return agent ? text.name(agent) : null;
    },
  };
}
