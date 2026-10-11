/** The detail parts of Studio's pull request items in the inbox (`inbox.tsx`). */
import { useTranslation } from '@nocobase/i18n/client';
import { ExternalLinkIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';

import { PR_SIGNAL_STOPPED } from '../../shared/git.js';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import { field, labelOf, pullRequestOf, type GitModel } from './inbox-model.js';
import {
  ChecksBadge,
  ConflictBadge,
  MergeButtons,
  PullRequestStateBadge,
} from './pull-requests.js';

export function GitActions({
  entry,
  model,
  onDecided,
}: InboxPartProps<GitModel>): ReactElement | null {
  const pullRequest = pullRequestOf(entry, model);
  const issueId = field(entry, 'issueId');
  const identifier = field(entry, 'identifier');
  if (!pullRequest || !issueId || !identifier) return null;
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <MergeButtons
        issue={{ id: issueId, identifier }}
        pullRequest={pullRequest}
        size='default'
        onDone={onDecided}
      />
    </div>
  );
}

export function GitBody({
  entry,
  model,
  onOpen,
}: InboxPartProps<GitModel>): ReactElement {
  const { t } = useTranslation();
  const pullRequest = pullRequestOf(entry, model);
  const url = pullRequest?.url ?? field(entry, 'url');
  return (
    <div className='space-y-3 text-sm' data-git-item={labelOf(entry)}>
      <div className='space-y-1'>
        <p className='text-muted-foreground'>
          {field(entry, 'identifier')} · {field(entry, 'issueTitle')}
        </p>
        {url ? (
          <a
            href={url}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 font-medium hover:underline'
          >
            {labelOf(entry)} {pullRequest?.title ?? field(entry, 'title')}
            <ExternalLinkIcon className='size-3' aria-hidden />
          </a>
        ) : null}
      </div>
      {pullRequest ? (
        <div className='flex flex-wrap items-center gap-1.5'>
          <PullRequestStateBadge
            state={pullRequest.state}
            draft={pullRequest.draft}
          />
          {pullRequest.state === 'open' ? (
            <ChecksBadge ciState={pullRequest.ciState} />
          ) : null}
          {pullRequest.state === 'open' &&
          pullRequest.mergeableState === 'dirty' ? (
            <ConflictBadge />
          ) : null}
          {pullRequest.headRef ? (
            <code className='rounded bg-muted px-1 text-xs'>
              {pullRequest.headRef} → {pullRequest.baseRef}
            </code>
          ) : null}
        </div>
      ) : null}
      {entry.notice?.type === PR_SIGNAL_STOPPED ? (
        <p>
          {t(
            field(entry, 'signal') === 'conflict'
              ? 'studioGit.inbox.stoppedConflict'
              : 'studioGit.inbox.stoppedChecks',
            { limit: field(entry, 'limit') ?? '3' },
          )}
        </p>
      ) : null}
      {onOpen ? (
        <Button
          type='button'
          variant='link'
          className='h-auto p-0'
          onClick={onOpen}
        >
          {t('studioGit.inbox.open')}
        </Button>
      ) : null}
    </div>
  );
}
