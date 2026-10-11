/**
 * The actions of a failed run's decision card (`failed-runs.ts`), in the inbox's order: retry (the recommended one),
 * leave it, and give the issue to a person, which opens a member picker.
 */
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcwIcon, UserRoundIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { MemberPicker } from '@/components/member-picker';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';

import { useNotify } from '../../access/notify.js';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import type { ProjectsModel } from './projects.js';
import { paramsOf } from './projects-wording.js';

type FailedRunAction = 'retry' | 'reassign' | 'cancel';

export function FailedRunActions({
  entry,
  model,
  onDecided,
}: InboxPartProps<ProjectsModel>): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const pm = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [picking, setPicking] = useState(false);
  const [person, setPerson] = useState<string | null>(null);
  const runId = paramsOf(entry).runId ?? '';
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => pm.members(),
    staleTime: 60_000,
    enabled: picking,
  });
  const decide = useMutation({
    mutationFn: (request: { action: FailedRunAction; userId?: string }) =>
      api.request({
        method: 'POST',
        path: `failedRuns/${encodeURIComponent(runId)}/decide`,
        json: request,
      }),
    onSuccess: (_, request) => {
      const name =
        members.data?.find((member) => member.userId === request.userId)
          ?.name ?? '';
      notify.success(t(`inbox.runFailed.done.${request.action}`, { name }));
      setPicking(false);
      onDecided();
    },
    onError: (error) =>
      error instanceof ApiClientError &&
      (error.reason === 'DECISION_ALREADY_TAKEN' || error.status === 409)
        ? notify.error(null, t('inbox.request.conflict'))
        : notify.error(error),
    onSettled: () => {
      for (const queryKey of [inboxKeys.all, ['pm', 'issue'], pmKeys.issues])
        void queryClient.invalidateQueries({ queryKey });
    },
  });
  const pending = decide.isPending ? decide.variables.action : null;
  const executor = model.detail.data?.executor;
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        disabled={decide.isPending}
        data-action='retry'
        onClick={() => decide.mutate({ action: 'retry' })}
      >
        {pending === 'retry' ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <RotateCcwIcon data-icon='inline-start' />
        )}
        {t('inbox.runFailed.retry')}
      </Button>
      <Button
        variant='outline'
        disabled={decide.isPending}
        data-action='cancel'
        onClick={() => decide.mutate({ action: 'cancel' })}
      >
        {pending === 'cancel' ? <Spinner data-icon='inline-start' /> : null}
        {t('inbox.runFailed.cancel')}
      </Button>
      <Popover open={picking} onOpenChange={setPicking}>
        <PopoverTrigger
          render={
            <Button
              variant='outline'
              disabled={decide.isPending}
              data-action='reassign'
            />
          }
        >
          {pending === 'reassign' ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <UserRoundIcon data-icon='inline-start' />
          )}
          {t('inbox.runFailed.reassign')}
        </PopoverTrigger>
        <PopoverContent align='start' className='w-72 space-y-3'>
          <p className='text-sm font-medium'>
            {t('inbox.runFailed.reassignTitle')}
          </p>
          <MemberPicker
            value={person}
            onChange={setPerson}
            placeholder={t('inbox.runFailed.pickPerson')}
            exclude={
              executor?.type === 'user' && executor.id ? [executor.id] : []
            }
          />
          <div className='flex justify-end gap-2'>
            <Button size='sm' variant='ghost' onClick={() => setPicking(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              disabled={!person || decide.isPending}
              onClick={() =>
                person
                  ? decide.mutate({ action: 'reassign', userId: person })
                  : undefined
              }
            >
              {pending === 'reassign' ? (
                <Spinner data-icon='inline-start' />
              ) : null}
              {t('inbox.runFailed.reassignConfirm')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
