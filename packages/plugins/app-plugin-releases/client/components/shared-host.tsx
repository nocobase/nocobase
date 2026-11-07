/**
 * A shared app host: the environments page shows each one once as a capacity card (`SharedHostSection`) — how many
 * Apps run or start against its limit, the shared process's memory as one total (it cannot be divided among the Apps),
 * its restart state and the environments it could not restore — with a link to those Apps in the Apps list. An App's
 * page mentions its host only when the host affects it (`SharedHostNotice`), linking to the card for those who may read
 * the environments page.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { AppSummary, SharedHostView } from '../../shared/releases.js';
import { messageText } from '../lib/errors.js';
import { formatSize } from '../lib/format.js';
import { useReleasesPaths } from '../lib/paths.js';
import {
  hostAppsSearch,
  hostNoticeOf,
  sharedHostAnchor,
} from '../lib/runtime-state.js';
import { Alert, AlertDescription, AlertTitle } from './ui/alert.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card.js';
import { Progress, ProgressLabel, ProgressValue } from './ui/progress.js';

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

function Meter({
  label,
  value,
  max,
}: {
  readonly label: string;
  readonly value: number;
  readonly max: number;
}): ReactElement {
  return (
    <Progress
      value={max > 0 ? Math.min(100, (value / max) * 100) : 0}
      className='gap-1.5'
    >
      <ProgressLabel className='text-sm font-normal tabular-nums'>
        {label}
      </ProgressLabel>
      <ProgressValue className='sr-only' />
    </Progress>
  );
}

/**
 * One host's capacity card. Its counts are the whole host's, every environment on it included; the link to the Apps
 * list shows `canListApps` readers the running Apps they may view.
 */
export function SharedHostSection({
  host,
  canListApps,
}: {
  readonly host: SharedHostView;
  readonly canListApps: boolean;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const paths = useReleasesPaths();
  const memory = host.memory;
  return (
    <Card id={sharedHostAnchor(host.id)} className='scroll-mt-4'>
      <CardHeader>
        <CardTitle>{t('ui.sharedHost.title')}</CardTitle>
        <CardDescription>
          {host.environments.length > 0
            ? t('ui.sharedHost.environments', {
                names: host.environments
                  .map((environment) => environment.name)
                  .join(', '),
              })
            : t('ui.sharedHost.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-4 md:grid-cols-3'>
          {host.maxActive ? (
            <Meter
              label={t('ui.sharedHost.running', {
                running: host.running,
                limit: host.maxActive,
              })}
              value={host.running}
              max={host.maxActive}
            />
          ) : (
            <p className='text-sm tabular-nums'>
              {t('ui.sharedHost.runningUnlimited', { running: host.running })}
            </p>
          )}
          {memory ? (
            <>
              <Meter
                label={t('ui.sharedHost.heap', {
                  used: formatSize(memory.heapUsed),
                  limit: formatSize(memory.heapLimit),
                })}
                value={memory.heapUsed}
                max={memory.heapLimit}
              />
              <Meter
                label={t('ui.sharedHost.process', {
                  rss: formatSize(memory.rss),
                  available: formatSize(memory.available),
                })}
                value={memory.rss}
                max={memory.rss + memory.available}
              />
            </>
          ) : null}
        </div>
        <p className='text-xs text-muted-foreground'>
          {t('ui.sharedHost.deployed', { count: host.deployed })} ·{' '}
          {t('ui.sharedHost.wholeHost')}
        </p>
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
      </CardContent>
      {canListApps && host.environments.length > 0 ? (
        <CardFooter className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
          <Link
            to={`${paths.apps}${hostAppsSearch(host)}`}
            className='text-sm text-primary underline-offset-4 hover:underline'
          >
            {t('ui.sharedHost.viewApps', { count: host.running })}
          </Link>
          <span className='text-xs text-muted-foreground'>
            {t('ui.sharedHost.viewAppsNote')}
          </span>
        </CardFooter>
      ) : null}
    </Card>
  );
}
