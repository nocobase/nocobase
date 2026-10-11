/**
 * What needs attention now (`reports/attention`), exceptions only: issues in Blocked, overdue issues, pull requests
 * open longer than `REVIEW_WAIT_DAYS`, and runs that failed in the last 24 hours. Each list that has something is a
 * compact card with its count and its first few items, each opening the item; when every list is empty one "All clear"
 * state stands in for them.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { UseQueryResult } from '@tanstack/react-query';
import { CircleCheckIcon, ExternalLinkIcon } from 'lucide-react';
import { Fragment, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import {
  ATTENTION_LIMIT,
  REVIEW_WAIT_DAYS,
  type AttentionList,
  type DashboardAttention,
} from '../../../shared/reports.js';
import { dayLabel, formatDuration } from './model.js';
import {
  Bone,
  CardError,
  DashboardCard,
  ListSkeleton,
  ViewAllLink,
} from './parts.js';
import { useFormatLocale } from './use-format-locale.js';

const issuePath = (identifier: string): string =>
  `/issues/${encodeURIComponent(identifier)}`;

/** How long ago an instant was, as a short duration (`3 d`, `5 h`). */
function useAgo(): (iso: string) => string {
  const locale = useFormatLocale();
  return (iso) =>
    formatDuration(Math.max(0, Date.now() - Date.parse(iso)), locale);
}

export function NeedsAttention({
  attention,
}: {
  readonly attention: UseQueryResult<DashboardAttention>;
}): ReactElement {
  const { t } = useTranslation();
  const locale = useFormatLocale();
  const ago = useAgo();
  const heading = (
    <div className='flex flex-col gap-0.5'>
      <h2 className='text-base font-medium'>
        {t('dashboard.attention.title')}
      </h2>
      <p className='text-sm text-muted-foreground'>
        {t('dashboard.attention.description')}
      </p>
    </div>
  );
  const data = attention.data;
  if (!data)
    return (
      <section className='flex flex-col gap-4'>
        {heading}
        {attention.isError ? (
          <CardError
            error={attention.error}
            onRetry={() => void attention.refetch()}
          />
        ) : (
          <div className='grid gap-4 md:grid-cols-2'>
            {[0, 1].map((index) => (
              <Card key={index} size='sm'>
                <CardHeader>
                  <Bone className='h-4 w-32' />
                </CardHeader>
                <CardContent>
                  <ListSkeleton />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    );

  const lists: ReactNode[] = [];
  if (data.blocked.total > 0)
    lists.push(
      <AttentionCard
        key='blocked'
        title={t('dashboard.attention.blocked')}
        list={data.blocked}
        action={<ViewAllLink to='/issues?view=list&status=blocked' />}
        render={(issue) => (
          <IssueRow
            to={issuePath(issue.identifier)}
            identifier={issue.identifier}
            title={issue.title}
            meta={t('dashboard.attention.waiting', { value: ago(issue.since) })}
          />
        )}
      />,
    );
  if (data.overdue.total > 0)
    lists.push(
      <AttentionCard
        key='overdue'
        title={t('dashboard.attention.overdue')}
        list={data.overdue}
        render={(issue) => (
          <IssueRow
            to={issuePath(issue.identifier)}
            identifier={issue.identifier}
            title={issue.title}
            meta={t('dashboard.attention.due', {
              value: dayLabel(issue.since, locale),
            })}
            alert
          />
        )}
      />,
    );
  if (data.reviewWaits.total > 0)
    lists.push(
      <AttentionCard
        key='reviewWaits'
        title={t('dashboard.attention.reviewWaits', {
          count: REVIEW_WAIT_DAYS,
        })}
        list={data.reviewWaits}
        render={(pr) => (
          <li className='flex min-w-0 items-center gap-3 py-2'>
            <a
              href={pr.url}
              target='_blank'
              rel='noreferrer'
              className='flex min-w-0 flex-1 items-center gap-2 rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring'
            >
              <span className='shrink-0 font-mono text-xs text-muted-foreground'>
                {pr.repo}#{pr.number}
              </span>
              <span className='truncate'>{pr.title}</span>
              <ExternalLinkIcon
                className='size-3.5 shrink-0 text-muted-foreground'
                aria-label={t('dashboard.attention.opensOnHost')}
              />
            </a>
            <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
              {t('dashboard.attention.open', { value: ago(pr.since) })}
            </span>
          </li>
        )}
      />,
    );
  if (data.failedRuns.total > 0)
    lists.push(
      <AttentionCard
        key='failedRuns'
        title={t('dashboard.attention.failedRuns')}
        list={data.failedRuns}
        action={
          <ViewAllLink
            to='/issues?view=agent'
            label={t('dashboard.attention.queue')}
          />
        }
        render={(run) => (
          <IssueRow
            to={`${issuePath(run.issue.identifier)}/runs/${encodeURIComponent(run.id)}`}
            identifier={run.issue.identifier}
            title={run.issue.title}
            meta={t('dashboard.attention.failed', {
              agent: run.agentName ?? t('dashboard.attention.anAgent'),
              value: ago(run.finishedAt),
            })}
            alert
          />
        )}
      />,
    );

  return (
    <section className='flex flex-col gap-4'>
      {heading}
      {lists.length === 0 ? (
        <AllClear />
      ) : (
        <div className='grid items-start gap-4 md:grid-cols-2'>{lists}</div>
      )}
    </section>
  );
}

function AllClear(): ReactElement {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-40 border border-dashed p-6 md:p-6'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <CircleCheckIcon />
        </EmptyMedia>
        <EmptyTitle>{t('dashboard.attention.allClearTitle')}</EmptyTitle>
        <EmptyDescription>
          {t('dashboard.attention.allClearDescription', {
            count: REVIEW_WAIT_DAYS,
          })}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function AttentionCard<T extends { readonly id: string }>({
  title,
  list,
  action,
  render,
}: {
  readonly title: string;
  readonly list: AttentionList<T>;
  readonly action?: ReactNode;
  readonly render: (item: T) => ReactElement;
}): ReactElement {
  const { t } = useTranslation();
  const more = list.total - list.items.length;
  return (
    <DashboardCard
      title={
        <>
          {title}
          <Badge variant='secondary' className='tabular-nums'>
            {list.total}
          </Badge>
        </>
      }
      action={action}
    >
      <ul className='-my-2 flex flex-col divide-y'>
        {list.items.slice(0, ATTENTION_LIMIT).map((item) => (
          <Fragment key={item.id}>{render(item)}</Fragment>
        ))}
      </ul>
      {more > 0 ? (
        <p className='pt-3 text-xs text-muted-foreground'>
          {t('dashboard.attention.more', { count: more })}
        </p>
      ) : null}
    </DashboardCard>
  );
}

function IssueRow({
  to,
  identifier,
  title,
  meta,
  alert = false,
}: {
  readonly to: string;
  readonly identifier: string;
  readonly title: string;
  readonly meta: string;
  /** The meta states a problem (late, failed): it reads in the destructive tone, with words that say so. */
  readonly alert?: boolean;
}): ReactElement {
  return (
    <li className='flex min-w-0 items-center gap-3 py-2'>
      <Link
        to={to}
        className='flex min-w-0 flex-1 items-center gap-2 rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring'
      >
        <span className='shrink-0 font-mono text-xs text-muted-foreground'>
          {identifier}
        </span>
        <span className='truncate'>{title}</span>
      </Link>
      <span
        className={
          alert
            ? 'shrink-0 text-xs text-destructive tabular-nums'
            : 'shrink-0 text-xs text-muted-foreground tabular-nums'
        }
      >
        {meta}
      </span>
    </li>
  );
}
