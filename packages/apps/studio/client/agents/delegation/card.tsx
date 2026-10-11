/**
 * The event card of work a conversation delegated (`shared/delegations.ts`): a milestone of the issue it handed to an
 * agent, in the chat panel in place of the news line (`ChatExtensions.renderNews`, `news.tsx`). It names what happened, links the
 * issue and the pull request, quotes the excerpt, and lets the person stop following the issue, or follow it again.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  EyeIcon,
  GitPullRequestIcon,
  SquareCheckIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import type { DelegationEvent } from '../../../shared/delegations.js';
import { Button } from '../../components/ui/button.js';
import { cn } from 'cn';
import { useDelegation, useFollowDelegation } from './api.js';
import { delegationHeadline } from './headline.js';

const ICONS: Readonly<Record<DelegationEvent, ReactNode>> = {
  finished: <CircleCheckIcon aria-hidden='true' />,
  needsInput: <CircleHelpIcon aria-hidden='true' />,
  inReview: <EyeIcon aria-hidden='true' />,
  failed: <CircleAlertIcon aria-hidden='true' />,
  issueClosed: <SquareCheckIcon aria-hidden='true' />,
  prOpened: <GitPullRequestIcon aria-hidden='true' />,
};

export function DelegationCard({
  params,
  event,
}: {
  readonly params: Readonly<Record<string, string>>;
  readonly event: DelegationEvent;
}): ReactElement {
  const { t } = useTranslation();
  const id = params.delegationId ?? '';
  const delegation = useDelegation(id);
  const follow = useFollowDelegation(id);
  const followed = delegation.data?.followed;
  const identifier = params.identifier ?? '';
  return (
    <article
      className='flex w-full min-w-0 flex-col gap-1.5 rounded-lg border bg-card px-3 py-2.5 text-sm'
      aria-label={delegationHeadline(t, event, params)}
      data-testid='delegation-card'
      data-event={event}
    >
      <p
        className={cn(
          'flex min-w-0 items-center gap-2 font-medium [&>svg]:size-4 [&>svg]:shrink-0',
          event === 'failed'
            ? '[&>svg]:text-destructive'
            : '[&>svg]:text-muted-foreground',
        )}
      >
        {ICONS[event]}
        <span className='min-w-0 wrap-anywhere'>
          {delegationHeadline(t, event, params)}
        </span>
      </p>
      <Link
        to={`/issues/${encodeURIComponent(identifier)}`}
        className='min-w-0 truncate text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
      >
        {identifier} {params.issueTitle}
      </Link>
      {params.excerpt ? (
        <p className='line-clamp-3 whitespace-pre-wrap text-muted-foreground wrap-anywhere'>
          {params.excerpt}
        </p>
      ) : null}
      {params.prUrl ? (
        <a
          href={params.prUrl}
          target='_blank'
          rel='noreferrer'
          className='flex min-w-0 items-center gap-1.5 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&>svg]:size-3.5 [&>svg]:shrink-0'
        >
          <GitPullRequestIcon aria-hidden='true' />
          <span className='truncate'>
            {t('studioAgents.delegation.pullRequest', {
              number: params.prNumber ?? '',
              title: params.prTitle ?? '',
            })}
          </span>
        </a>
      ) : null}
      {followed === undefined ? null : (
        <div className='flex items-center justify-end gap-2 pt-0.5'>
          {followed ? null : (
            <span className='text-xs text-muted-foreground'>
              {t('studioAgents.delegation.notFollowing')}
            </span>
          )}
          <Button
            type='button'
            variant='ghost'
            size='xs'
            disabled={follow.isPending}
            onClick={() => follow.mutate(!followed)}
          >
            {followed
              ? t('studioAgents.delegation.stopFollowing')
              : t('studioAgents.delegation.followAgain')}
          </Button>
        </div>
      )}
    </article>
  );
}
