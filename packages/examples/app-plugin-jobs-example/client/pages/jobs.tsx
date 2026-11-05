import { useEffect, useState, type ReactElement } from 'react';
import {
  createRealtimeRefresh,
  realtimeClientToken,
  useApiClient,
  usePendingFeedback,
  useService,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import { LiveIndicator } from '../components/live-indicator.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { TaskProgress } from '../components/task-progress.js';
import {
  createJobTask,
  errorMessage,
  JOB_TASKS_TOPIC,
  listJobTasks,
  mergeJobTask,
  type JobTask,
} from '../lib/api.js';

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
    const refresh = createRealtimeRefresh(load, { delayMs: 0 });
    const subscription = realtime.watch<JobTask>(JOB_TASKS_TOPIC, {
      onEvent: ({ payload }) => {
        if (active) setTasks((current) => mergeJobTask(current, payload));
      },
      onReady: () => refresh.request(),
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

    refresh.request();
    return () => {
      active = false;
      subscription.close();
      refresh.close();
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
          <JobsLoading label={t('jobs.loading')} />
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
                    {/* A queued job has not reported progress yet, so it stays indeterminate. */}
                    <TaskProgress
                      status={task.status}
                      label={t('jobs.progress')}
                      statusLabel={t(`status.${task.status}`)}
                      percent={task.status === 'queued' ? null : task.progress}
                      continuesInBackground
                      message={
                        task.status === 'failed'
                          ? t('jobs.failed', {
                              reason: task.reason ?? t('status.failed'),
                            })
                          : undefined
                      }
                    />
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

/** The list region keeps its size at once; its text appears after the shared delay. */
function JobsLoading({ label }: { readonly label: string }): ReactElement {
  const feedback = usePendingFeedback(true);
  return (
    <div
      aria-busy='true'
      className='rounded-lg border p-12 text-center text-sm text-muted-foreground'
    >
      {feedback.visible ? <span role='status'>{label}</span> : null}
    </div>
  );
}
