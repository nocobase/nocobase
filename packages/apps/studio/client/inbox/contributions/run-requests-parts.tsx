/**
 * The parts of a run request's inbox entries (`run-requests.ts`): the request as it was asked, in full (the card only
 * carries its beginning), and what the viewer may do with it: the owner confirms it (it runs as them) or rejects it,
 * with a note for the person who asked; that person runs an expired one as themselves.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, PlayIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';

import { useNotify } from '../../access/notify.js';
import {
  useSettleRunRequest,
  useWhy,
  type RunRequestAction,
  type RunRequestItem,
} from '../../agents/run-requests.js';
import { IssueMarkdown } from '../../issues/markdown.js';
import { RUN_REQUEST_TYPE } from '../../../shared/run-requests.js';

/** What the detail pane and the issue's card load once: the request, with its text in full. */
export interface RunRequestModel {
  readonly request: RunRequestItem | undefined;
  readonly isPending: boolean;
  readonly error: unknown;
}

/** The request as it was asked: who, why, which agent, until when, and its text in full. */
export function RunRequestSnapshot({
  request,
}: {
  readonly request: RunRequestItem;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const why = useWhy();
  const name = request.requestedByName ?? request.requestedByUserId;
  return (
    <div className='space-y-2' data-testid='run-request-snapshot'>
      <p className='text-xs text-muted-foreground'>
        {t('runRequests.meta', {
          why: why(request),
          name,
          agent: request.agentName ?? request.agentId,
          expires: new Date(request.expiresAt).toLocaleString(i18n.language),
        })}
      </p>
      <figure className='space-y-1'>
        <figcaption className='text-xs font-medium text-muted-foreground'>
          {t('runRequests.asked', { name: request.input.actor.name || name })}
        </figcaption>
        <div className='max-h-80 overflow-auto rounded-md border bg-muted/40 px-3 py-2 text-sm'>
          <IssueMarkdown content={request.input.text} />
        </div>
      </figure>
    </div>
  );
}

/** Everything below the header: the request in full, or why it is not there. */
export function RunRequestBody({
  model,
}: InboxPartProps<RunRequestModel>): ReactElement | null {
  const { t } = useTranslation();
  if (model.isPending)
    return (
      <div className='space-y-2'>
        <Skeleton className='h-4 w-2/3' />
        <Skeleton className='h-20 w-full' />
      </div>
    );
  if (!model.request)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('runRequests.loadFailed')}
      </p>
    );
  return (
    <div className='space-y-3'>
      {model.request.status === 'pending' ? null : (
        <p className='text-sm text-muted-foreground'>
          {t(`runRequests.statuses.${model.request.status}`)}
        </p>
      )}
      <RunRequestSnapshot request={model.request} />
    </div>
  );
}

/** On the issue's "Waiting for you": the request in full, so the owner reads what they confirm. */
export function RunRequestBrief({
  model,
}: InboxPartProps<RunRequestModel>): ReactElement | null {
  return model.request ? <RunRequestSnapshot request={model.request} /> : null;
}

/** What the owner decides, or what the person who asked does with an expired one. */
export function RunRequestActions({
  entry,
  model,
  onDecided,
}: InboxPartProps<RunRequestModel>): ReactElement | null {
  const { t } = useTranslation();
  const notify = useNotify();
  const settle = useSettleRunRequest();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const request = model.request;
  if (!request) return null;
  const pending = settle.isPending ? settle.variables.action : null;
  const run = (action: RunRequestAction, done: string, text?: string) =>
    settle.mutate(
      { id: request.id, action, ...(text ? { note: text } : {}) },
      {
        onSuccess: () => {
          notify.success(done);
          setRejecting(false);
          onDecided();
        },
        onError: (error) =>
          error instanceof ApiClientError && error.status === 409
            ? notify.error(null, t('errors.RUN_REQUEST_SETTLED'))
            : notify.error(error),
      },
    );

  if (entry.notice?.type !== RUN_REQUEST_TYPE)
    return (
      <Button
        disabled={settle.isPending}
        data-action='runAsMe'
        onClick={() => run('runAsMe', t('runRequests.ranAsMe'))}
      >
        {pending ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <PlayIcon data-icon='inline-start' />
        )}
        {t('runRequests.asMe')}
      </Button>
    );
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        disabled={settle.isPending}
        data-action='confirm'
        onClick={() => run('confirm', t('runRequests.confirmed'))}
      >
        {pending === 'confirm' ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <CheckIcon data-icon='inline-start' />
        )}
        {t('runRequests.confirm')}
      </Button>
      <Popover open={rejecting} onOpenChange={setRejecting}>
        <PopoverTrigger
          render={
            <Button
              variant='outline'
              disabled={settle.isPending}
              data-action='reject'
            />
          }
        >
          {pending === 'reject' ? <Spinner data-icon='inline-start' /> : null}
          {t('runRequests.reject')}
        </PopoverTrigger>
        <PopoverContent align='start' className='w-80 space-y-3'>
          <p className='text-sm font-medium'>{t('runRequests.rejectTitle')}</p>
          <Textarea
            value={note}
            maxLength={2000}
            aria-label={t('runRequests.rejectNote', {
              name: request.requestedByName ?? request.requestedByUserId,
            })}
            placeholder={t('runRequests.rejectNote', {
              name: request.requestedByName ?? request.requestedByUserId,
            })}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className='flex justify-end gap-2'>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setRejecting(false)}
            >
              {t('runRequests.cancel')}
            </Button>
            <Button
              size='sm'
              variant='destructive'
              disabled={settle.isPending}
              onClick={() =>
                run('reject', t('runRequests.rejected'), note.trim())
              }
            >
              {pending === 'reject' ? (
                <Spinner data-icon='inline-start' />
              ) : null}
              {t('runRequests.rejectConfirm')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
