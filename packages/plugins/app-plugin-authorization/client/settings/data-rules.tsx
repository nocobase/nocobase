import { useTranslation } from '@nocobase/i18n/client';
import {
  createElement,
  Suspense,
  use,
  useSyncExternalStore,
  type ComponentType,
  type ReactElement,
} from 'react';
import { useSearchParams } from 'react-router';

import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import { Skeleton } from '#components/ui/skeleton';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { useCan } from '../use-can.js';
import { AuthorizationPage } from './authorization-page.js';
import { useLocalizedText } from './localized-text.js';
import { DATA_RULES_TAB } from './tab-keys.js';
import type {
  AuthorizationContentTab,
  AuthorizationRuleTabProps,
} from './extensions.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';

type RuleTab = AuthorizationContentTab<AuthorizationRuleTabProps>;

// One load per registered loader, so switching back to a kind of rule does not load it again.
const modules = new WeakMap<
  RuleTab['component'],
  Promise<{ readonly default: ComponentType<AuthorizationRuleTabProps> }>
>();
function loadRule(
  tab: RuleTab,
): Promise<{ readonly default: ComponentType<AuthorizationRuleTabProps> }> {
  let module = modules.get(tab.component);
  if (!module) {
    module = tab.component();
    modules.set(tab.component, module);
  }
  return module;
}

function RuleContent({ tab }: { readonly tab: RuleTab }): ReactElement {
  // The loaded module's component is the same one every time it renders, as `lazy()` would return.
  return createElement(use(loadRule(tab)).default);
}

/**
 * The Data rules tab: one kind of rule per rule plugin installed, chosen with `?rule=`. Each kind registers itself in
 * `ruleTabs`, so an application that installs no rule plugin shows none.
 */
export default function DataRulesPage(): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const settings = useAuthorizationSettings();
  const tabs = useSyncExternalStore(
    settings.ruleTabs.subscribe,
    settings.ruleTabs.list,
  );
  const [params, setParams] = useSearchParams();
  const requested = params.get('rule');
  const current =
    tabs.find((tab) => tab.key === requested) ??
    (tabs.length ? tabs[0] : undefined);
  return (
    <AuthorizationPage
      tab={DATA_RULES_TAB}
      description={t('settings.dataRulesDescription')}
    >
      {tabs.length > 1 && current ? (
        <Tabs
          value={current.key}
          onValueChange={(next) => {
            if (typeof next !== 'string' || next === current.key) return;
            // Each kind of rule keeps its own search and page, so none of the previous one's carries over.
            setParams(new URLSearchParams({ rule: next }));
          }}
        >
          <TabsList aria-label={t('settings.dataRules')}>
            {tabs.map((tab) => (
              <RuleTabTrigger key={tab.key} tab={tab} label={text(tab.title)} />
            ))}
          </TabsList>
        </Tabs>
      ) : null}
      {current ? (
        <Suspense fallback={<Skeleton className='h-64 w-full' />}>
          <RuleContent key={current.key} tab={current} />
        </Suspense>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('settings.noDataRules')}
        </p>
      )}
    </AuthorizationPage>
  );
}

function RuleTabTrigger({
  tab,
  label,
}: {
  readonly tab: RuleTab;
  readonly label: string;
}): ReactElement | null {
  const access = useCan(tab.authz, { enabled: tab.authz !== undefined });
  if (tab.authz !== undefined && !access.can) return null;
  return <TabsTrigger value={tab.key}>{label}</TabsTrigger>;
}
