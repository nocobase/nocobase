import { SYSTEM_SETTINGS_ROUTE_PATH } from '@nocobase/app-client/plugins';
import { useEffect, useState, useSyncExternalStore } from 'react';

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
 * The registered kinds of rule the person may read, in order, or `undefined` until every answer is known. Data rules
 * is open exactly while this lists one, in the page's tabs and on the page itself.
 */
export function useReadableRuleTabs(): readonly RuleTab[] | undefined {
  const settings = useAuthorizationSettings();
  const tabs = useSyncExternalStore(
    settings.ruleTabs.subscribe,
    settings.ruleTabs.list,
  );
  const client = useAuthorizationClient();
  const revision = useAuthorizationRevision();
  const [answer, setAnswer] = useState<{
    readonly tabs: readonly RuleTab[];
    readonly revision: unknown;
    readonly readable: readonly RuleTab[];
  }>();
  useEffect(() => {
    let active = true;
    void Promise.all(
      tabs.map((tab) =>
        tab.authz === undefined
          ? Promise.resolve(true)
          : client.can(tab.authz).then(
              (can) => can,
              () => false,
            ),
      ),
    ).then((answers) => {
      if (active)
        setAnswer({
          tabs,
          revision,
          readable: tabs.filter((_, index) => answers[index]),
        });
    });
    return () => {
      active = false;
    };
  }, [client, revision, tabs]);
  return answer?.tabs === tabs && answer.revision === revision
    ? answer.readable
    : undefined;
}
