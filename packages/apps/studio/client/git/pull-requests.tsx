/**
 * Pull requests in Studio's pages: the parts of
 * the issue page's Code and deployments section (`issues/detail/code-section.tsx`: link by URL, each pull request with
 * its state, checks and conflicts, each check of its latest commit, merge, mark as merged, refresh, unlink, and whether
 * it counts toward moving the issue on; pull requests that only name the issue's key wait as suggestions for a person to
 * link or dismiss), the badge an issue's mark shows, and the merge actions the inbox reuses. Merge is greyed out with the reason while what Studio last read says it cannot be merged
 * (`mergeBlocker`); otherwise it opens the confirmation, which asks GitHub again (`merge-dialog.tsx`).
 */
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { pmKeys } from '@nocobase/app-plugin-projects/client/kit';
import type {
  Issue,
  IssueDetail,
} from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDashedIcon,
  MinusCircleIcon,
  CircleDotIcon,
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestIcon,
  Loader2Icon,
  MonitorPlayIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  UnlinkIcon,
  XCircleIcon,
} from 'lucide-react';
import {
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { cn } from 'cn';

import type {
  GitCheck,
  IssuePullRequest,
  PullRequestCiState,
  PullRequestSuggestion,
  PullRequestMark,
  PullRequestState,
} from '../../shared/git.js';
import { useNotify } from '../access/notify.js';
import { previewKeys } from '../previews/api.js';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import { gitKeys, useGitApi, usePullRequestMark } from './api.js';
import { MergeDialog } from './merge-dialog.js';

const STATE_ICONS = {
  open: GitPullRequestIcon,
  merged: GitMergeIcon,
  closed: GitPullRequestClosedIcon,
} as const;

const STATE_TONES: Readonly<Record<PullRequestState | 'draft', string>> = {
  open: 'text-emerald-600 dark:text-emerald-400',
  draft: 'text-muted-foreground',
  merged: 'text-violet-600 dark:text-violet-400',
  closed: 'text-destructive',
};

export function PullRequestStateBadge({
  state,
  draft = false,
}: {
  readonly state: PullRequestState;
  readonly draft?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const Icon = STATE_ICONS[state];
  const key = state === 'open' && draft ? 'draft' : state;
  return (
    <Badge variant='outline' className={cn('gap-1', STATE_TONES[key])}>
      <Icon className='size-3' aria-hidden />
      {t(`studioGit.state.${key}`)}
    </Badge>
  );
}

const CHECK_ICONS = {
  pending: Loader2Icon,
  success: CheckCircle2Icon,
  failure: XCircleIcon,
} as const;

export function ChecksBadge({
  ciState,
}: {
  readonly ciState: PullRequestCiState | null;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!ciState) return null;
  const Icon = CHECK_ICONS[ciState];
  return (
    <Badge
      variant={ciState === 'failure' ? 'destructive' : 'outline'}
      className='gap-1'
    >
      <Icon
        className={cn('size-3', ciState === 'pending' && 'animate-spin')}
        aria-hidden
      />
      {t(`studioGit.checks.${ciState}`)}
    </Badge>
  );
}

const CHECK_CONCLUSIONS = new Set([
  'success',
  'failure',
  'neutral',
  'skipped',
  'cancelled',
  'timed_out',
  'action_required',
  'stale',
]);

/** One check's outcome, as its icon and words. */
function checkOutcome(check: GitCheck): {
  readonly key: string;
  readonly tone: string;
  readonly Icon: typeof CheckCircle2Icon;
} {
  if (check.status !== 'completed')
    return {
      key: check.status,
      tone: 'text-muted-foreground',
      Icon: check.status === 'queued' ? CircleDashedIcon : Loader2Icon,
    };
  const conclusion = check.conclusion ?? 'other';
  if (conclusion === 'success')
    return {
      key: conclusion,
      tone: 'text-emerald-600 dark:text-emerald-400',
      Icon: CheckCircle2Icon,
    };
  if (['neutral', 'skipped', 'cancelled', 'stale'].includes(conclusion))
    return {
      key: CHECK_CONCLUSIONS.has(conclusion) ? conclusion : 'other',
      tone: 'text-muted-foreground',
      Icon: MinusCircleIcon,
    };
  return {
    key: CHECK_CONCLUSIONS.has(conclusion) ? conclusion : 'other',
    tone: 'text-destructive',
    Icon: XCircleIcon,
  };
}

/** One check with its outcome and its page, as a line of a list. */
export function CheckRow({
  check,
}: {
  readonly check: GitCheck;
}): ReactElement {
  const { t } = useTranslation();
  const outcome = checkOutcome(check);
  return (
    <li className='flex items-center gap-2 text-xs' data-check={check.name}>
      <outcome.Icon
        className={cn(
          'size-3.5 shrink-0',
          outcome.tone,
          check.status === 'in_progress' && 'animate-spin',
        )}
        aria-hidden
      />
      <span className='truncate'>{check.name}</span>
      <span className={cn('shrink-0', outcome.tone)}>
        {t(`studioGit.check.${outcome.key}`)}
      </span>
      {check.url ? (
        <a
          href={check.url}
          target='_blank'
          rel='noreferrer'
          className='shrink-0 text-muted-foreground hover:underline'
        >
          {t('studioGit.check.details')}
        </a>
      ) : null}
    </li>
  );
}

export function ConflictBadge(): ReactElement {
  const { t } = useTranslation();
  return (
    <Badge variant='destructive' className='gap-1'>
      <AlertTriangleIcon className='size-3' aria-hidden />
      {t('studioGit.conflict')}
    </Badge>
  );
}

/** What changing a pull request refreshes: the issue page, the lists, the marks, its previews and the inbox. */
function useRefresh(issue: { id: string; identifier: string }) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: gitKeys.all });
    void queryClient.invalidateQueries({ queryKey: pmKeys.issue(issue.id) });
    void queryClient.invalidateQueries({
      queryKey: pmKeys.issue(issue.identifier),
    });
    void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    void queryClient.invalidateQueries({
      queryKey: previewKeys.issue(issue.id),
    });
    void queryClient.invalidateQueries({
      queryKey: previewKeys.marks(issue.id),
    });
  };
}

type MergeTarget = Pick<
  IssuePullRequest,
  'id' | 'repo' | 'number' | 'state' | 'mergeBlocker'
>;

interface MergeActions {
  /** Opens the merge confirmation, which asks GitHub again (`merge-dialog.tsx`). */
  readonly merge: () => void;
  /** Opens the confirmation of Mark as merged. */
  readonly markMerged: () => void;
  readonly pending: boolean;
  /** The two confirmations, rendered wherever the actions are. */
  readonly dialogs: ReactNode;
}

/** Merge (through the preflight confirmation) and Mark as merged (behind its own confirmation), for any trigger. */
function useMergeActions(
  issue: { readonly id: string; readonly identifier: string },
  pullRequest: MergeTarget,
  onDone?: () => void,
): MergeActions {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const refresh = useRefresh(issue);
  const [merging, setMerging] = useState(false);
  const [marking, setMarking] = useState(false);
  const mark = useMutation({
    mutationFn: () => api.act(issue.id, pullRequest.id, 'markMerged'),
    onSuccess: () => {
      notify.success(t('studioGit.section.marked'));
      setMarking(false);
      onDone?.();
    },
    onError: (error) => notify.error(error),
    onSettled: refresh,
  });
  const label = `${pullRequest.repo}#${pullRequest.number}`;
  return {
    merge: () => setMerging(true),
    markMerged: () => setMarking(true),
    pending: mark.isPending,
    dialogs: (
      <>
        <MergeDialog
          target={
            merging
              ? { issueId: issue.id, pullRequestId: pullRequest.id, label }
              : null
          }
          onClose={() => setMerging(false)}
          onMerged={() => {
            refresh();
            onDone?.();
          }}
        />
        <AlertDialog
          open={marking}
          onOpenChange={(open) => {
            if (!open && !mark.isPending) setMarking(false);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('studioGit.confirm.markTitle', { label })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('studioGit.confirm.markBody', {
                  identifier: issue.identifier,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mark.isPending}>
                {t('studioGit.confirm.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={mark.isPending}
                data-action='confirm-mark-merged'
                onClick={() => mark.mutate()}
              >
                {mark.isPending ? <Spinner data-icon='inline-start' /> : null}
                {t('studioGit.section.markMerged')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    ),
  };
}

/** Merge (through the preflight confirmation) and Mark as merged (behind its own confirmation). */
export function MergeButtons({
  issue,
  pullRequest,
  onDone,
  size = 'sm',
}: {
  readonly issue: { readonly id: string; readonly identifier: string };
  readonly pullRequest: MergeTarget;
  readonly onDone?: () => void;
  readonly size?: 'sm' | 'default';
}): ReactElement | null {
  const { t } = useTranslation();
  const actions = useMergeActions(issue, pullRequest, onDone);
  if (pullRequest.state !== 'open') return null;
  const blocker = pullRequest.mergeBlocker;
  return (
    <>
      {blocker ? (
        <span
          className='text-xs text-muted-foreground'
          data-merge-reason={blocker}
        >
          {t(`studioGit.merge.blocker.${blocker}`)}
        </span>
      ) : null}
      <Button
        size={size}
        data-action='merge'
        disabled={actions.pending || blocker !== null}
        title={blocker ? t(`studioGit.merge.blocker.${blocker}`) : undefined}
        onClick={actions.merge}
      >
        <GitMergeIcon data-icon='inline-start' />
        {t('studioGit.section.merge')}
      </Button>
      <Button
        size={size}
        variant='outline'
        data-action='mark-merged'
        disabled={actions.pending}
        onClick={actions.markMerged}
      >
        {t('studioGit.section.markMerged')}
      </Button>
      {actions.dialogs}
    </>
  );
}

/**
 * One pull request as one compact row: its repository and number with the title (to GitHub), its state, checks and
 * conflicts, the preview's Open when it has a ready one (`previewUrl`), Merge, and the rest of its actions (Refresh,
 * Mark as merged, Unlink) behind "…". The chevron unfolds the details: who linked or merged it and when Studio last read
 * it, why it cannot be merged, each check of its latest commit, whether it counts toward Done, and `children` (its
 * previews and where it is deployed).
 */
export function PullRequestRow({
  issue,
  pullRequest,
  canMerge,
  canLink,
  previewUrl = null,
  defaultOpen = false,
  children,
}: {
  readonly issue: { readonly id: string; readonly identifier: string };
  readonly pullRequest: IssuePullRequest;
  readonly canMerge: boolean;
  readonly canLink: boolean;
  /** The address of its ready preview, opened from the row. */
  readonly previewUrl?: string | null;
  /** Unfolded at first, such as when its preview needs something. */
  readonly defaultOpen?: boolean;
  /** What follows from it, such as its preview and where it is deployed. */
  readonly children?: ReactNode;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const refresh = useRefresh(issue);
  const [open, setOpen] = useState(defaultOpen);
  const [unlinking, setUnlinking] = useState(false);
  const mergeActions = useMergeActions(issue, pullRequest);
  const mutate = useMutation({
    mutationFn: async (
      change:
        | { kind: 'refresh' }
        | { kind: 'unlink' }
        | { kind: 'count'; counted: boolean },
    ): Promise<void> => {
      if (change.kind === 'refresh')
        await api.act(issue.id, pullRequest.id, 'refresh');
      else if (change.kind === 'unlink')
        await api.unlink(issue.id, pullRequest.id);
      else await api.setCounted(issue.id, pullRequest.id, change.counted);
    },
    onSuccess: (_, change) => {
      if (change.kind === 'refresh')
        notify.success(t('studioGit.section.refreshed'));
      if (change.kind === 'unlink') {
        setUnlinking(false);
        notify.success(t('studioGit.section.unlinked'));
      }
    },
    onError: (error) => notify.error(error),
    onSettled: refresh,
  });
  const pr = pullRequest;
  const label = `${pr.repo}#${pr.number}`;
  const isOpen = pr.state === 'open';
  const mergeable = canMerge && isOpen;
  const blocker = pr.mergeBlocker;
  const linker =
    pr.linkedBy.type === 'system'
      ? t('studioGit.section.linkedByBranch')
      : t('studioGit.section.linkedBy', {
          name: pr.linkedBy.name ?? pr.linkedBy.id ?? '?',
        });
  const merger = pr.mergedBy
    ? t('studioGit.section.mergedBy', {
        name:
          pr.mergedBy.name ??
          (pr.mergedBy.login ? `@${pr.mergedBy.login}` : '?'),
      }) +
      (pr.mergedManually ? ` · ${t('studioGit.section.mergedManually')}` : '')
    : null;
  const busy = mutate.isPending || mergeActions.pending;
  return (
    <li data-pull-request={pr.number}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2'>
          <div className='flex min-w-0 flex-1 basis-60 items-center gap-1.5'>
            <CollapsibleTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-xs'
                  className='group/pr -ml-1 shrink-0 text-muted-foreground'
                  aria-label={t('studioGit.section.details', { label })}
                />
              }
            >
              <ChevronRightIcon
                className='transition-transform group-data-[panel-open]/pr:rotate-90'
                aria-hidden
              />
            </CollapsibleTrigger>
            <a
              href={pr.url}
              target='_blank'
              rel='noreferrer'
              className='flex min-w-0 items-center gap-1.5 text-sm hover:underline'
              title={pr.title || pr.url}
            >
              <span className='shrink-0 text-muted-foreground'>{label}</span>
              <span className='truncate font-medium'>{pr.title || pr.url}</span>
            </a>
          </div>
          <div className='flex shrink-0 flex-wrap items-center gap-1.5'>
            <PullRequestStateBadge state={pr.state} draft={pr.draft} />
            {isOpen ? <ChecksBadge ciState={pr.ciState} /> : null}
            {isOpen && pr.mergeableState === 'dirty' ? <ConflictBadge /> : null}
            {previewUrl ? (
              <Button
                size='sm'
                variant='outline'
                nativeButton={false}
                data-action='open-preview'
                render={
                  <a href={previewUrl} target='_blank' rel='noreferrer' />
                }
              >
                <MonitorPlayIcon data-icon='inline-start' />
                {t('studioGit.section.openPreview')}
              </Button>
            ) : null}
            {mergeable ? (
              <Button
                size='sm'
                data-action='merge'
                disabled={busy || blocker !== null}
                title={
                  blocker ? t(`studioGit.merge.blocker.${blocker}`) : undefined
                }
                onClick={mergeActions.merge}
              >
                <GitMergeIcon data-icon='inline-start' />
                {t('studioGit.section.merge')}
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('studioGit.section.more', { label })}
                    disabled={busy}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-auto min-w-40'>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => mutate.mutate({ kind: 'refresh' })}
                  >
                    <RefreshCwIcon />
                    {t('studioGit.section.refresh')}
                  </DropdownMenuItem>
                  {mergeable ? (
                    <DropdownMenuItem
                      data-action='mark-merged'
                      onClick={mergeActions.markMerged}
                    >
                      <GitMergeIcon />
                      {t('studioGit.section.markMerged')}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
                {canLink ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        variant='destructive'
                        onClick={() => setUnlinking(true)}
                      >
                        <UnlinkIcon />
                        {t('studioGit.section.unlink')}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CollapsibleContent>
          <div className='space-y-3 border-t bg-muted/30 px-3 py-3 sm:pl-9'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
              {pr.headRef ? (
                <code className='rounded bg-muted px-1'>{pr.headRef}</code>
              ) : null}
              <span>{merger ?? linker}</span>
              {pr.snapshotAt ? (
                <span>
                  ·{' '}
                  {t('studioGit.section.snapshot', {
                    time: relativeTime(pr.snapshotAt, i18n.language),
                  })}
                </span>
              ) : null}
            </div>
            {mergeable && blocker ? (
              <p
                className='text-xs text-muted-foreground'
                data-merge-reason={blocker}
              >
                {t(`studioGit.merge.blocker.${blocker}`)}
              </p>
            ) : null}
            {isOpen && pr.checks.length > 0 ? (
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  {t('studioGit.section.checksToggle', {
                    count: pr.checks.length,
                  })}
                </p>
                <ul className='space-y-1' data-checks>
                  {pr.checks.map((check) => (
                    <CheckRow
                      key={`${check.kind}:${check.name}`}
                      check={check}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
            {canLink ? (
              <label className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Switch
                  size='sm'
                  checked={!pr.autoCompleteDisabled}
                  disabled={mutate.isPending}
                  onCheckedChange={(counted) =>
                    mutate.mutate({ kind: 'count', counted })
                  }
                />
                <span title={t('studioGit.section.countsHint')}>
                  {t('studioGit.section.countsTitle')}
                </span>
              </label>
            ) : null}
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
      {mergeActions.dialogs}
      <AlertDialog
        open={unlinking}
        onOpenChange={(next) => {
          if (!next && !mutate.isPending) setUnlinking(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('studioGit.confirm.unlinkTitle', { label })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('studioGit.confirm.unlinkBody', {
                identifier: issue.identifier,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutate.isPending}>
              {t('studioGit.confirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={mutate.isPending}
              data-action='confirm-unlink'
              onClick={() => mutate.mutate({ kind: 'unlink' })}
            >
              {mutate.isPending ? <Spinner data-icon='inline-start' /> : null}
              {t('studioGit.section.unlink')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

/** Pull requests that only name the issue's key, for a person to link or dismiss. */
export function PullRequestSuggestions({
  issue,
  suggestions,
}: {
  readonly issue: IssueDetail;
  readonly suggestions: readonly PullRequestSuggestion[];
}): ReactElement | null {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const refresh = useRefresh(issue);
  const act = useMutation({
    mutationFn: async (change: {
      readonly kind: 'link' | 'dismiss';
      readonly suggestion: PullRequestSuggestion;
    }): Promise<void> => {
      if (change.kind === 'link')
        await api.link(issue.id, change.suggestion.url);
      else
        await api.dismissSuggestion(issue.id, change.suggestion.pullRequestId);
    },
    onSuccess: (_, change) =>
      notify.success(
        t(
          change.kind === 'link'
            ? 'studioGit.section.linked'
            : 'studioGit.section.dismissed',
        ),
      ),
    onError: (error) => notify.error(error),
    onSettled: refresh,
  });
  if (suggestions.length === 0) return null;
  return (
    <div
      className='space-y-2 rounded-lg border border-dashed p-3'
      data-suggestions
    >
      <p className='text-xs font-medium'>
        {t('studioGit.section.suggestionsTitle', {
          identifier: issue.identifier,
        })}
      </p>
      <p className='text-xs text-muted-foreground'>
        {t('studioGit.section.suggestionsHint')}
      </p>
      <ul className='space-y-1.5'>
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.pullRequestId}
            className='flex flex-wrap items-center justify-between gap-2 text-sm'
            data-suggestion={suggestion.number}
          >
            <a
              href={suggestion.url}
              target='_blank'
              rel='noreferrer'
              className='flex min-w-0 items-center gap-1 hover:underline'
            >
              <span className='text-muted-foreground'>
                {suggestion.repo}#{suggestion.number}
              </span>
              <span className='truncate'>{suggestion.title}</span>
            </a>
            <span className='flex gap-1.5'>
              <Button
                size='sm'
                variant='outline'
                disabled={act.isPending}
                onClick={() => act.mutate({ kind: 'link', suggestion })}
              >
                {t('studioGit.section.confirmSuggestion')}
              </Button>
              <Button
                size='sm'
                variant='ghost'
                disabled={act.isPending}
                onClick={() => act.mutate({ kind: 'dismiss', suggestion })}
              >
                {t('studioGit.section.dismissSuggestion')}
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Links a pull request to the issue by its URL; Cancel (with `onCancel`) or Escape in the empty input backs out. */
export function LinkPullRequestForm({
  issue,
  autoFocus = false,
  onCancel,
  onLinked,
}: {
  readonly issue: { readonly id: string; readonly identifier: string };
  readonly autoFocus?: boolean;
  readonly onCancel?: () => void;
  readonly onLinked?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const refresh = useRefresh(issue);
  const [url, setUrl] = useState('');
  const link = useMutation({
    mutationFn: (value: string) => api.link(issue.id, value),
    onSuccess: () => {
      notify.success(t('studioGit.section.linked'));
      setUrl('');
      onLinked?.();
    },
    onError: (error) => notify.error(error),
    onSettled: refresh,
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (url.trim()) link.mutate(url.trim());
  };
  return (
    <form className='flex gap-2' onSubmit={submit}>
      <Input
        value={url}
        autoFocus={autoFocus}
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && onCancel && url === '') onCancel();
        }}
        placeholder={t('studioGit.section.linkPlaceholder')}
        aria-label={t('studioGit.section.linkPlaceholder')}
        className='h-8'
      />
      <Button
        type='submit'
        size='sm'
        variant='outline'
        disabled={link.isPending || !url.trim()}
      >
        {link.isPending ? <Spinner data-icon='inline-start' /> : null}
        {t('studioGit.section.link')}
      </Button>
      {onCancel ? (
        <Button
          type='button'
          size='sm'
          variant='ghost'
          disabled={link.isPending}
          onClick={onCancel}
        >
          {t('studioGit.confirm.cancel')}
        </Button>
      ) : null}
    </form>
  );
}

/** An issue's pull requests in one badge: their state, failing checks or a conflict; nothing without any. */
export function PullRequestMarkBadge({
  issue,
}: {
  readonly issue: Pick<Issue, 'id' | 'revision'>;
}): ReactElement | null {
  const { t } = useTranslation();
  const { data } = usePullRequestMark(issue.id, issue.revision);
  if (!data) return null;
  return <MarkBadge mark={data} title={t} />;
}

function MarkBadge({
  mark,
  title,
}: {
  readonly mark: PullRequestMark;
  readonly title: (key: string, options?: Record<string, unknown>) => string;
}): ReactElement {
  const Icon =
    mark.state === 'open' && (mark.conflict || mark.ciState === 'failure')
      ? AlertTriangleIcon
      : mark.state === 'open'
        ? CircleDotIcon
        : STATE_ICONS[mark.state];
  const warn =
    mark.state === 'open' && (mark.conflict || mark.ciState === 'failure');
  const stateText = warn
    ? mark.conflict
      ? title('studioGit.conflict')
      : title('studioGit.checks.failure')
    : title(`studioGit.state.${mark.state}`);
  return (
    <a
      href={mark.url}
      target='_blank'
      rel='noreferrer'
      onClick={(event) => event.stopPropagation()}
      data-pr-mark={mark.state}
      title={title('studioGit.mark.title', {
        label: mark.label,
        state: stateText,
      })}
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md border px-1 py-0.5 text-[11px] leading-none',
        warn
          ? 'border-destructive/40 text-destructive'
          : STATE_TONES[mark.state],
      )}
    >
      <GitPullRequestIcon className='size-3' aria-hidden />
      <Icon className='size-3' aria-hidden />
      {mark.count > 1 ? (
        <span>{title('studioGit.mark.more', { count: mark.count })}</span>
      ) : null}
    </a>
  );
}
