/**
 * A shared app host: the environments page lists each one once (`SharedHostSection`) with who runs there and why, who
 * waits and for what, and the shared process's memory as one total (it cannot be divided among the Apps). An App's page
 * mentions its host only when the host affects it (`SharedHostNotice`), with a link to that block for those who may
 * read the environments page.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { AppSummary, SharedHostView } from '../../shared/releases.js';
import { messageText } from '../lib/errors.js';
import {
  hostNoticeOf,
  occupantReasons,
  occupantState,
  sharedHostAnchor,
} from '../lib/host-occupants.js';
import { formatDate, formatSize } from '../lib/format.js';
import { useReleasesPaths } from '../lib/paths.js';
import { DataTable } from './data-table.js';
import { Section } from './section.js';
import { Tag, type Tone } from './tag.js';
import { Alert, AlertDescription, AlertTitle } from './ui/alert.js';

const STATE_TONE: Readonly<Record<string, Tone>> = {
  running: 'green',
  starting: 'blue',
  pending: 'blue',
  failed: 'red',
};

/**
 * One line on an App's page while its shared host affects it, null otherwise. `canReadEnvironments` adds the link to
 * the host's block on the environments page, which needs the `rel.environments` `read` setting.
 */
export function SharedHostNotice({
  summary,
  canReadEnvironments,
}: {
  readonly summary: AppSummary;
  readonly canReadEnvironments: boolean;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const paths = useReleasesPaths();
  const notice = hostNoticeOf(summary);
  if (!notice || !summary.host) return null;
  return (
    <Alert role='status' data-slot='shared-host-notice'>
      {notice.startsWith('ui.sharedHost.recycling.') ? (
        <RefreshCwIcon />
      ) : (
        <TriangleAlertIcon />
      )}
      <AlertTitle className='flex flex-wrap items-baseline gap-x-3 gap-y-1 font-normal'>
        <span>{t(notice)}</span>
        {canReadEnvironments ? (
          <Link
            to={`${paths.environments}#${sharedHostAnchor(summary.host.id)}`}
            className='text-primary underline-offset-4 hover:underline'
          >
            {t('ui.sharedHost.view')}
          </Link>
        ) : null}
      </AlertTitle>
    </Alert>
  );
}

export function SharedHostSection({
  host,
}: {
  readonly host: SharedHostView;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const memory = host.memory;
  return (
    <Section
      id={sharedHostAnchor(host.id)}
      className='scroll-mt-4'
      title={t('ui.sharedHost.title')}
      count={host.occupants.length}
      description={t('ui.sharedHost.description')}
    >
      <div className='space-y-1 text-sm' data-slot='shared-host-summary'>
        {host.environments.length > 0 ? (
          <p className='text-muted-foreground'>
            {t('ui.sharedHost.environments', {
              names: host.environments
                .map((environment) => environment.name)
                .join(', '),
            })}
          </p>
        ) : null}
        <p>
          {t('ui.sharedHost.summary', {
            running: host.running,
            deployed: host.deployed,
          })}
        </p>
        {memory ? (
          <p className='text-muted-foreground tabular-nums'>
            {t('ui.sharedHost.memory', {
              heapUsed: formatSize(memory.heapUsed),
              heapLimit: formatSize(memory.heapLimit),
              rss: formatSize(memory.rss),
              available: formatSize(memory.available),
            })}{' '}
            <span className='text-xs'>{t('ui.sharedHost.memoryNote')}</span>
          </p>
        ) : null}
      </div>
      {host.recycling ? (
        <Alert role='status' data-slot='shared-host-recycling'>
          <RefreshCwIcon />
          <AlertTitle className='font-normal'>
            {t(`ui.sharedHost.recycling.${host.recycling}`)}
          </AlertTitle>
        </Alert>
      ) : null}
      {host.failedEnvironments.map((environment) => (
        <Alert
          key={environment.id}
          variant='destructive'
          data-slot='shared-host-restore-failed'
        >
          <TriangleAlertIcon />
          <AlertTitle className='font-normal'>
            {t('ui.sharedHost.restoreFailed', {
              name: environment.name ?? environment.id,
            })}
          </AlertTitle>
          {environment.error ? (
            <AlertDescription className='break-words'>
              {messageText(t, environment.error)}
            </AlertDescription>
          ) : null}
        </Alert>
      ))}
      <DataTable
        columns={[
          {
            id: 'app',
            header: t('ui.sharedHost.columns.app'),
            cell: ({ row }) =>
              row.original.app ? (
                <div className='min-w-0'>
                  <div className='truncate font-medium'>
                    {row.original.app.name}
                  </div>
                  <div className='truncate text-xs text-muted-foreground'>
                    {row.original.app.environmentName}
                  </div>
                </div>
              ) : (
                <span className='text-muted-foreground'>
                  {t('ui.sharedHost.hidden')}
                </span>
              ),
          },
          {
            id: 'state',
            header: t('ui.sharedHost.columns.state'),
            meta: { className: 'w-48' },
            cell: ({ row }) => {
              const state = occupantState(row.original);
              return (
                <Tag
                  tone={
                    STATE_TONE[state] ??
                    (state.startsWith('waiting') ? 'amber' : 'grey')
                  }
                  dot
                  title={
                    row.original.error
                      ? messageText(t, row.original.error)
                      : undefined
                  }
                >
                  {t(`ui.state.${state}`)}
                </Tag>
              );
            },
          },
          {
            id: 'why',
            header: t('ui.sharedHost.columns.why'),
            cell: ({ row }) => (
              <span className='text-muted-foreground'>
                {occupantReasons(row.original)
                  .map((key) => t(key))
                  .join(' · ')}
              </span>
            ),
          },
          {
            id: 'lastAccess',
            header: t('ui.sharedHost.columns.lastAccess'),
            meta: { className: 'w-44' },
            cell: ({ row }) => (
              <span className='tabular-nums'>
                {formatDate(row.original.lastAccessedAt, i18n.language)}
              </span>
            ),
          },
        ]}
        data={host.occupants}
        getRowId={(occupant) =>
          occupant.app?.id ??
          `hidden-${host.occupants.indexOf(occupant).toString()}`
        }
        emptyMessage={t('ui.sharedHost.empty')}
        scroll
      />
    </Section>
  );
}
