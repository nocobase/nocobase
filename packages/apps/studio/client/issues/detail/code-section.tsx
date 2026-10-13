/**
 * The issue page's Code and deployments section, in the main column: each linked pull request as one compact row (its
 * state, checks, its ready preview's Open, Merge and the rest of its actions, `git/pull-requests.tsx`) that unfolds into
 * its details, its previews (`previews/preview-entry.tsx`) and the environments its change was deployed to
 * (`deploys/marks.tsx`), grouped as `code-groups.ts` decides; what no linked pull request carried (commits an agent
 * pushed directly) follows as a row of its own, "Other deployments". Suggested pull requests close it, and "Link" in its
 * heading opens the link-by-URL input.
 *
 * Without anything to show it renders nothing, and `IssueCodeAddButton` in the page's add bar offers "Pull request",
 * which opens the section with the input (`linking`). Nothing renders for an issue without a code host.
 */
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronRightIcon,
  GitPullRequestIcon,
  Link2Icon,
  RocketIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  IssueAddButton,
  IssueSection,
  ISSUE_SECTION_LIST,
} from '@/extensions/nocobase-issue-detail/issue-detail';

import type { IssuePreviews } from '../../../shared/previews.js';
import { DeployMarkTag } from '../../deploys/marks.js';
import { useDeployMarks } from '../../deploys/use-marks.js';
import { useIssuePullRequests } from '../../git/api.js';
import {
  LinkPullRequestForm,
  PullRequestRow,
  PullRequestSuggestions,
} from '../../git/pull-requests.js';
import { absoluteUrl } from '../../previews/api.js';
import { PreviewEntry } from '../../previews/preview-entry.js';
import { useIssuePreviews } from '../../previews/use-issue-previews.js';
import { groupByPullRequest, type CodeGroup } from './code-groups.js';

/** Whether the search for the first pull request is open while the section has nothing else. */
export interface CodeLinking {
  readonly linking: boolean;
  readonly setLinking: (linking: boolean) => void;
}

/** What the section reads, shared with the add bar's button (React Query answers both from one request). */
function useIssueCode(issue: IssueDetail) {
  const pullRequests = useIssuePullRequests(issue.id, issue.revision);
  const { query: previewsQuery, replace } = useIssuePreviews(issue.id);
  const marks = useDeployMarks(issue.id);
  const linked = pullRequests.data;
  const previews = previewsQuery.data;
  const { groups, unmatched } = groupByPullRequest(
    linked?.data ?? [],
    previews?.previews ?? [],
    marks.data ?? [],
  );
  const canLink = linked?.canLink ?? false;
  const suggestions = canLink ? (linked?.suggestions ?? []) : [];
  return {
    linked,
    previews,
    previewsFailed: previewsQuery.isError,
    replace,
    groups,
    unmatched,
    canLink,
    suggestions,
    applicable: Boolean(linked?.applicable),
    empty: groups.length === 0 && !unmatched && suggestions.length === 0,
  };
}

/** A group's ready preview, opened from its row. */
function readyPreviewUrl(group: CodeGroup): string | null {
  const ready = group.previews.find(
    (preview) => preview.status === 'ready' && preview.url,
  );
  return ready?.url ? absoluteUrl(ready.url) : null;
}

/** A preview that needs a person (blocked or failed) unfolds its row at first. */
function needsAttention(group: CodeGroup): boolean {
  return group.previews.some(
    (preview) => preview.status === 'blocked' || preview.status === 'failed',
  );
}

/** A pull request's previews and deployments, in its unfolded row. */
function GroupDetails({
  issue,
  group,
  previews,
  onChanged,
}: {
  readonly issue: IssueDetail;
  readonly group: CodeGroup;
  readonly previews: IssuePreviews | undefined;
  readonly onChanged: (next: IssuePreviews) => void;
}): ReactElement | null {
  const { t, i18n } = useTranslation();
  const label = previews?.labels?.find(
    (item) => item.pullRequestId === group.pullRequest?.id,
  );
  const preferenceMessage = label?.failed
    ? t('previews.preference.syncFailed')
    : label?.present
      ? t(
          label.managed
            ? 'previews.preference.skipped'
            : 'previews.preference.manual',
        )
      : null;
  // An open pull request of a project that previews says when it has none yet; a merged one has no need to.
  const awaitingPreview =
    group.pullRequest?.state === 'open' &&
    group.previews.length === 0 &&
    previews !== undefined &&
    previews.blocker === null;
  if (group.previews.length === 0 && group.marks.length === 0)
    return awaitingPreview || preferenceMessage ? (
      <p className='text-xs text-muted-foreground'>
        {preferenceMessage ?? t('studioGit.section.noPreview')}
      </p>
    ) : null;
  return (
    <div className='space-y-3'>
      {preferenceMessage ? (
        <p className='text-xs text-muted-foreground'>{preferenceMessage}</p>
      ) : null}
      {group.previews.length > 0 ? (
        <ul
          className='divide-y rounded-md border bg-card p-3'
          aria-label={t('studioGit.section.preview')}
        >
          {group.previews.map((preview) => (
            <PreviewEntry
              key={preview.id}
              issue={issue}
              preview={preview}
              canEdit={previews?.canEdit ?? false}
              canSetEnvironment={previews?.canSetEnvironmentVariables ?? false}
              onChanged={onChanged}
            />
          ))}
        </ul>
      ) : null}
      {group.marks.length > 0 ? (
        <div className='space-y-1.5' data-studio-deployed-to>
          <p className='text-xs text-muted-foreground'>
            {t('studioGit.section.deployedTo')}
          </p>
          <ul className='flex flex-wrap gap-x-4 gap-y-1.5'>
            {group.marks.map((mark) => (
              <li
                key={mark.appId}
                className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'
              >
                <DeployMarkTag mark={mark} placement='detail' />
                <time dateTime={mark.deployedAt}>
                  {new Date(mark.deployedAt).toLocaleString(i18n.language)}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * What no linked pull request carried, such as commits an agent pushed directly, as one compact row: its environments
 * in the row, its previews when unfolded.
 */
function OtherDeploymentsRow({
  issue,
  group,
  previews,
  onChanged,
}: {
  readonly issue: IssueDetail;
  readonly group: CodeGroup;
  readonly previews: IssuePreviews | undefined;
  readonly onChanged: (next: IssuePreviews) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => needsAttention(group));
  const title = t('studioGit.section.unmatched');
  return (
    <li data-studio-code-unmatched>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2'>
          <div className='flex min-w-0 flex-1 basis-60 items-center gap-1.5'>
            <CollapsibleTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-xs'
                  className='group/other -ml-1 shrink-0 text-muted-foreground'
                  aria-label={t('studioGit.section.details', { label: title })}
                />
              }
            >
              <ChevronRightIcon
                className='transition-transform group-data-[panel-open]/other:rotate-90'
                aria-hidden
              />
            </CollapsibleTrigger>
            <RocketIcon
              className='size-4 shrink-0 text-muted-foreground'
              aria-hidden
            />
            <span className='shrink-0 text-sm font-medium'>{title}</span>
            <span className='min-w-0 truncate text-xs text-muted-foreground'>
              {t('studioGit.section.unmatchedHint')}
            </span>
          </div>
          {group.marks.length > 0 ? (
            <div className='flex shrink-0 flex-wrap items-center gap-1.5'>
              {group.marks.map((mark) => (
                <DeployMarkTag
                  key={mark.appId}
                  mark={mark}
                  placement='detail'
                />
              ))}
            </div>
          ) : null}
        </div>
        <CollapsibleContent>
          <div className='space-y-3 border-t bg-muted/30 px-3 py-3 sm:pl-9'>
            <GroupDetails
              issue={issue}
              group={group}
              previews={previews}
              onChanged={onChanged}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

export function IssueCodeSection({
  issue,
  linking,
  setLinking,
}: {
  readonly issue: IssueDetail;
} & CodeLinking): ReactElement | null {
  const { t } = useTranslation();
  const code = useIssueCode(issue);
  // The search opened from the add bar closes again once there is something to show.
  const searching = linking && code.canLink;
  if (!code.applicable && code.groups.length === 0 && !code.unmatched)
    return null;
  if (code.empty && !searching) return null;
  return (
    <IssueSection
      icon={<GitPullRequestIcon />}
      title={t('studioGit.section.codeTitle')}
      count={code.groups.length > 0 ? code.groups.length : undefined}
      actions={
        code.canLink && !searching ? (
          <IssueAddButton onClick={() => setLinking(true)}>
            <Link2Icon data-icon='inline-start' />
            {t('studioGit.section.link')}
          </IssueAddButton>
        ) : null
      }
      data-studio-code
    >
      {code.groups.length > 0 || code.unmatched ? (
        <ul className={ISSUE_SECTION_LIST}>
          {code.groups.map((group) =>
            group.pullRequest ? (
              <PullRequestRow
                key={group.pullRequest.id}
                issue={issue}
                pullRequest={group.pullRequest}
                canMerge={code.linked?.canMerge ?? false}
                canLink={code.canLink}
                previewUrl={readyPreviewUrl(group)}
                defaultOpen={needsAttention(group)}
              >
                <GroupDetails
                  issue={issue}
                  group={group}
                  previews={code.previews}
                  onChanged={code.replace}
                />
              </PullRequestRow>
            ) : null,
          )}
          {code.unmatched ? (
            <OtherDeploymentsRow
              issue={issue}
              group={code.unmatched}
              previews={code.previews}
              onChanged={code.replace}
            />
          ) : null}
        </ul>
      ) : code.empty ? (
        <p className='text-sm text-muted-foreground'>
          {t('studioGit.section.empty', { identifier: issue.identifier })}
        </p>
      ) : null}
      {code.previewsFailed ? (
        <p className='text-sm text-muted-foreground'>
          {t('previews.loadFailed')}
        </p>
      ) : null}
      {code.suggestions.length > 0 ? (
        <PullRequestSuggestions issue={issue} suggestions={code.suggestions} />
      ) : null}
      {searching ? (
        <LinkPullRequestForm
          issue={issue}
          autoFocus
          onCancel={() => setLinking(false)}
          onLinked={() => setLinking(false)}
        />
      ) : null}
    </IssueSection>
  );
}

/** The add bar's "Pull request": shown while the section has nothing, it opens the section with the link input. */
export function IssueCodeAddButton({
  issue,
  linking,
  setLinking,
}: {
  readonly issue: IssueDetail;
} & CodeLinking): ReactElement | null {
  const { t } = useTranslation();
  const code = useIssueCode(issue);
  if (!code.applicable || !code.canLink || !code.empty || linking) return null;
  return (
    <IssueAddButton
      data-testid='issue-add-pull-request'
      onClick={() => setLinking(true)}
    >
      <GitPullRequestIcon data-icon='inline-start' />
      {t('studioGit.section.title')}
    </IssueAddButton>
  );
}
