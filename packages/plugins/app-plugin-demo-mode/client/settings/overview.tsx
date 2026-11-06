import { copyText, useToaster } from '@nocobase/app-client';
import { Check, Copy, DatabaseZap, ExternalLink } from 'lucide-react';
import {
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useHref } from 'react-router';

import type { DemoDataStatus } from '../../shared/data.js';
import { useDemoAccounts } from '../accounts.js';
import { DEMO_SIGN_IN_PATH } from '../accounts.js';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from './components.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components.js';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../components/ui/empty.js';
import { Progress } from '../components/ui/progress.js';
import { Skeleton } from '../components/ui/skeleton.js';
import type { DemoDataControls } from '../demo-data.js';
import {
  DemoSettingsContext,
  languageName,
  useLabel,
  useT,
} from './context.js';
import { ErrorAlert } from './shared.js';

function StateBadge({
  status,
}: {
  readonly status: DemoDataStatus;
}): ReactElement {
  const t = useT();
  if (status.importing && status.operation === 'reset')
    return <Badge variant='secondary'>{t('data.state.resetting')}</Badge>;
  if (status.state === 'importing')
    return <Badge variant='secondary'>{t('data.state.importing')}</Badge>;
  if (status.state === 'clearing')
    return <Badge variant='secondary'>{t('data.state.clearing')}</Badge>;
  if (status.state === 'failed')
    return <Badge variant='destructive'>{t('data.state.failed')}</Badge>;
  if (status.present) return <Badge>{t('data.state.ready')}</Badge>;
  return <Badge variant='outline'>{t('data.state.none')}</Badge>;
}

/** Read-only status and progress of the demo dataset. */
export function DataCard({
  demo,
}: {
  readonly demo: Pick<DemoDataControls, 'status' | 'error'>;
}): ReactElement {
  const t = useT();
  const label = useLabel();
  const { onDataChange } = useContext(DemoSettingsContext);
  const { status } = demo;
  // A data operation this page watched has finished: refresh the application’s cached data.
  const importing = Boolean(status?.importing);
  const wasImportingRef = useRef(importing);
  useEffect(() => {
    if (wasImportingRef.current && !importing) onDataChange?.();
    wasImportingRef.current = importing;
  }, [importing, onDataChange]);
  if (!status)
    return demo.error ? (
      <ErrorAlert error={demo.error} />
    ) : (
      <Skeleton className='h-48 w-full' />
    );
  if (!status.available)
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <DatabaseZap />
              </EmptyMedia>
              <EmptyTitle>{t('data.unavailable')}</EmptyTitle>
              <EmptyDescription>{t('data.unavailableHelp')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  // A reset keeps the page's shape: the data is being replaced, not generated for the first time.
  const resetting = Boolean(status.importing) && status.operation === 'reset';
  // While a reset clears, the counts are of what is being removed.
  const counts =
    resetting && status.state === 'clearing'
      ? []
      : Object.entries(status.counts);
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          {t('data.title')}
          <StateBadge status={status} />
        </CardTitle>
        <CardDescription>
          {resetting
            ? t('data.resettingSummary', {
                language: languageName(
                  status.language ?? status.languages[0] ?? '—',
                ),
              })
            : status.present && status.language
              ? t('data.presentSummary', {
                  language: languageName(status.language),
                  time: status.finishedAt
                    ? new Date(status.finishedAt).toLocaleString()
                    : '—',
                })
              : t('data.absentSummary')}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {status.importing ? (
          <div className='flex items-center gap-3 text-sm'>
            <span className='shrink-0'>
              {t(
                resetting
                  ? status.state === 'clearing'
                    ? 'data.phase.clearing'
                    : 'data.phase.generating'
                  : status.state === 'clearing'
                    ? 'data.state.clearing'
                    : 'data.state.importing',
              )}
            </span>
            <Progress
              className='flex-1'
              value={status.importing.percent}
              aria-label={t('data.state.importing')}
            />
            <span className='w-10 shrink-0 text-right tabular-nums'>
              {Math.round(status.importing.percent)}%
            </span>
          </div>
        ) : null}
        {status.failure ? (
          <Alert variant='destructive'>
            <AlertTitle>{t('data.failed')}</AlertTitle>
            <AlertDescription>{status.failure.message}</AlertDescription>
          </Alert>
        ) : null}
        {demo.error ? <ErrorAlert error={demo.error} /> : null}
        {counts.length ? (
          <dl className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
            {counts.map(([key, value]) => (
              <div key={key} className='rounded-lg border px-3 py-2.5'>
                <dt className='truncate text-xs text-muted-foreground'>
                  {label('count', key)}
                </dt>
                <dd className='mt-1 text-xl font-semibold tabular-nums'>
                  {value.toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CopyButton({
  value,
  label,
}: {
  readonly value: string;
  /** The button's accessible name. */
  readonly label: string;
}): ReactElement {
  const t = useT();
  const toaster = useToaster();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type='button'
      size='sm'
      variant='outline'
      aria-label={label}
      onClick={() => {
        void copyText(value).then((success) => {
          if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } else {
            toaster.show({ type: 'error', title: t('visitors.copyFailed') });
          }
        });
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? t('visitors.copied') : t('visitors.copyLink')}
    </Button>
  );
}

/** System accounts and their sign-in links in Demo Mode. */
export function VisitorsCard({
  status,
}: {
  readonly status: DemoDataStatus | null;
}): ReactElement {
  const t = useT();
  const { accounts } = useDemoAccounts(status?.finishedAt);
  const path = useHref(DEMO_SIGN_IN_PATH);
  const entry = (username: string) =>
    `${window.location.origin}${path}?as=${encodeURIComponent(username)}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('visitors.title')}</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {accounts === null ? (
          <Skeleton className='h-24 w-full' />
        ) : !accounts.length ? (
          <p className='text-sm text-muted-foreground'>
            {t('visitors.unavailable')}
          </p>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {accounts.map((account) => (
              <li
                key={account.username}
                className='flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>
                    {account.name}
                    <span className='ml-2 text-muted-foreground font-normal'>
                      {account.role}
                    </span>
                  </p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {t('visitors.username', {
                      username: account.username,
                    })}
                  </p>
                </div>
                <div className='flex shrink-0 gap-2'>
                  <CopyButton
                    value={entry(account.username)}
                    label={t('visitors.copyLinkFor', { name: account.name })}
                  />
                  <Button
                    size='sm'
                    variant='ghost'
                    render={
                      <a
                        href={entry(account.username)}
                        target='_blank'
                        rel='noopener'
                        aria-label={t('visitors.openFor', {
                          name: account.name,
                        })}
                      />
                    }
                  >
                    <ExternalLink />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
