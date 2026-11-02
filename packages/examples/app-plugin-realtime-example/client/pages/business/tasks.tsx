import { useCallback, useRef, type ReactElement } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  TASKS_TOPIC,
  type TaskBody,
  type TaskStatus,
} from '@nocobase/app-plugin-notification-example/realtime';
import { useBusinessTask } from './use-business-task.js';
import { Button } from '../../components/ui/button.js';
import { Badge } from '../../components/ui/badge.js';
import { Card, CardContent, CardHeader } from '../../components/ui/card.js';
import {
  BusinessShell,
  BusinessEmpty,
  BusinessFailure,
  BusinessLoading,
  TaskLink,
} from './shared.js';
import { useBusinessData } from './use-business-data.js';

interface TaskList {
  data: TaskBody[];
  meta: { page: number; pageSize: number; total: number };
}
export interface TaskViewContext {
  reload(this: void): Promise<void>;
  saved(this: void, task: TaskBody): Promise<void>;
  denied(this: void, id: string, error: ApiClientError): void;
}
export function TaskAction({
  task,
  saved,
  denied,
}: {
  task: TaskBody;
  saved(this: void, task: TaskBody): Promise<void>;
  denied(this: void, error: ApiClientError): void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toast = useToaster();
  const action = useBusinessTask();
  const target =
    task.status === 'open'
      ? 'in-progress'
      : task.status === 'in-progress'
        ? 'done'
        : 'open';
  return (
    <Button
      variant='outline'
      size='sm'
      disabled={action.pending}
      onClick={() =>
        void action.run(async (signal) => {
          try {
            const response = await api.request<{ data: TaskBody }>({
              path: `/notificationExample/tasks/${task.id}`,
              method: 'PATCH',
              json: { status: target },
              signal,
            });
            toast.show({ type: 'success', title: t('business.saved') });
            await saved(response.data);
          } catch (error) {
            if (
              error instanceof ApiClientError &&
              [401, 403, 404].includes(error.status)
            )
              denied(error);
            throw error;
          }
        }, false)
      }
    >
      {action.pending ? t('business.saving') : t(`business.actions.${target}`)}
    </Button>
  );
}
export default function TasksPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useSearchParams();
  const location = useLocation();
  const page = Math.max(1, Number(search.get('page')) || 1);
  const query = useBusinessData<TaskList>(
    `/notificationExample/tasks?page=${page}&pageSize=30`,
    TASKS_TOPIC,
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const { setData, reload, fail } = query;
  const saved = useCallback(
    async (task: TaskBody) => {
      setData((previous) => {
        if (!previous)
          return { data: [task], meta: { page: 1, pageSize: 30, total: 1 } };
        const existing = previous.data.some((item) => item.id === task.id);
        return {
          data: existing
            ? previous.data.map((item) => (item.id === task.id ? task : item))
            : [task, ...previous.data].slice(0, 30),
          meta: {
            ...previous.meta,
            total: previous.meta.total + (existing ? 0 : 1),
          },
        };
      });
      await reload();
    },
    [setData, reload],
  );
  const denied = useCallback(
    (id: string, error: ApiClientError) => {
      if (error.status === 401) {
        fail(error);
        return;
      }
      setData(
        (previous) =>
          previous && {
            ...previous,
            data: previous.data.filter((item) => item.id !== id),
            meta: {
              ...previous.meta,
              total:
                previous.meta.total -
                (previous.data.some((item) => item.id === id) ? 1 : 0),
            },
          },
      );
      void reload();
    },
    [setData, reload, fail],
  );
  const create = (
    <Button
      nativeButton={false}
      role='link'
      render={<Link to={{ pathname: 'new', search: location.search }} />}
    >
      {t('business.tasks.create')}
    </Button>
  );
  const statuses: readonly TaskStatus[] = ['open', 'in-progress', 'done'];
  return (
    <BusinessShell
      name='tasks'
      actions={query.data?.meta.total ? create : undefined}
    >
      <BusinessFailure error={query.error} retry={() => void query.reload()} />
      {!query.data && !query.error ? <BusinessLoading layout='board' /> : null}
      {query.data ? (
        <>
          {query.loading ? (
            <p role='status' className='text-sm text-muted-foreground'>
              {t('business.updating')}
            </p>
          ) : null}
          {!query.data.meta.total ? (
            <BusinessEmpty name='tasks'>{create}</BusinessEmpty>
          ) : (
            <>
              <p className='text-sm text-muted-foreground'>
                {t('business.tasks.page', {
                  count: query.data.meta.total,
                  page: query.data.meta.page,
                })}
              </p>
              <div
                ref={boardRef}
                tabIndex={-1}
                aria-label={t('business.tasks.title')}
                className='grid items-start gap-4 lg:grid-cols-3'
              >
                {statuses.map((status) => (
                  <section
                    key={status}
                    className='flex min-w-0 flex-col gap-3 rounded-lg bg-muted/50 p-4'
                    aria-label={t(`business.status.${status}`)}
                  >
                    <h2 className='flex items-center justify-between gap-2 text-base font-medium'>
                      {t(`business.status.${status}`)}
                      <Badge variant='secondary'>
                        {
                          query.data!.data.filter(
                            (task) => task.status === status,
                          ).length
                        }
                      </Badge>
                    </h2>
                    {query
                      .data!.data.filter((task) => task.status === status)
                      .map((task) => (
                        <Card key={task.id}>
                          <CardHeader>
                            <TaskLink id={task.id}>{task.title}</TaskLink>
                          </CardHeader>
                          <CardContent className='flex flex-col gap-3'>
                            <p className='break-words text-sm text-muted-foreground'>
                              {t('business.assignee')}:{' '}
                              {task.assignee.name ?? task.assigneeId}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {new Date(task.updatedAt).toLocaleString(
                                i18n.language,
                              )}
                            </p>
                            <TaskAction
                              task={task}
                              saved={async (updated) => {
                                boardRef.current?.focus();
                                await saved(updated);
                              }}
                              denied={(error) => denied(task.id, error)}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    {!query.data!.data.some(
                      (task) => task.status === status,
                    ) ? (
                      <p className='py-4 text-sm text-muted-foreground'>
                        {t('business.tasks.stageEmpty')}
                      </p>
                    ) : null}
                  </section>
                ))}
              </div>
              {query.data.meta.total > 30 || query.data.meta.page > 1 ? (
                <div className='flex flex-wrap items-center justify-end gap-2'>
                  <Button
                    variant='outline'
                    disabled={query.loading || query.data.meta.page <= 1}
                    onClick={() =>
                      setSearch((value) => {
                        value.set('page', String(query.data!.meta.page - 1));
                        return value;
                      })
                    }
                  >
                    {t('business.previous')}
                  </Button>
                  <Button
                    variant='outline'
                    disabled={
                      query.loading ||
                      query.data.meta.page * 30 >= query.data.meta.total
                    }
                    onClick={() =>
                      setSearch((value) => {
                        value.set('page', String(query.data!.meta.page + 1));
                        return value;
                      })
                    }
                  >
                    {t('business.next')}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : null}
      <Outlet context={{ reload, saved, denied } satisfies TaskViewContext} />
    </BusinessShell>
  );
}
