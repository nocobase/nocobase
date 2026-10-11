/**
 * The actions of an agent's blocked card (`blocked.ts`): answer (a comment the agent hears), unblock (back to the
 * status it was blocked from) and give the issue to a person, through the projects plugin's API.
 */
import { ApiClientError } from '@nocobase/app-client';
import {
  PmStatusBadge,
  pmKeys,
  usePmApi,
} from '@nocobase/app-plugin-projects/client/kit';
import { INITIAL_STATUS } from '@nocobase/app-plugin-projects/shared/workflows';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquareReplyIcon,
  UnlockIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { MemberPicker } from '@/components/member-picker';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { useNotify } from '../../access/notify.js';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import type { ProjectsModel } from './projects.js';
import { paramsOf, useParamsOf } from './projects-wording.js';

type BlockedAction =
  | { readonly action: 'answer'; readonly content: string }
  | { readonly action: 'unblock' }
  | { readonly action: 'reassign'; readonly userId: string };

export function BlockedActions({
  entry,
  model,
  onDecided,
}: InboxPartProps<ProjectsModel>): ReactElement {
  const { t } = useTranslation();
  const pm = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<'answer' | 'reassign' | null>(null);
  const [answer, setAnswer] = useState('');
  const [person, setPerson] = useState<string | null>(null);
  const params = paramsOf(entry);
  const issue = model.detail.data;
  const issueId = model.issueId ?? '';
  // Back to where the agent was working when it got blocked.
  const back =
    params.from && params.from !== 'blocked' ? params.from : INITIAL_STATUS;
  const act = useMutation({
    mutationFn: async (request: BlockedAction) => {
      if (request.action === 'answer') {
        await pm.createComment(issueId, { content: request.content });
        return;
      }
      const revision = issue?.revision ?? 0;
      await pm.updateIssue(
        issueId,
        request.action === 'unblock'
          ? { revision, statusKey: back }
          : { revision, executor: { type: 'user', id: request.userId } },
      );
    },
    onSuccess: (_, request) => {
      notify.success(t(`inbox.blocked.done.${request.action}`));
      setOpen(null);
      setAnswer('');
      onDecided();
    },
    onError: (error) =>
      error instanceof ApiClientError && error.status === 409
        ? notify.error(null, t('inbox.request.conflict'))
        : notify.error(error),
    onSettled: () => {
      for (const queryKey of [inboxKeys.all, ['pm', 'issue'], pmKeys.issues])
        void queryClient.invalidateQueries({ queryKey });
    },
  });
  const pending = act.isPending ? act.variables.action : null;
  const busy = act.isPending || !issue;
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Popover
        open={open === 'answer'}
        onOpenChange={(next) => setOpen(next ? 'answer' : null)}
      >
        <PopoverTrigger
          render={<Button disabled={busy} data-action='answer' />}
        >
          {pending === 'answer' ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <MessageSquareReplyIcon data-icon='inline-start' />
          )}
          {t('inbox.blocked.answer')}
        </PopoverTrigger>
        <PopoverContent align='start' className='w-80 space-y-3'>
          <p className='text-sm font-medium'>
            {t('inbox.blocked.answerTitle')}
          </p>
          <Textarea
            value={answer}
            rows={4}
            autoFocus
            aria-label={t('inbox.blocked.answerTitle')}
            placeholder={t('inbox.blocked.answerPlaceholder')}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <div className='flex justify-end gap-2'>
            <Button size='sm' variant='ghost' onClick={() => setOpen(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              disabled={!answer.trim() || act.isPending}
              onClick={() =>
                act.mutate({ action: 'answer', content: answer.trim() })
              }
            >
              {pending === 'answer' ? (
                <Spinner data-icon='inline-start' />
              ) : null}
              {t('inbox.blocked.send')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        variant='outline'
        disabled={busy}
        data-action='unblock'
        title={t('inbox.blocked.unblockHint')}
        onClick={() => act.mutate({ action: 'unblock' })}
      >
        {pending === 'unblock' ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <UnlockIcon data-icon='inline-start' />
        )}
        {t('inbox.blocked.unblock')}
        {issue ? (
          <PmStatusBadge statusKey={back} statuses={issue.statuses} />
        ) : null}
      </Button>
      <Popover
        open={open === 'reassign'}
        onOpenChange={(next) => setOpen(next ? 'reassign' : null)}
      >
        <PopoverTrigger
          render={
            <Button variant='outline' disabled={busy} data-action='reassign' />
          }
        >
          {pending === 'reassign' ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <UserRoundIcon data-icon='inline-start' />
          )}
          {t('inbox.blocked.reassign')}
        </PopoverTrigger>
        <PopoverContent align='start' className='w-72 space-y-3'>
          <p className='text-sm font-medium'>
            {t('inbox.runFailed.reassignTitle')}
          </p>
          <MemberPicker
            value={person}
            onChange={setPerson}
            placeholder={t('inbox.runFailed.pickPerson')}
          />
          <div className='flex justify-end gap-2'>
            <Button size='sm' variant='ghost' onClick={() => setOpen(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              disabled={!person || act.isPending}
              onClick={() =>
                person
                  ? act.mutate({ action: 'reassign', userId: person })
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

/** The agent's question, quoted, for the issue page's card. */
export function BlockedBrief({
  entry,
}: InboxPartProps<ProjectsModel>): ReactElement | null {
  const { t } = useTranslation();
  const params = useParamsOf()(entry);
  if (!params.question) return null;
  return (
    <blockquote
      className='rounded-md border-l-2 bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere'
      aria-label={t('inbox.blocked.question', {
        actor: params.actorName ?? t('inbox.someone'),
      })}
    >
      {params.question}
    </blockquote>
  );
}
