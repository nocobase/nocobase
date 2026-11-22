import { useApiClient } from '@nocobase/app-client';
import { SYSTEM_SETTINGS_ROUTE_PATH } from '@nocobase/app-client/plugins';
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { AuthorizationOptionsResponse } from '../authorization-client.js';
import {
  DEFAULT_ACCESS_RULES,
  SHARING_RULES,
  RESTRICTION_RULES,
} from './data-rule-kinds.js';
import { ruleResources } from './default-access-model.js';
import { useAuthorizationClient } from '../use-authorization-client.js';
import { useAuthorizationRevision } from '../use-authorization-revision.js';
import type {
  AuthorizationContentTab,
  AuthorizationRuleTabProps,
} from './extensions.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';

export type RuleTab = AuthorizationContentTab<AuthorizationRuleTabProps>;

/**
 * The kinds of rule with an address of their own, each guarded by the kind's read permission (see `routes.ts`). Another
 * kind opens under Default access with `?rule=`.
 */
const RULE_PATHS: Readonly<Record<string, string>> = {
  'default-access': '/default-access',
  'sharing-rules': '/sharing-rules',
  'restriction-rules': '/restriction-rules',
};

/** Where a kind of rule opens, with any further query, such as a rule's side sheet. */
export function ruleTabHref(
  key: string,
  search: Readonly<Record<string, string>> = {},
): string {
  const path = RULE_PATHS[key];
  const query = new URLSearchParams(path ? search : { rule: key, ...search });
  const suffix = query.toString() ? `?${query}` : '';
  return `${SYSTEM_SETTINGS_ROUTE_PATH}${path ?? RULE_PATHS['default-access']}${suffix}`;
}

/** The kind of rule an address names by its own path, if any. */
export function ruleKeyOfPath(pathname: string): string | undefined {
  return Object.keys(RULE_PATHS).find((key) =>
    pathname.replace(/\/+$/, '').endsWith(RULE_PATHS[key] ?? ''),
  );
}

/**
 * The kind of rule an address opens, including a rule's own address below it and a kind named by `?rule=` under
 * Default access, or `undefined` for any other address.
 */
export function ruleKindOfAddress(
  pathname: string,
  search: string,
): string | undefined {
  const prefix = `${SYSTEM_SETTINGS_ROUTE_PATH}/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const segment = `/${pathname.slice(prefix.length).split('/')[0]}`;
  const kind = Object.keys(RULE_PATHS).find(
    (key) => RULE_PATHS[key] === segment,
  );
  if (kind !== 'default-access') return kind;
  return new URLSearchParams(search).get('rule') ?? kind;
}

/**
 * The registered kinds of rule the person may read, in order, or `undefined` until every answer is known. Data rules
 * is open exactly while this lists one, in the page's tabs and on the page itself.
 */
export function useReadableRuleTabs(): readonly RuleTab[] | undefined {
  const settings = useAuthorizationSettings();
  const tabs = useSyncExternalStore(
    settings.ruleTabs.subscribe,
    settings.ruleTabs.list,
  );
  const api = useApiClient();
  const client = useAuthorizationClient();
  const revision = useAuthorizationRevision();
  const [answer, setAnswer] = useState<{
    readonly tabs: readonly RuleTab[];
    readonly revision: unknown;
    readonly readable: readonly RuleTab[];
  }>();
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all(
      tabs.map(async (tab) => {
        if (tab.authz && !(await client.can(tab.authz).catch(() => false)))
          return false;
        const kind = [
          DEFAULT_ACCESS_RULES,
          SHARING_RULES,
          RESTRICTION_RULES,
        ].find((item) => item.key === tab.key);
        if (!kind) return true;
        const path = `authorization/${kind.path}`;
        try {
          const catalog = await api.request<{
            data: AuthorizationOptionsResponse;
          }>({ path: `${path}/options`, signal: controller.signal });
          if (ruleResources(catalog.data, settings.workspace).length > 0)
            return true;
          const rules = await api.request<{ data: readonly unknown[] }>({
            path,
            signal: controller.signal,
          });
          return rules.data.length > 0;
        } catch {
          // Keep the page reachable so its request error and retry action remain available.
          return true;
        }
      }),
    ).then((answers) => {
      if (!controller.signal.aborted)
        setAnswer({
          tabs,
          revision,
          readable: tabs.filter((_, index) => answers[index]),
        });
    });
    return () => {
      controller.abort();
    };
  }, [api, client, revision, settings, tabs]);
  return answer?.tabs === tabs && answer.revision === revision
    ? answer.readable
    : undefined;
}
