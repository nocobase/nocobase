/**
 * What an agent may be configured with in Studio: the business actions the plugins register (`../access/catalog.ts`)
 * that Studio's annotations make grantable to agents (`../access/action-policy.ts`), within what the person who woke it
 * holds, and a few actions of Studio's own that no role grants. The agent editor lists them from the running catalog,
 * then what an agent is never given, greyed out with the reason. Titles and descriptions are the plugins' (Studio's for
 * its own); a new agent starts with the ones annotated `defaultOn`.
 */
import type { AgentActionOption } from '@nocobase/app-plugin-agents/shared/agents';
import type { I18nText } from '@nocobase/app-plugin-agents/shared/i18n';
import { PLANS_USE_ACTION } from '@nocobase/app-plugin-projects/server/tokens';

import { STUDIO_NAMESPACE, type CatalogText } from '../../shared/access.js';
import { ACTION_POLICIES, grantableToAgents } from '../access/action-policy.js';
import type { Catalog } from '../access/catalog.js';

/** Attaching files to issues and comments (`nb-studio issue comment add --attach`). */
export const ATTACH_ACTION = 'pm.attachments/upload';

/**
 * Actions an agent is configured with that no role grants as such: a person holds each while they hold its base
 * action (`DERIVED_ACTIONS`), and a run when its agent is configured with it and the run holds the base too. A
 * run-capable route performing one of these names it, so an agent that may edit issues still opens pull requests or
 * takes previews down only when it is given that on its own.
 */
export const OPEN_PR_ACTION = 'studio.git/open-pr';
export const PREVIEWS_MANAGE_ACTION = 'studio.previews/manage';

/** Each derived action and the base action of the person's own that it stands on. */
export const DERIVED_ACTIONS: Readonly<Record<string, string>> = {
  [OPEN_PR_ACTION]: 'pm.issues/edit',
  [PREVIEWS_MANAGE_ACTION]: 'pm.issues/edit',
};

/**
 * Studio's Reports page an agent may read for the person who woke it (`nb-studio report metrics`, `report usage`), when
 * that person holds the page. Not ticked for a new agent; the project lead and assistant presets have it.
 */
export const REPORTS_READ_ACTION = 'studio.reports/read';

/**
 * What every caller holds, person or run, beside its business actions: its own operation plans (a run, its person's
 * in the conversation it works in) and its own inbox (a run, its person's).
 */
export const INBOX_READ_ACTION = 'studio.inbox/read';
export const CALLER_ACTIONS: readonly string[] = [
  PLANS_USE_ACTION,
  INBOX_READ_ACTION,
];

/** Studio's own actions an agent may be configured with, by group, and whether a new agent has them. */
const STUDIO_AGENT_ACTIONS: readonly {
  readonly key: string;
  readonly defaultOn: boolean;
}[] = [
  { key: OPEN_PR_ACTION, defaultOn: true },
  { key: PREVIEWS_MANAGE_ACTION, defaultOn: true },
  { key: REPORTS_READ_ACTION, defaultOn: false },
];

/** Whether an agent may be configured with an action: a grantable business action, or one of Studio's own. */
export function isAgentAction(key: string): boolean {
  return (
    grantableToAgents(key) ||
    STUDIO_AGENT_ACTIONS.some((action) => action.key === key)
  );
}

const studioText = (key: string): I18nText => ({ key, ns: STUDIO_NAMESPACE });

const i18n = (title: CatalogText | undefined, fallback: string): I18nText =>
  title === undefined
    ? studioText(fallback)
    : typeof title === 'string'
      ? studioText(title)
      : title;

/** Attaching files is an issue's: it is listed with the issue actions. */
const groupOf = (key: string): string =>
  key === ATTACH_ACTION ? 'pm.issues' : key.slice(0, key.indexOf('/'));

/** The agent editor's options: the grantable actions by group, then what is never granted, with the reason. */
export function agentActionOptions(catalog: Catalog): AgentActionOption[] {
  const businessTitles = new Map(
    catalog.businesses.map((business) => [business.id, business.title]),
  );
  const groupTitle = (group: string): I18nText =>
    businessTitles.has(group)
      ? i18n(businessTitles.get(group), group)
      : studioText(`studioAgents.actionGroups.${group}`);
  const granted: AgentActionOption[] = [];
  const never: AgentActionOption[] = [];
  for (const business of catalog.businesses)
    for (const action of business.actions) {
      const policy = ACTION_POLICIES[action.key]?.agents;
      if (!policy) continue;
      const group = groupOf(action.key);
      const base = {
        key: action.key,
        group,
        title: i18n(action.title, action.key),
        groupTitle: groupTitle(group),
      };
      if (policy.grantable)
        granted.push({
          ...base,
          ...(action.description
            ? { description: i18n(action.description, action.key) }
            : {}),
          ...(policy.defaultOn ? { defaultOn: true } : {}),
          ...(policy.types ? { types: policy.types } : {}),
        });
      else
        never.push({
          ...base,
          grantable: false,
          reason: studioText(policy.reason),
        });
    }
  for (const { key, defaultOn } of STUDIO_AGENT_ACTIONS) {
    const group = groupOf(key);
    granted.push({
      key,
      group,
      title: studioText(`studioAgents.actions.${key}`),
      groupTitle: groupTitle(group),
      description: studioText(`studioAgents.actionDescriptions.${key}`),
      ...(defaultOn ? { defaultOn: true } : {}),
    });
  }
  // Settings are never an agent's: one greyed line per item, under administration.
  for (const item of catalog.settings) {
    const policy = item.actions
      .map((action) => ACTION_POLICIES[action.key]?.agents)
      .find((entry) => entry !== undefined);
    if (!policy || policy.grantable) continue;
    never.push({
      key: item.id,
      group: 'studio.admin',
      title: i18n(item.title, item.id),
      groupTitle: groupTitle('studio.admin'),
      grantable: false,
      reason: studioText(policy.reason),
    });
  }
  // Grouped as the catalog lists the businesses, Studio's own after them.
  const order = [
    ...new Set([
      ...granted.map((option) => option.group),
      ...never.map((option) => option.group),
    ]),
  ];
  return [...granted, ...never]
    .map((option, index) => ({ option, index }))
    .sort(
      (a, b) =>
        order.indexOf(a.option.group) - order.indexOf(b.option.group) ||
        a.index - b.index,
    )
    .map(({ option }) => option);
}
