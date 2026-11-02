import type { ReactElement } from 'react';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { EXPORTS_TOPIC, type TaskExport } from '../../../shared/business.js';
import { useBusinessTask } from './use-business-task.js';
import { Card, CardHeader, CardContent } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Badge } from '../../components/ui/badge.js';
import { Progress } from '../../components/ui/progress.js';
import {
  BusinessShell,
  BusinessEmpty,
  BusinessFailure,
  BusinessLoading,
  BusinessUpdating,
} from './shared.js';
import { useBusinessData } from './use-business-data.js';

export default function ExportsPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const query = useBusinessData<{ data: TaskExport[] }>(
    '/realtimeExample/exports',
    EXPORTS_TOPIC,
  );
  const action = useBusinessTask();
  const active = query.data?.data.some((job) =>
    ['queued', 'running'].includes(job.status),
  );
  const create = (
    <Button
      disabled={action.pending || active}
      onClick={() =>
        void action.run(async (signal) => {
          const response = await api.request<{ data: TaskExport }>({
            path: '/realtimeExample/exports',
            method: 'POST',
            json: {},
            signal,
          });
          query.setData((previous) => ({
            data: [
              response.data,
              ...(previous?.data.filter((job) => job.id !== response.data.id) ??
                []),
            ].slice(0, 20),
          }));
          await query.reload();
        }, 'business.exports.accepted')
      }
    >
      {action.pending ? t('business.saving') : t('business.exports.create')}
    </Button>
  );
  return (
    <BusinessShell
      name='exports'
      actions={query.data?.data.length ? create : undefined}
    >
      <BusinessFailure error={query.error} retry={() => void query.reload()} />
      <BusinessFailure error={action.error} />
      {!query.data && !query.error ? <BusinessLoading /> : null}
      <BusinessUpdating active={Boolean(query.data && query.loading)} />
      {active ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('business.exports.active')}
        </p>
      ) : null}
      {query.data && !query.data.data.length ? (
        <BusinessEmpty name='exports'>{create}</BusinessEmpty>
      ) : null}
      <div className='flex flex-col gap-4'>
        {query.data?.data.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className='flex items-start justify-between gap-3'>
                <h2 className='text-base font-medium'>
                  {t('business.exports.file')}
                </h2>
                <Badge
                  variant={
                    job.status === 'failed' ? 'destructive' : 'secondary'
                  }
                >
                  {t(`business.jobs.${job.status}`)}
                </Badge>
              </div>
              <time className='text-sm text-muted-foreground'>
                {new Date(job.createdAt).toLocaleString(i18n.language)}
              </time>
            </CardHeader>
            <CardContent className='flex flex-col gap-3'>
              <p className='text-sm'>
                {t('business.exports.rows', {
                  processed: job.processed,
                  total: job.total,
                })}
              </p>
              {['queued', 'running'].includes(job.status) ? (
                <Progress
                  aria-label={t('business.exports.progress')}
                  value={
                    job.total
                      ? Math.floor((job.processed / job.total) * 100)
                      : 0
                  }
                />
              ) : null}
              {job.status === 'failed' ? (
                <p role='status' className='text-sm text-destructive'>
                  {t(
                    job.reason === 'limit'
                      ? 'business.exports.limit'
                      : 'business.exports.failed',
                  )}
                </p>
              ) : null}
              {job.status === 'completed' ? (
                <DownloadExport job={job} refresh={query.reload} />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {query.data?.data.length ? (
        <p className='text-sm text-muted-foreground'>
          {t('business.exports.retention')}
        </p>
      ) : null}
    </BusinessShell>
  );
}
function DownloadExport({
  job,
  refresh,
}: {
  job: TaskExport;
  refresh(this: void): Promise<void>;
}): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const action = useBusinessTask('business.exports.missing');
  return (
    <div className='flex flex-col gap-2'>
      <BusinessFailure
        error={action.error}
        messageKey={
          action.error instanceof ApiClientError && action.error.status === 404
            ? 'business.exports.missing'
            : undefined
        }
      />
      <Button
        variant='outline'
        className='self-start'
        disabled={action.pending}
        onClick={() =>
          void action
            .run(async (signal) => {
              const { data } = await api.request<{
                data: { fileName: string; content: string };
              }>({ path: `/realtimeExample/exports/${job.id}/file`, signal });
              const url = URL.createObjectURL(
                new Blob([data.content], { type: 'text/csv;charset=utf-8' }),
              );
              const link = document.createElement('a');
              link.href = url;
              link.download = data.fileName;
              document.body.append(link);
              link.click();
              link.remove();
              window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            }, 'business.exports.downloaded')
            .then((success) => {
              if (!success) void refresh();
            })
        }
      >
        {action.pending ? t('loading') : t('business.exports.download')}
      </Button>
    </div>
  );
}
