/**
 * The merge confirmation, shared by the issue page and
 * the inbox: opening it asks GitHub for the pull request as it is now (`GET …/merge`, never the stored snapshot) and
 * shows the squash into the base branch, the commit title and what happens to the issue, or why it cannot be merged.
 * Confirming sends the head it showed, so commits pushed in between are refused (`PR_CHANGED`) and it checks again.
 */
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { PmStatusBadge } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GitMergeIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import type { PullRequestMergePreflight } from '../../shared/git.js';
import { useNotify } from '../access/notify.js';
import { gitKeys, useGitApi } from './api.js';
import { gitErrorOf } from './lib.js';

export interface MergeTarget {
  readonly issueId: string;
  readonly pullRequestId: string;
  /** `owner/name#12`. */
  readonly label: string;
}

export function MergeDialog({
  target,
  onClose,
  onMerged,
}: {
  readonly target: MergeTarget | null;
  readonly onClose: () => void;
  readonly onMerged?: () => void;
}): ReactElement {
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='grid-cols-[minmax(0,1fr)] sm:max-w-md'>
        {target ? (
          <MergeBody target={target} onClose={onClose} onMerged={onMerged} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MergeBody({
  target,
  onClose,
  onMerged,
}: {
  readonly target: MergeTarget;
  readonly onClose: () => void;
  readonly onMerged?: (() => void) | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const preflight = useQuery({
    queryKey: gitKeys.preflight(target.issueId, target.pullRequestId),
    queryFn: ({ signal }) =>
      api.preflight(target.issueId, target.pullRequestId, signal),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const merge = useMutation({
    mutationFn: (headSha: string) =>
      api.merge(target.issueId, target.pullRequestId, headSha),
    onSuccess: () => {
      notify.success(t('studioGit.section.merged'));
      onMerged?.();
      onClose();
    },
    onSettled: () => {
      // The preflight sits under the git keys too, so a refused merge checks GitHub again.
      void queryClient.invalidateQueries({ queryKey: gitKeys.all });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
  const data = preflight.data;
  const failure = gitErrorOf(merge.error);
  const blocker = data?.blocker ?? failure.blocker;
  const problem = merge.error
    ? failure.code === 'PR_CHANGED' || failure.code === 'GITHUB_MERGE_FORBIDDEN'
      ? t(`studioGit.merge.errors.${failure.code}`)
      : failure.blocker
        ? null
        : t('studioGit.merge.failed')
    : preflight.isError
      ? t('studioGit.merge.checkFailed')
      : null;
  return (
    <div className='space-y-4' data-merge-dialog={target.label}>
      <DialogHeader>
        <DialogTitle>
          {t('studioGit.merge.title', { label: target.label })}
        </DialogTitle>
        <DialogDescription>
          {data
            ? t('studioGit.merge.method', { base: data.baseRef || 'main' })
            : t('studioGit.merge.checking')}
        </DialogDescription>
      </DialogHeader>
      {preflight.isPending ? (
        <div className='space-y-2'>
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      ) : data ? (
        <MergeFacts preflight={data} />
      ) : null}
      {blocker ? (
        <Alert data-merge-blocker={blocker}>
          <AlertDescription>
            {t(`studioGit.merge.blocker.${blocker}`)}
          </AlertDescription>
        </Alert>
      ) : null}
      {problem ? (
        <Alert variant='destructive'>
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      ) : null}
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          disabled={merge.isPending}
          onClick={onClose}
        >
          {t('studioGit.confirm.cancel')}
        </Button>
        <Button
          type='button'
          data-action='confirm-merge'
          disabled={!data || data.blocker !== null || merge.isPending}
          onClick={() => {
            if (data) merge.mutate(data.headSha);
          }}
        >
          {merge.isPending ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <GitMergeIcon data-icon='inline-start' />
          )}
          {t('studioGit.merge.confirm')}
        </Button>
      </DialogFooter>
    </div>
  );
}

function MergeFacts({
  preflight,
}: {
  readonly preflight: PullRequestMergePreflight;
}): ReactElement {
  const { t } = useTranslation();
  const after = preflight.statusAfter;
  return (
    <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
      <dt className='text-muted-foreground'>
        {t('studioGit.merge.commitTitle')}
      </dt>
      <dd className='min-w-0 break-words'>{preflight.commitTitle}</dd>
      <dt className='text-muted-foreground'>{t('studioGit.merge.head')}</dt>
      <dd>
        <code className='rounded bg-muted px-1 text-xs'>
          {preflight.headSha.slice(0, 12) || '—'}
        </code>
      </dd>
      <dt className='text-muted-foreground'>{t('studioGit.merge.after')}</dt>
      <dd data-merge-after={after.statusKey ?? after.keepReason ?? ''}>
        {after.statusKey ? (
          <span className='inline-flex flex-wrap items-center gap-1.5'>
            {t('studioGit.merge.moves')}
            {/* `studio.merged` enters only finished statuses, so the target reads as done. */}
            <PmStatusBadge
              statusKey={after.statusKey}
              statuses={[
                {
                  key: after.statusKey,
                  name: after.statusName ?? after.statusKey,
                  category: 'done',
                  color: 'green',
                },
              ]}
            />
          </span>
        ) : (
          t(`studioGit.merge.keep.${after.keepReason ?? 'noTransition'}`)
        )}
      </dd>
    </dl>
  );
}
