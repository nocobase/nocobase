import { useEffect, useState, type ReactElement } from 'react';
import {
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import { LiveIndicator } from '../components/live-indicator.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '../components/ui/progress.js';
import {
  createJobTask,
  errorMessage,
  JOB_TASKS_TOPIC,
  listJobTasks,
  mergeJobTask,
  type JobTask,
  type JobTaskStatus,
} from '../lib/api.js';

const STATUS_VARIANT: Record<
  JobTaskStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  queued: 'outline',
  running: 'secondary',
  completed: 'default',
  failed: 'destructive',
};

export default function JobsPage(): ReactElement {
  const { i18n, t } = useTranslation('@nocobase/app-plugin-jobs-example');
  const api = useApiClient();
  const realtime = useService(realtimeClientToken);
  const [tasks, setTasks] = useState<readonly JobTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    // Subscribing opens the WebSocket, and leaving the page unsubscribes: the
    // client closes the connection once no page listens to any topic.
    const unsubscribe = realtime.subscribe<JobTask>(
      JOB_TASKS_TOPIC,
      (event) => {
        if (active) setTasks((current) => mergeJobTask(current, event.payload));
      },
    );
    const stopOpen = realtime.onOpen(() => {
      // Changes published while the socket was down are not replayed, so
      // every (re)connection reloads the list it may have missed.
      void load();
    });

    async function load(): Promise<void> {
      try {
        const loaded = await listJobTasks(api);
        if (!active) return;
        setTasks((current) => loaded.reduce(mergeJobTask, current));
        setError('');
      } catch (cause) {
        if (active) setError(errorMessage(cause));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      stopOpen();
      unsubscribe();
    };
  }, [api, realtime]);

  async function create(): Promise<void> {
    setCreating(true);
    setError('');
    try {
      const task = await createJobTask(api);
      setTasks((current) => mergeJobTask(current, task));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setCreating(false);
    }
  }

  function formatTime(value: string): string {
    return new Intl.DateTimeFormat(i18n.language, {
      timeStyle: 'medium',
    }).format(new Date(value));
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('jobs.title')}
        description={t('jobs.description')}
        actions={
          <Button disabled={creating} onClick={() => void create()}>
            {creating ? t('jobs.creating') : t('jobs.create')}
          </Button>
        }
      />
      {error ? (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      ) : null}
      <section className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-base font-semibold'>
            {t('jobs.listTitle')}
            <span className='ml-2 text-sm font-normal text-muted-foreground'>
              {t('jobs.count', { count: tasks.length })}
            </span>
          </h2>
          <LiveIndicator
            realtime={realtime}
            live={t('jobs.live')}
            offline={t('jobs.offline')}
          />
        </div>
        {loading ? (
          <div className='rounded-lg border p-12 text-center text-sm text-muted-foreground'>
            {t('jobs.loading')}
          </div>
        ) : !tasks.length ? (
          <p className='rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground'>
            {t('jobs.empty')}
          </p>
        ) : (
          <ul
            aria-label={t('jobs.listTitle')}
            className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
          >
            {tasks.map((task) => (
              <li key={task.jobId}>
                <Card size='sm'>
                  <CardHeader>
                    <div className='flex items-start justify-between gap-3'>
                      <CardTitle className='font-mono text-sm'>
                        {t('jobs.job', { id: task.jobId.slice(0, 8) })}
                      </CardTitle>
                      <Badge variant={STATUS_VARIANT[task.status]}>
                        {t(`status.${task.status}`)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {t('jobs.createdAt', {
                        time: formatTime(task.createdAt),
                      })}
                      {task.attempt > 1
                        ? ` · ${t('jobs.attempt', { attempt: task.attempt })}`
                        : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={task.progress}>
                      <ProgressLabel>{t('jobs.progress')}</ProgressLabel>
                      <ProgressValue />
                    </Progress>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
