import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useOutletContext } from 'react-router';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  TaskBody,
  TaskUserBody,
} from '@nocobase/app-plugin-notification-example/realtime';
import { RouteDialog } from '../../components/route-dialog.js';
import { useRouteOverlay } from '../../components/use-route-overlay.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Textarea } from '../../components/ui/textarea.js';
import { Label } from '../../components/ui/label.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select.js';
import { BusinessFailure } from './shared.js';
import { useBusinessData } from './use-business-data.js';
import type { TaskViewContext } from './tasks.js';

export default function TaskCreate(): ReactElement {
  const { t } = useTranslation();
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const users = useBusinessData<{ data: TaskUserBody[] }>(
    '/notificationExample/assignees',
  );
  const { saved } = useOutletContext<TaskViewContext>();
  return (
    <RouteDialog
      title={t('business.tasks.create')}
      description={t('business.form.help')}
      className='sm:max-w-md'
      beforeClose={() => !pendingRef.current}
      footer={
        <TaskFormFooter
          pending={pending}
          unavailable={users.loading || !users.data}
        />
      }
    >
      <TaskForm
        pendingRef={pendingRef}
        pending={pending}
        setPending={setPending}
        users={users}
        saved={saved}
      />
    </RouteDialog>
  );
}
function TaskForm({
  pendingRef,
  pending,
  setPending,
  users,
  saved,
}: {
  pendingRef: { current: boolean };
  pending: boolean;
  setPending: (value: boolean) => void;
  users: ReturnType<typeof useBusinessData<{ data: TaskUserBody[] }>>;
  saved(this: void, task: TaskBody): Promise<void>;
}): ReactElement {
  const { t } = useTranslation();
  const { session } = useAuthentication();
  const api = useApiClient();
  const toast = useToaster();
  const { close } = useRouteOverlay();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(session!.user.id);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<unknown>();
  const requestRef = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => requestRef.current?.abort(), []);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const assigneeRef = useRef<HTMLButtonElement>(null);
  const invalidTitle =
    submitted && (!title.trim() || title.trim().length > 200);
  const invalidDescription = submitted && !description.trim();
  const invalidAssignee =
    submitted &&
    (!users.data?.data.some((user) => user.id === assigneeId) ||
      (failure instanceof ApiClientError &&
        failure.reason === 'ASSIGNEE_NOT_FOUND'));
  return (
    <form
      id='realtime-task-create'
      className='flex flex-col gap-4'
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pendingRef.current) return;
        setSubmitted(true);
        if (!title.trim() || title.trim().length > 200) {
          titleRef.current?.focus();
          return;
        }
        if (!description.trim()) {
          descriptionRef.current?.focus();
          return;
        }
        if (!users.data?.data.some((user) => user.id === assigneeId)) {
          assigneeRef.current?.focus();
          return;
        }
        pendingRef.current = true;
        setPending(true);
        setFailure(undefined);
        const request = new AbortController();
        requestRef.current = request;
        void api
          .request<{ data: TaskBody }>({
            path: '/notificationExample/tasks',
            signal: request.signal,
            method: 'POST',
            json: {
              title: title.trim(),
              description: description.trim(),
              assigneeId,
            },
          })
          .then(async (response) => {
            if (request.signal.aborted) return;
            await saved(response.data);
            pendingRef.current = false;
            toast.show({
              type: 'success',
              title: t('business.created', { title: title.trim() }),
            });
            await close();
          })
          .catch((error: unknown) => {
            if (request.signal.aborted) return;
            setFailure(error);
            if (
              error instanceof ApiClientError &&
              error.reason === 'ASSIGNEE_NOT_FOUND'
            )
              assigneeRef.current?.focus();
          })
          .finally(() => {
            pendingRef.current = false;
            if (!request.signal.aborted) setPending(false);
          });
      }}
    >
      <BusinessFailure error={failure} />
      <div className='flex flex-col gap-2'>
        <Label htmlFor='task-title'>{t('business.form.title')} *</Label>
        <Input
          ref={titleRef}
          id='task-title'
          value={title}
          disabled={pending}
          aria-invalid={invalidTitle}
          aria-describedby={invalidTitle ? 'task-title-error' : undefined}
          onChange={(e) => setTitle(e.target.value)}
        />
        {invalidTitle ? (
          <p id='task-title-error' className='text-sm text-destructive'>
            {t('business.form.titleRequired')}
          </p>
        ) : null}
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='task-description'>
          {t('business.form.description')} *
        </Label>
        <Textarea
          ref={descriptionRef}
          id='task-description'
          value={description}
          disabled={pending}
          aria-invalid={invalidDescription}
          aria-describedby={
            invalidDescription ? 'task-description-error' : undefined
          }
          onChange={(e) => setDescription(e.target.value)}
        />
        {invalidDescription ? (
          <p id='task-description-error' className='text-sm text-destructive'>
            {t('business.form.descriptionRequired')}
          </p>
        ) : null}
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='task-assignee'>{t('business.assignee')} *</Label>
        <BusinessFailure
          error={users.error}
          retry={() => void users.reload()}
        />
        {users.loading ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('loading')}
          </p>
        ) : null}
        <Select
          value={assigneeId}
          disabled={pending || users.loading}
          onValueChange={(id) => {
            if (id) {
              setAssigneeId(id);
              setFailure(undefined);
            }
          }}
        >
          <SelectTrigger
            ref={assigneeRef}
            id='task-assignee'
            className='w-full'
            aria-invalid={invalidAssignee}
            aria-describedby={
              invalidAssignee ? 'task-assignee-error' : undefined
            }
          >
            <SelectValue>
              {users.data?.data.find((user) => user.id === assigneeId)?.name ??
                t('business.form.choose')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {users.data?.data.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name ?? user.email ?? user.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {invalidAssignee ? (
          <p id='task-assignee-error' className='text-sm text-destructive'>
            {t('business.form.assigneeRequired')}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function TaskFormFooter({
  pending,
  unavailable,
}: {
  pending: boolean;
  unavailable: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <>
      <Button variant='outline' disabled={pending} onClick={() => void close()}>
        {t('business.cancel')}
      </Button>
      <Button
        type='submit'
        form='realtime-task-create'
        disabled={pending || unavailable}
      >
        {pending ? t('business.saving') : t('business.create')}
      </Button>
    </>
  );
}
