import { useEffect, type ReactElement } from 'react';
import { useOutletContext, useParams } from 'react-router';
import {
  TASKS_TOPIC,
  type TaskBody,
} from '@nocobase/app-plugin-notification-example/realtime';
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteDrawer } from '../../components/route-drawer.js';
import { useRouteOverlay } from '../../components/use-route-overlay.js';
import { Badge } from '../../components/ui/badge.js';
import { LongText } from '../../components/long-text.js';
import { TaskAction, type TaskViewContext } from './tasks.js';
import {
  BusinessFailure,
  BusinessLoading,
  BusinessUpdating,
} from './shared.js';
import { useBusinessData } from './use-business-data.js';

export default function TaskDetail(): ReactElement {
  const { taskId } = useParams();
  return <TaskDetailView key={taskId} taskId={taskId!} />;
}
function TaskDetailView({ taskId }: { taskId: string }): ReactElement {
  const { t } = useTranslation();
  const { saved, denied } = useOutletContext<TaskViewContext>();
  const query = useBusinessData<{ data: TaskBody }>(
    `/notificationExample/tasks/${encodeURIComponent(taskId)}`,
    TASKS_TOPIC,
  );
  useEffect(() => {
    if (
      query.error instanceof ApiClientError &&
      [401, 403, 404].includes(query.error.status)
    )
      denied(taskId, query.error);
  }, [query.error, denied, taskId]);
  return (
    <RouteDrawer title={query.data?.data.title ?? t('business.detail')}>
      <DetailBody query={query} saved={saved} />
    </RouteDrawer>
  );
}
function DetailBody({
  query,
  saved,
}: {
  query: ReturnType<typeof useBusinessData<{ data: TaskBody }>>;
  saved(this: void, task: TaskBody): Promise<void>;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const { close } = useRouteOverlay();
  const task = query.data?.data;
  return (
    <div className='flex flex-col gap-4'>
      <BusinessFailure
        error={query.error}
        retry={() => void query.reload()}
        close={() => void close()}
      />
      {!task && !query.error ? <BusinessLoading layout='detail' /> : null}
      <BusinessUpdating active={Boolean(task && query.loading)} />
      {task ? (
        <>
          <dl className='grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-4 text-sm'>
            <dt className='text-muted-foreground'>
              {t('business.statusLabel')}
            </dt>
            <dd>
              <Badge variant='secondary'>
                {t(`business.status.${task.status}`)}
              </Badge>
            </dd>
            <dt className='text-muted-foreground'>{t('business.assignee')}</dt>
            <dd className='min-w-0 break-words'>
              {task.assignee.name ?? task.assigneeId}
            </dd>
            <dt className='text-muted-foreground'>{t('business.creator')}</dt>
            <dd className='min-w-0 break-words'>
              {task.creator.name ?? task.creatorId}
            </dd>
            <dt className='text-muted-foreground'>{t('business.updated')}</dt>
            <dd className='min-w-0 break-words'>
              {new Date(task.updatedAt).toLocaleString(i18n.language)}
            </dd>
          </dl>
          <LongText>{task.description}</LongText>
          <div>
            <TaskAction
              task={task}
              denied={query.fail}
              saved={async (updated) => {
                query.setData({ data: updated });
                await saved(updated);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
