/**
 * The projects plugin's sections of an issue's main column, drawn with the installed `issue-detail` block and
 * `attachment-list` over the plugin's headless hooks (`client/issues`), in the plugin's words: the header, the
 * description, the add bar under it, the sub-issues, the dependencies and the files. A part with nothing to show renders nothing; the add bar adds its first
 * item. Each checks the viewer's permissions: without `issues/edit` nothing here changes the issue.
 */
import {
  ATTACHMENT_SIZE_MB,
  canDeleteIssues,
  canEditIssues,
  groupSubtasksByStage,
  statusTone,
  useIntakeBreakdown,
  useMentionSearch,
  type IssuePageActions,
  type IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import {
  CornerLeftUpIcon,
  Link2Icon,
  ListTreeIcon,
  PaperclipIcon,
  PlusIcon,
  SparklesIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import {
  IssueAddBar,
  IssueAddButton,
  IssueAttachments,
  IssueDeleteButton,
  IssueDependencies,
  IssueDescription,
  IssueFilesButton,
  IssueSubtasks,
  type DependencyItem,
  type IssueDetailLink,
} from '@/extensions/nocobase-issue-detail/issue-detail';

import { toneColor } from '../rows.js';
import { IssueMarkdown } from '../markdown.js';
import { attachmentFile, useFilePreviewState } from './files.js';
import { useDependencyActions } from './dependency-actions.js';
import { issueHrefUnder, useIssueParent } from './issue-parent.js';
import { useIssueTrail } from './issue-trail.js';
import { useIssuePageWording } from './labels.js';
import type { IssueMainState } from './main-state.js';

/** Links in the block go through the router. */
const routerLink: IssueDetailLink = ({ href, className, children }) => (
  <Link to={href} className={className}>
    {children}
  </Link>
);

/**
 * The body card's first row: the parent issue, the project and the page's marks (`meta`), then the page's `actions`
 * and "Delete". The title, key and status are the pinned summary's (`../live/issue-summary.tsx`), which renames the
 * issue; the trail by the issue's project and parent goes in the shell header (`issue-trail.ts`).
 */
export function IssueBodyHeader({
  detail,
  actions,
  pageActions,
  meta,
}: {
  readonly detail: IssueDetail;
  readonly actions?: ReactNode;
  readonly pageActions: IssuePageActions;
  readonly meta?: ReactNode;
}): ReactElement {
  const { detail: labels } = useIssuePageWording();
  const viewer = useViewer();
  const navigate = useNavigate();
  const parent = useIssueParent();
  useIssueTrail(detail);
  return (
    <div
      className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground'
      data-slot='issue-body-header'
    >
      {detail.parent ? (
        <Link
          to={issueHrefUnder(parent, detail.parent.id)}
          className='inline-flex max-w-full min-w-0 items-center gap-1.5 hover:text-foreground'
        >
          <CornerLeftUpIcon className='size-3.5 shrink-0' aria-hidden='true' />
          <span className='shrink-0'>{labels.parent}</span>
          <span className='shrink-0 font-mono'>{detail.parent.identifier}</span>
          <span className='truncate'>{detail.parent.title}</span>
        </Link>
      ) : null}
      {detail.project ? (
        <Link
          to={`/projects/${encodeURIComponent(detail.project.id)}`}
          className='truncate hover:text-foreground hover:underline'
        >
          {detail.project.name}
        </Link>
      ) : null}
      {meta}
      <span className='ml-auto flex shrink-0 items-center gap-1'>
        {actions}
        {canDeleteIssues(viewer) ? (
          <IssueDeleteButton
            identifier={detail.identifier}
            labels={labels}
            onDelete={async () => {
              await pageActions.deleteIssue();
              void navigate('..', { relative: 'path' });
            }}
          />
        ) : null}
      </span>
    </div>
  );
}

/** The description, editable with `issues/edit`. */
export function IssueDescriptionSection({
  detail,
  update,
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
}): ReactElement {
  const wording = useIssuePageWording();
  const viewer = useViewer();
  const mentionSearch = useMentionSearch(detail.id);
  return (
    <IssueDescription
      description={detail.description}
      renderMarkdown={(content) => (
        <IssueMarkdown content={content} className='max-w-3xl' />
      )}
      onMentionSearch={mentionSearch}
      richTextLabels={wording.richText}
      labels={wording.detail}
      {...(canEditIssues(viewer)
        ? {
            onSave: async (description: string) => {
              await update.mutateAsync({ description });
            },
          }
        : {})}
    />
  );
}

/** The issue's own files, once it has one or one is uploading; uploading needs `issues/edit` and the upload grant. */
export function IssueFilesSection({
  detail,
  pageActions,
  state,
}: {
  readonly detail: IssueDetail;
  readonly pageActions: IssuePageActions;
  readonly state: IssueMainState;
}): ReactElement {
  const { i18n } = useTranslation();
  const wording = useIssuePageWording();
  const preview = useFilePreviewState();
  return (
    <>
      <IssueAttachments
        files={detail.attachments.map(attachmentFile)}
        {...(state.canUpload
          ? {
              onUpload: state.upload,
              hint: wording.t('attachments.dropHint', {
                size: ATTACHMENT_SIZE_MB,
              }),
            }
          : {})}
        uploading={state.uploading}
        onRemove={(file) => pageActions.removeFile(file.id)}
        onPreview={(shown, index) =>
          preview.open(detail.attachments, shown, index)
        }
        locale={i18n.language}
        labels={wording.attachments}
      />
      {preview.dialog}
    </>
  );
}

/**
 * The quiet buttons under the description that add what the issue has none of yet: a file, a sub-issue (and "Break
 * into sub-issues"), a dependency, and whatever the page adds (`children`); each part then appears with its own actions.
 * Nothing renders when there is nothing to add or the viewer may not edit the issue.
 */
export function IssueAddSection({
  detail,
  state,
  children,
}: {
  readonly detail: IssueDetail;
  readonly state: IssueMainState;
  readonly children?: ReactNode;
}): ReactElement | null {
  const { t, detail: labels, attachments } = useIssuePageWording();
  const viewer = useViewer();
  const breakdown = useIntakeBreakdown(detail.id);
  const canEdit = canEditIssues(viewer);
  const noFiles =
    detail.attachments.length === 0 && state.uploading.length === 0;
  const noSubtasks = detail.subtasks.length === 0;
  const noDependencies =
    detail.blockedBy.length === 0 &&
    detail.blocks.length === 0 &&
    detail.relatedTo.length === 0 &&
    detail.hiddenBlockerCount === 0 &&
    !state.addingDependency;
  return (
    <IssueAddBar label={labels.dependencies.addLabel}>
      {state.canUpload && noFiles ? (
        <IssueFilesButton
          onFiles={state.upload}
          title={t('attachments.dropHint', { size: ATTACHMENT_SIZE_MB })}
          data-testid='issue-add-attachment'
        >
          <PaperclipIcon data-icon='inline-start' />
          {attachments.title}
        </IssueFilesButton>
      ) : null}
      {canEdit && noSubtasks ? (
        <IssueAddButton
          nativeButton={false}
          render={<Link to='new-subtask' />}
          data-testid='issue-add-subtask'
        >
          <ListTreeIcon data-icon='inline-start' />
          {labels.subtasks.title}
        </IssueAddButton>
      ) : null}
      {canEdit && noSubtasks && breakdown.available ? (
        <IssueAddButton
          disabled={breakdown.starting}
          data-testid='intake-ai-breakdown'
          onClick={() => void breakdown.start()}
        >
          <SparklesIcon data-icon='inline-start' />
          {t('intakeAi.breakdown')}
        </IssueAddButton>
      ) : null}
      {canEdit && noDependencies ? (
        <IssueAddButton
          data-testid='issue-add-dependency'
          onClick={() => state.setAddingDependency(true)}
        >
          <Link2Icon data-icon='inline-start' />
          {labels.dependencies.addDependency}
        </IssueAddButton>
      ) : null}
      {children}
    </IssueAddBar>
  );
}

/**
 * The sub-issues by stage, with "Break into sub-issues" and "New sub-issue" for whoever may edit; nothing without any
 * (`IssueAddSection` offers the first).
 */
export function IssueSubtasksSection({
  detail,
}: {
  readonly detail: IssueDetail;
}): ReactElement | null {
  const { t, detail: labels } = useIssuePageWording();
  const viewer = useViewer();
  const breakdown = useIntakeBreakdown(detail.id);
  const parent = useIssueParent();
  const canEdit = canEditIssues(viewer);
  return (
    <IssueSubtasks
      groups={groupSubtasksByStage(detail.subtasks).map((group) => ({
        key: String(group.stage ?? 'none'),
        title:
          group.stage === null
            ? null
            : t('subtasks.stage', { stage: group.stage }),
        done: group.done,
        issues: group.subtasks.map((subtask) => ({
          id: subtask.id,
          identifier: subtask.identifier,
          title: subtask.title,
          href: issueHrefUnder(parent, subtask.id),
          status: {
            name: subtask.status.name,
            color: toneColor(statusTone([subtask.status], subtask.status.key)),
          },
          waiting:
            subtask.blockedCount > 0
              ? t('subtasks.waiting', { count: subtask.blockedCount })
              : null,
          executor: subtask.executor
            ? {
                name: subtask.executorName ?? subtask.executor.id,
                kind: subtask.executor.type,
              }
            : null,
        })),
      }))}
      actions={
        canEdit ? (
          <>
            {breakdown.available ? (
              <IssueAddButton
                disabled={breakdown.starting}
                data-testid='intake-ai-breakdown'
                onClick={() => void breakdown.start()}
              >
                <SparklesIcon data-icon='inline-start' />
                {t('intakeAi.breakdown')}
              </IssueAddButton>
            ) : null}
            <IssueAddButton
              nativeButton={false}
              render={<Link to='new-subtask' />}
            >
              <PlusIcon data-icon='inline-start' />
              {t('subtasks.new')}
            </IssueAddButton>
          </>
        ) : null
      }
      link={routerLink}
      labels={labels}
    />
  );
}

/**
 * The dependencies: blockers added through an issue search, removed here; "Blocks" read-only. Without any, it shows
 * once the add bar's "Dependency" opens the search (`state.addingDependency`).
 */
export function IssueDependenciesSection({
  detail,
  pageActions,
  state,
}: {
  readonly detail: IssueDetail;
  readonly pageActions: IssuePageActions;
  readonly state: IssueMainState;
}): ReactElement | null {
  const { t, detail: labels } = useIssuePageWording();
  const viewer = useViewer();
  const parent = useIssueParent();
  const dependencies = useDependencyActions(detail.id);
  const item = (
    dependency: IssueDetail['blockedBy'][number],
  ): DependencyItem => ({
    id: dependency.dependencyId,
    issueId: dependency.issueId,
    identifier: dependency.identifier,
    title: dependency.title,
    href: issueHrefUnder(parent, dependency.issueId),
    status: {
      name: dependency.status.name,
      color: toneColor(statusTone([dependency.status], dependency.status.key)),
    },
  });
  const canEdit = canEditIssues(viewer);
  return (
    <IssueDependencies
      blockedBy={detail.blockedBy.map(item)}
      blocks={detail.blocks.map(item)}
      related={detail.relatedTo.map(item)}
      hidden={
        detail.hiddenBlockerCount > 0
          ? t('dependencies.hidden', { count: detail.hiddenBlockerCount })
          : null
      }
      {...(canEdit
        ? {
            onAdd: (issue, type) => dependencies.add(issue.id, type),
            onChangeType: dependencies.change,
            onRemove: (dependency: DependencyItem) =>
              pageActions.removeDependency(dependency.id),
          }
        : {})}
      onSearch={pageActions.searchIssues}
      adding={state.addingDependency}
      onAddingChange={state.setAddingDependency}
      excludeIds={[detail.id]}
      link={routerLink}
      labels={labels}
    />
  );
}
