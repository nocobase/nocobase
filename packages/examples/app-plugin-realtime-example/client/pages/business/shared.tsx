import type { ReactElement, ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ApiClientError } from '@nocobase/app-client';
import { ClipboardList, Inbox, Download } from 'lucide-react';
import { businessErrorKey } from './use-business-task.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import { Button } from '../../components/ui/button.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '../../components/ui/empty.js';

export function BusinessNavigation(): ReactElement {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('business.scenarios')} className='flex flex-wrap gap-2'>
      {['tasks', 'inbox', 'exports', 'lab'].map((tab) => (
        <Button
          key={tab}
          nativeButton={false}
          variant='ghost'
          role='link'
          className='text-muted-foreground aria-[current=page]:bg-secondary aria-[current=page]:text-secondary-foreground'
          render={<NavLink to={`/realtime-example/${tab}`} />}
        >
          {t(`business.tabs.${tab}`)}
        </Button>
      ))}
    </nav>
  );
}
export function BusinessShell({
  name,
  actions,
  children,
}: {
  name: 'tasks' | 'inbox' | 'exports';
  actions?: ReactNode;
  children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader
        title={t(`business.${name}.title`)}
        description={t(`business.${name}.description`)}
        actions={actions}
      />
      <BusinessNavigation />
      <p className='text-sm text-muted-foreground'>
        {t(`business.${name}.try`)}
      </p>
      {children}
    </PageContainer>
  );
}
export function BusinessEmpty({
  name,
  children,
}: {
  name: 'tasks' | 'inbox' | 'exports';
  children?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const Icon = { tasks: ClipboardList, inbox: Inbox, exports: Download }[name];
  return (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{t(`business.${name}.empty`)}</EmptyTitle>
        <EmptyDescription>{t(`business.${name}.emptyHelp`)}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
}
export function BusinessLoading({
  layout = 'feed',
}: {
  layout?: 'board' | 'feed' | 'detail';
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('loading')}
      className={
        layout === 'board' ? 'grid gap-4 lg:grid-cols-3' : 'grid gap-4'
      }
    >
      {[0, 1, 2].map((id) => (
        <Skeleton
          key={id}
          className={
            layout === 'detail' ? 'h-8' : layout === 'board' ? 'h-48' : 'h-24'
          }
        />
      ))}
    </div>
  );
}
export function BusinessFailure({
  error,
  retry,
  close,
  messageKey,
}: {
  error: unknown;
  messageKey?: string;
  retry?: () => void;
  close?: () => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!error) return null;
  const status = error instanceof ApiClientError ? error.status : 500;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(messageKey ?? businessErrorKey(error))}
      </AlertDescription>
      {status === 401 ? (
        <Link to='/login' className='underline'>
          {t('signIn')}
        </Link>
      ) : [403, 404].includes(status) ? (
        close ? (
          <Button variant='outline' onClick={close}>
            {t('business.close')}
          </Button>
        ) : null
      ) : retry ? (
        <Button variant='outline' onClick={retry}>
          {t('retry')}
        </Button>
      ) : null}
    </Alert>
  );
}
export function TaskLink({
  id,
  children,
  inbox = false,
}: {
  id: string;
  children: ReactNode;
  inbox?: boolean;
}): ReactElement {
  const location = useLocation();
  return (
    <Link
      className='break-words font-medium underline-offset-4 hover:underline focus-visible:outline-ring'
      to={{
        pathname: `${inbox ? 'tasks/' : ''}${id}`,
        search: location.search,
      }}
    >
      {children}
    </Link>
  );
}

export function BusinessUpdating({
  active,
}: {
  active: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  return active ? (
    <p role='status' className='text-sm text-muted-foreground'>
      {t('business.updating')}
    </p>
  ) : null;
}
