/**
 * On an issue's page, what the viewer asked of agents there that still waits for the issue's owner (`run-requests.ts`):
 * each request with what it asked, and the two ways on: run it as oneself now, on a runtime one may use, or withdraw
 * it. The owner decides the same requests under "Waiting for you" (`client/inbox/issue-waiting.tsx`). Nothing renders
 * while nothing waits; the owner never sees this, as their own work needs nobody's confirmation.
 */
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { PlayIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { useNotify } from '../access/notify.js';
import {
  useAskedOn,
  useSettleRunRequest,
  useWhy,
  type RunRequestAction,
  type RunRequestItem,
} from './run-requests.js';

export function IssueRunRequestsSection({
  issue,
}: {
  readonly issue: IssueDetail;
}): ReactElement | null {
  const { t } = useTranslation();
  const asked = useAskedOn(issue.id).data ?? [];
  if (asked.length === 0) return null;
  const owner = asked[0]?.responsibleName ?? issue.owner?.name ?? '';
  return (
    <section
      className='space-y-3'
      aria-labelledby='studio-issue-run-requests'
      data-testid='studio-issue-run-requests'
    >
      <div className='space-y-1'>
        <h2
          id='studio-issue-run-requests'
          className='font-heading text-sm font-semibold'
        >
          {t('runRequests.section')}
        </h2>
        <p className='text-xs text-muted-foreground'>
          {t('runRequests.sectionHint', { owner })}
        </p>
      </div>
      <ul className='space-y-2'>
        {asked.map((request) => (
          <li key={request.id}>
            <AskedRequest request={request} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function AskedRequest({
  request,
}: {
  readonly request: RunRequestItem;
}): ReactElement {
  const { t } = useTranslation();
  const why = useWhy();
  const notify = useNotify();
  const settle = useSettleRunRequest();
  const pending = settle.isPending ? settle.variables.action : null;
  const run = (action: RunRequestAction, done: string) =>
    settle.mutate(
      { id: request.id, action },
      {
        onSuccess: () => notify.success(done),
        onError: (error) => notify.error(error),
      },
    );
  return (
    <article
      className='space-y-2 rounded-lg border bg-card px-4 py-3 text-card-foreground'
      aria-label={why(request)}
    >
      <p className='text-xs text-muted-foreground'>
        {why(request)} ·{' '}
        {t('runRequests.waitingFor', {
          agent: request.agentName ?? request.agentId,
          owner: request.responsibleName ?? request.responsibleUserId,
        })}
      </p>
      <p className='line-clamp-3 text-sm whitespace-pre-wrap wrap-anywhere'>
        {request.input.text}
      </p>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          size='sm'
          disabled={settle.isPending}
          data-action='runAsMe'
          onClick={() => run('runAsMe', t('runRequests.ranAsMe'))}
        >
          {pending === 'runAsMe' ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <PlayIcon data-icon='inline-start' />
          )}
          {t('runRequests.asMe')}
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={settle.isPending}
          data-action='withdraw'
          onClick={() => run('withdraw', t('runRequests.withdrawn'))}
        >
          {pending === 'withdraw' ? <Spinner data-icon='inline-start' /> : null}
          {t('runRequests.withdraw')}
        </Button>
      </div>
    </article>
  );
}
