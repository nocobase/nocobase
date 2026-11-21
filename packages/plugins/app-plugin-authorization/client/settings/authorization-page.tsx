import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { useAuthorizationClient } from '../use-authorization-client.js';
import { useAuthorizationRevision } from '../use-authorization-revision.js';
import type { AuthorizationPageTab } from './extensions.js';
import { pageTabHref, useLocalizedText } from './localized-text.js';
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
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const settings = useAuthorizationSettings();
  const tabs = useSyncExternalStore(
    settings.pageTabs.subscribe,
    settings.pageTabs.list,
  );
  const open = useOpenTabs(tabs, tab);
  const navigate = useNavigate();
  const heading = t('settings.permissionManagement');
  return (
    <PageContainer>
      <PageHeader title={heading} description={description} actions={actions} />
      <HowItWorks />
      <Tabs
        className='gap-6'
        value={tab}
        onValueChange={(next) => {
          const target = tabs.find((candidate) => candidate.key === next);
          if (target && target.key !== tab) void navigate(pageTabHref(target));
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
          {children}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

/**
 * The tabs the person may open, in order. The open tab is the page the router already let in; the others are listed
 * once they are known to open, so a viewer who may open only one sees no tab bar at all.
 */
function useOpenTabs(
  tabs: readonly AuthorizationPageTab[],
  current: string,
): readonly AuthorizationPageTab[] {
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
        client.can(tab.authz).then(
          (can) => can,
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
  return tabs.filter((tab) => tab.key === current || keys?.has(tab.key));
}

const STEPS = ['role', 'defaultAccess', 'sharing', 'restriction'] as const;

/** How a person's permissions are worked out, folded away until asked for. */
function HowItWorks(): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  return (
    <details
      data-slot='authorization-how-it-works'
      className='group rounded-lg border bg-muted/30 px-4 py-2 text-sm'
    >
      <summary className='cursor-pointer py-1 font-medium select-none'>
        {t('settings.howItWorks.title')}
      </summary>
      <ol className='grid gap-2 py-2 sm:grid-cols-2 lg:grid-cols-4'>
        {STEPS.map((step, index) => (
          <li key={step} className='flex min-w-0 gap-2'>
            <span
              aria-hidden
              className='flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'
            >
              {index + 1}
            </span>
            <div className='grid min-w-0 gap-0.5'>
              <span className='font-medium'>
                {t(`settings.howItWorks.${step}`)}
              </span>
              <span className='text-xs text-muted-foreground'>
                {t(`settings.howItWorks.${step}Description`)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
