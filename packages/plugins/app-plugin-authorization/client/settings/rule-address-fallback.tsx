import { SYSTEM_SETTINGS_ROUTE_PATH } from '@nocobase/app-client/plugins';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { useLocation, useNavigate } from 'react-router';

import type { AuthorizationClient } from '../authorization-client.js';
import { useAuthorizationClient } from '../use-authorization-client.js';
import type { AuthorizationPageTab } from './extensions.js';
import { pageTabHref } from './localized-text.js';
import {
  ruleKindOfAddress,
  ruleTabHref,
  type RuleTab,
} from './readable-rule-tabs.js';
import { DATA_RULES_TAB } from './tab-keys.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';

/**
 * Where a stored link to a kind of rule no rule plugin registers goes instead: the first registered kind the person may
 * read, else the first other page tab of Roles and permissions they may open, else the System settings home.
 */
async function fallbackAddress(
  client: AuthorizationClient,
  rules: readonly RuleTab[],
  tabs: readonly AuthorizationPageTab[],
): Promise<string> {
  const can = (check: Parameters<AuthorizationClient['can']>[0]) =>
    client.can(check).then(
      (answer) => answer,
      () => false,
    );
  for (const rule of rules)
    if (rule.authz === undefined || (await can(rule.authz)))
      return ruleTabHref(rule.key);
  for (const tab of tabs)
    if (tab.key !== DATA_RULES_TAB && (await can(tab.authz)))
      return pageTabHref(tab);
  return SYSTEM_SETTINGS_ROUTE_PATH;
}

/**
 * Leaves a stored link to a kind of rule whose plugin the application no longer registers before the router guards
 * it. The routes of Data rules keep each kind's own read permission, which no one holds once its plugin is gone, so the
 * guard alone would stop a person who may still open Roles at a denial. A registered kind keeps its address and its
 * guard untouched.
 */
export function RuleAddressFallback({
  children,
}: PropsWithChildren): ReactElement | null {
  const settings = useAuthorizationSettings();
  const rules = useSyncExternalStore(
    settings.ruleTabs.subscribe,
    settings.ruleTabs.list,
  );
  const tabs = useSyncExternalStore(
    settings.pageTabs.subscribe,
    settings.pageTabs.list,
  );
  const client = useAuthorizationClient();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const kind = ruleKindOfAddress(pathname, search);
  const stale =
    kind !== undefined && !rules.some((rule) => rule.key === kind)
      ? `${pathname}${search}`
      : undefined;
  const [target, setTarget] = useState<{
    readonly from: string;
    readonly to: string;
  }>();
  useEffect(() => {
    if (!stale) return;
    let active = true;
    void fallbackAddress(client, rules, tabs).then((to) => {
      if (active) setTarget({ from: stale, to });
    });
    return () => {
      active = false;
    };
  }, [client, rules, stale, tabs]);
  useEffect(() => {
    if (stale && target?.from === stale)
      void navigate(target.to, { replace: true });
  }, [navigate, stale, target]);
  // Nothing renders at a stale address, so its route's denial never shows before the person leaves it.
  return stale ? null : <>{children}</>;
}
