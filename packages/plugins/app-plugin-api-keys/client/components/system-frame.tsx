import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

import { cn } from 'cn';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { API_KEYS_NAMESPACE } from '../namespace.js';

const TABS = [
  { key: 'system', path: '/settings/api-keys' },
  { key: 'managed', path: '/settings/api-keys/managed' },
  { key: 'members', path: '/settings/api-keys/members' },
  { key: 'rules', path: '/settings/api-keys/rules' },
] as const;

export type SystemTab = (typeof TABS)[number]['key'];

/**
 * The frame of System settings › API keys: its heading and its four tabs, each a page with its own address, then the
 * tab's content and the outlet its child pages open in.
 */
export function SystemFrame({
  tab,
  actions,
  children,
}: {
  readonly tab: SystemTab;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  useLocation();
  return (
    <PageContainer>
      <PageHeader
        title={t('system.title')}
        description={t('system.description')}
        actions={actions}
      />
      <nav
        aria-label={t('system.title')}
        className='-mx-1 flex max-w-full gap-4 overflow-x-auto border-b px-1'
      >
        {TABS.map((entry) => (
          <Link
            key={entry.key}
            to={entry.path}
            aria-current={entry.key === tab ? 'page' : undefined}
            className={cn(
              'border-b-2 pb-2 text-sm whitespace-nowrap',
              entry.key === tab
                ? 'border-foreground font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`system.tabs.${entry.key}`)}
          </Link>
        ))}
      </nav>
      {children}
    </PageContainer>
  );
}
