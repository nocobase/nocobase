/**
 * What runs on a project's long-lived Apps (`GET /api/deploys/projects/:projectId/environments`): for each
 * staging and production App of its repositories, the environment, the release running there with the commit it was
 * built from, who deployed it and who approved it, and a request still waiting for approval. Shown on the project's
 * Releases tab (`EnvironmentRows` inside the block's section); the issue page shows where its own change runs instead,
 * as deployment marks under its pull requests.
 */
import { PmTag } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { HourglassIcon, RocketIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import type { EnvironmentRelease } from '../../shared/previews.js';
import { useProjectEnvironments } from './use-environments.js';

function EnvironmentRow({
  item,
}: {
  readonly item: EnvironmentRelease;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const current = item.current;
  const who = [
    current?.deployedBy
      ? t('deploys.environments.deployedBy', { name: current.deployedBy })
      : null,
    current?.approvedBy
      ? t('deploys.environments.approvedBy', { name: current.approvedBy })
      : null,
    current?.promoted ? t('deploys.environments.promoted') : null,
  ].filter((part): part is string => part !== null);
  return (
    <li
      className='space-y-1 py-2 text-sm first:pt-0 last:pb-0'
      data-studio-environment={item.appId}
    >
      <div className='flex min-w-0 flex-wrap items-center gap-2'>
        <PmTag
          tone={item.role === 'production' ? 'green' : 'blue'}
          icon={<RocketIcon />}
        >
          {t(`deploys.${item.role}`)}
        </PmTag>
        <span className='min-w-0 truncate font-medium'>
          {item.environmentName}
        </span>
        <span className='min-w-0 truncate font-mono text-xs text-muted-foreground'>
          {item.appId}
        </span>
      </div>
      {current ? (
        <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground'>
          <span className='font-medium text-foreground tabular-nums'>
            {current.version ?? '—'}
          </span>
          {current.sha ? (
            <span className='font-mono'>{current.sha.slice(0, 7)}</span>
          ) : null}
          {current.deployedAt ? (
            <time dateTime={current.deployedAt}>
              {new Date(current.deployedAt).toLocaleString(i18n.language)}
            </time>
          ) : null}
          {who.length > 0 ? <span>{who.join(' · ')}</span> : null}
        </div>
      ) : (
        <p className='text-xs text-muted-foreground'>
          {t('deploys.environments.nothing')}
        </p>
      )}
      {item.pending ? (
        <p className='flex items-center gap-1 text-xs text-muted-foreground'>
          <HourglassIcon className='size-3' aria-hidden='true' />
          {t('deploys.environments.pending', {
            version: item.pending.version ?? '—',
          })}
        </p>
      ) : null}
    </li>
  );
}

/** The rows of the project's environments, or what stands in for them while loading or after a failure. */
export function EnvironmentRows({
  projectId,
}: {
  readonly projectId: string;
}): ReactElement {
  const { t } = useTranslation();
  const query = useProjectEnvironments(projectId);
  if (query.isError)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('deploys.environments.loadFailed')}
      </p>
    );
  if (!query.data) return <Skeleton className='h-12 w-full' />;
  return (
    <ul className='divide-y'>
      {query.data.items.map((item) => (
        <EnvironmentRow key={item.appId} item={item} />
      ))}
    </ul>
  );
}
