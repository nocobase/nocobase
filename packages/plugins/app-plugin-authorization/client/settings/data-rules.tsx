import { useTranslation } from '@nocobase/i18n/client';
import {
  createElement,
  Suspense,
  use,
  useEffect,
  type ComponentType,
  type ReactElement,
} from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router';

import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import { Skeleton } from '#components/ui/skeleton';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { AuthorizationPage } from './authorization-page.js';
import { useLocalizedText } from './localized-text.js';
import { DATA_RULES_TAB } from './tab-keys.js';
import type { AuthorizationRuleTabProps } from './extensions.js';
import {
  ruleKeyOfPath,
  ruleTabHref,
  useReadableRuleTabs,
  type RuleTab,
} from './readable-rule-tabs.js';

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
 * The Data rules tab: one kind of rule per rule plugin installed that the person may read. Each kind registers itself
 * in `ruleTabs` and opens at its own address (`/sharing-rules`) or with `?rule=` under Default access, so an
 * application that installs no rule plugin shows none, and a person who may read only sharing rules opens those.
 */
export default function DataRulesPage(): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const tabs = useReadableRuleTabs();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const requested = params.get('rule') ?? ruleKeyOfPath(pathname);
  const current =
    tabs?.find((tab) => tab.key === requested) ??
    (tabs?.length ? tabs[0] : undefined);
  // An address naming a kind that is not there to read moves to the kind shown, so the address and the tab agree.
  const moveTo =
    current && requested !== null && requested !== current.key
      ? ruleTabHref(current.key)
      : undefined;
  useEffect(() => {
    if (moveTo) void navigate(moveTo, { replace: true });
  }, [moveTo, navigate]);
  return (
    <AuthorizationPage
      tab={DATA_RULES_TAB}
      description={t('settings.dataRulesDescription')}
    >
      {tabs && tabs.length > 1 && current ? (
        <Tabs
          value={current.key}
          onValueChange={(next) => {
            if (typeof next !== 'string' || next === current.key) return;
            // Each kind of rule keeps its own search and page, so none of the previous one's carries over.
            void navigate(ruleTabHref(next));
          }}
        >
          <TabsList aria-label={t('settings.dataRules')}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {text(tab.title)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}
      {tabs === undefined || moveTo ? (
        <Skeleton className='h-64 w-full' />
      ) : current ? (
        <Suspense fallback={<Skeleton className='h-64 w-full' />}>
          <RuleContent key={current.key} tab={current} />
        </Suspense>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('settings.noDataRules')}
        </p>
      )}
      {/* The old `create` and `:key/edit` addresses, which redirect back here. */}
      <Outlet />
    </AuthorizationPage>
  );
}
