/**
 * What Studio allows of each action the plugins register (`catalog.ts`) beyond roles, keyed as Studio names them
 * (`pm.issues/edit`, `pm.members/read`):
 *
 * - `keys`: whether an API key's scope may hold it (a permission group covers it, `key-scopes.ts`), or why a person
 *   decides it;
 * - `agents`: whether an agent may be configured with it (`grantable`, ticked for a new agent when `defaultOn`, only
 *   for the agent types in `types`), or why it never is. Settings capabilities are never an agent's.
 *
 * Every registered action is annotated for both; `tests/access/catalog.test.ts` checks it against the running catalog,
 * so a plugin's new action cannot reach keys or agents unconsidered.
 */
import type { AgentType } from '@nocobase/app-plugin-agents/shared/agents';

export type KeyPolicy = true | { readonly reason: string };

export type AgentPolicy =
  | {
      readonly grantable: true;
      readonly defaultOn?: boolean;
      readonly types?: readonly AgentType[];
    }
  | {
      readonly grantable: false;
      /** Why, as a key of Studio's locales. */
      readonly reason: string;
    };

export interface ActionPolicy {
  readonly keys: KeyPolicy;
  readonly agents: AgentPolicy;
}

const AGENT: AgentPolicy = { grantable: true };
const AGENT_DEFAULT: AgentPolicy = { grantable: true, defaultOn: true };

/** Not an agent's: the reason is `studioAgents.actionReasons.<key>`. */
const notAgents = (key: string): AgentPolicy => ({
  grantable: false,
  reason: `studioAgents.actionReasons.${key}`,
});

const notKeys = (reason: string): KeyPolicy => ({ reason });

/** The business actions. */
const BUSINESS: Readonly<Record<string, ActionPolicy>> = {
  'pm.projects/view': { keys: true, agents: AGENT },
  'pm.projects/create': { keys: true, agents: AGENT },
  'pm.projects/manage': { keys: true, agents: AGENT },
  'pm.projects/delete': {
    keys: true,
    agents: notAgents('pm.projects/delete'),
  },
  'pm.issues/view': { keys: true, agents: AGENT_DEFAULT },
  'pm.issues/create': { keys: true, agents: AGENT },
  'pm.issues/edit': { keys: true, agents: AGENT },
  'pm.issues/comment': { keys: true, agents: AGENT_DEFAULT },
  'pm.issues/moderate-comments': {
    keys: true,
    agents: notAgents('pm.issues/moderate-comments'),
  },
  'pm.issues/close': { keys: true, agents: AGENT },
  'pm.issues/change-owner': { keys: true, agents: AGENT },
  'pm.issues/delete': { keys: true, agents: AGENT },
  // Attaching sends files from a working directory, which only a runner agent has.
  'pm.attachments/upload': {
    keys: true,
    agents: { grantable: true, types: ['runner'] },
  },
  'agents.agents/edit': {
    keys: true,
    agents: notAgents('agents.agents/edit'),
  },
  'rel.apps/view': { keys: true, agents: AGENT_DEFAULT },
  'rel.apps/read-logs': { keys: true, agents: AGENT_DEFAULT },
  'rel.apps/create': {
    keys: notKeys('CI deploys to Apps people created.'),
    agents: notAgents('rel.apps/create'),
  },
  'rel.apps/configure': {
    keys: notKeys('A person configures an App (release management).'),
    agents: notAgents('rel.apps/configure'),
  },
  'rel.apps/upload': { keys: true, agents: notAgents('rel.apps/upload') },
  // On a protected environment this only requests the deployment, which a person approves.
  'rel.apps/deploy': { keys: true, agents: AGENT },
  'rel.apps/deploy-protected': {
    keys: notKeys(
      'Only a person approves a deployment to a protected environment (release management).',
    ),
    agents: notAgents('rel.apps/deploy-protected'),
  },
  'rel.apps/operate': { keys: true, agents: notAgents('rel.apps/operate') },
  'rel.apps/delete': {
    keys: notKeys('A person deletes an App (release management).'),
    agents: notAgents('rel.apps/delete'),
  },
  'kb.knowledge/read': { keys: true, agents: AGENT_DEFAULT },
  'kb.knowledge/propose': { keys: true, agents: AGENT_DEFAULT },
  'kb.knowledge/edit': { keys: true, agents: notAgents('kb.knowledge/edit') },
  'kb.knowledge/manage': {
    keys: true,
    agents: notAgents('kb.knowledge/manage'),
  },
};

/** A settings item's capabilities: never an agent's, each offered to keys unless it says why not. */
function settings(
  item: string,
  keys: Readonly<Record<string, KeyPolicy>>,
): Record<string, ActionPolicy> {
  return Object.fromEntries(
    Object.entries(keys).map(([action, policy]) => [
      `${item}/${action}`,
      { keys: policy, agents: notAgents(item) },
    ]),
  );
}

const SIGN_IN_ONLY = notKeys(
  'Only a sign-in sees and manages API keys; no key manages keys.',
);

export const ACTION_POLICIES: Readonly<Record<string, ActionPolicy>> = {
  ...BUSINESS,
  ...settings('pm.general', { read: true, update: true }),
  ...settings('pm.labels', { read: true, update: true }),
  ...settings('pm.workflows', { read: true, update: true }),
  ...settings('pm.members', {
    read: true,
    invite: true,
    assign: true,
    'define-roles': true,
  }),
  ...settings('agents.agents', { read: true, manage: true }),
  ...settings('agents.runners', { read: true, manage: true }),
  ...settings('agents.prices', { read: true, manage: true }),
  ...settings('agents.services', {
    read: true,
    manage: notKeys(
      'A person sets up model services and their provider keys (the agents plugin).',
    ),
  }),
  ...settings('rel.environments', { read: true, manage: true }),
  ...settings('studio.apiKeys', { read: SIGN_IN_ONLY, manage: SIGN_IN_ONLY }),
  ...settings('studio.personalApiKeys', {
    create: notKeys(
      'Only a sign-in creates keys; no key mints its own successors.',
    ),
  }),
  ...settings('studio.git', {
    read: notKeys(
      'A person sets up the connections to code hosts; no key reads them.',
    ),
    manage: notKeys(
      'A person sets up the connections to code hosts and their credentials.',
    ),
  }),
  ...settings('studio.knowledgeSearch', {
    read: notKeys(
      'A person sets up how the knowledge base is searched; no key reads it.',
    ),
    manage: notKeys(
      'A person chooses the models the knowledge base is searched with.',
    ),
  }),
};

/** Whether an agent may be configured with a business action. */
export function grantableToAgents(key: string): boolean {
  return ACTION_POLICIES[key]?.agents.grantable === true;
}
