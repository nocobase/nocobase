import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';

import { InfoIcon } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { useAuthorizationClient } from '../use-authorization-client.js';
import { useAuthorizationRevision } from '../use-authorization-revision.js';
import type { AuthorizationPageTab } from './extensions.js';
import { DATA_RULES_TAB } from './tab-keys.js';
import { pageTabHref, useLocalizedText } from './localized-text.js';
import {
  ruleTabHref,
  useReadableRuleTabs,
  type RuleTab,
} from './readable-rule-tabs.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';

/**
 * The frame of every page tab of Roles and permissions: the heading, the top tabs another package may add to through
 * `pageTabs`, and the tab's content. A tab the person may not open is not listed.
 */
export function AuthorizationPage({
  tab,
  description,
  actions,
  children,
}: {
  /** The key of the page tab this content belongs to. */
  readonly tab: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children:
    ReactNode | ((rules: readonly RuleTab[] | undefined) => ReactNode);
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const settings = useAuthorizationSettings();
  const tabs = useSyncExternalStore(
    settings.pageTabs.subscribe,
    settings.pageTabs.list,
  );
  const rules = useReadableRuleTabs();
  const { open, ready } = useOpenTabs(tabs, rules, tab);
  const navigate = useNavigate();
  // A stored link to Data rules while no kind of rule is there to read leaves for the first tab the person may open.
  const leave =
    ready && !open.some((item) => item.key === tab) ? open[0] : undefined;
  useEffect(() => {
    if (leave) void navigate(pageTabHref(leave), { replace: true });
  }, [leave, navigate]);
  const heading = t('settings.permissionManagement');
  return (
    <PageContainer>
      <PageHeader
        title={heading}
        description={description}
        note={<HowItWorks />}
        actions={actions}
      />
      <Tabs
        className='gap-6'
        value={tab}
        onValueChange={(next) => {
          const target = tabs.find((candidate) => candidate.key === next);
          if (!target || target.key === tab) return;
          // Data rules opens on the first kind of rule the person may read, at that kind's own address.
          const rule = target.key === DATA_RULES_TAB ? rules?.[0] : undefined;
          void navigate(rule ? ruleTabHref(rule.key) : pageTabHref(target));
        }}
      >
        {open.length > 1 ? (
          // Many tabs scroll sideways on a narrow screen instead of widening the page.
          <div className='-mx-1 max-w-full overflow-x-auto px-1'>
            <TabsList variant='line' aria-label={heading}>
              {open.map((item) => (
                <TabsTrigger key={item.key} value={item.key}>
                  {text(item.title)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ) : null}
        <TabsContent value={tab} className='space-y-6'>
          {typeof children === 'function' ? children(rules) : children}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

/**
 * The tabs the person may open, in order. The open tab is the page the router already let in; the others are listed
 * once they are known to open, so a viewer who may open only one sees no tab bar at all. Data rules holds the kinds
 * of rule the rule plugins add, so it is listed only while the person may read one of them, whichever its own
 * permission; it is not kept for being open either, as a stored link to it leaves for another tab when none is.
 */
function useOpenTabs(
  tabs: readonly AuthorizationPageTab[],
  rules: readonly RuleTab[] | undefined,
  current: string,
): {
  readonly open: readonly AuthorizationPageTab[];
  /** Every answer is in, so a tab missing from `open` is one the person may not open. */
  readonly ready: boolean;
} {
  const client = useAuthorizationClient();
  const revision = useAuthorizationRevision();
  const [allowed, setAllowed] = useState<{
    readonly tabs: readonly AuthorizationPageTab[];
    readonly revision: unknown;
    readonly keys: ReadonlySet<string>;
  }>();
  useEffect(() => {
    let active = true;
    void Promise.all(
      tabs.map((tab) =>
        tab.key === DATA_RULES_TAB
          ? Promise.resolve(false)
          : client.can(tab.authz).then(
              (answer) => answer,
              () => false,
            ),
      ),
    ).then((answers) => {
      if (!active) return;
      setAllowed({
        tabs,
        revision,
        keys: new Set(tabs.filter((_, i) => answers[i]).map((tab) => tab.key)),
      });
    });
    return () => {
      active = false;
    };
  }, [client, revision, tabs]);
  const keys =
    allowed?.tabs === tabs && allowed.revision === revision
      ? allowed.keys
      : undefined;
  return {
    open: tabs.filter((tab) =>
      tab.key === DATA_RULES_TAB
        ? rules === undefined
          ? tab.key === current
          : rules.length > 0
        : tab.key === current || keys?.has(tab.key),
    ),
    ready: keys !== undefined && rules !== undefined,
  };
}

const STEPS = ['role', 'defaultAccess', 'sharing', 'restriction'] as const;

/**
 * How a person's permissions are worked out: a link beside the page description that opens the four layers in a
 * dialog, so the page itself starts with the roles.
 */
function HowItWorks(): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type='button'
        data-slot='authorization-how-it-works'
        className='inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
        onClick={() => setOpen(true)}
      >
        <InfoIcon aria-hidden className='size-3.5' />
        {t('settings.howItWorks.title')}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('settings.howItWorks.title')}</DialogTitle>
            <DialogDescription>
              {t('settings.howItWorks.intro')}
            </DialogDescription>
          </DialogHeader>
          <ol className='grid gap-3 text-sm'>
            {STEPS.map((step, index) => (
              <li key={step} className='flex min-w-0 gap-3'>
                <span
                  aria-hidden
                  className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'
                >
                  {index + 1}
                </span>
                <div className='grid min-w-0 gap-0.5'>
                  <span className='font-medium'>
                    {t(`settings.howItWorks.${step}`)}
                  </span>
                  <span className='text-muted-foreground'>
                    {t(`settings.howItWorks.${step}Description`)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
