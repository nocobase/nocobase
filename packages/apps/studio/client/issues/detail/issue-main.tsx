/**
 * The projects plugin's sections of an issue's main column, drawn with the installed `issue-detail` block and
 * `attachment-list` over the plugin's headless hooks (`client/issues`), in the plugin's words: the header, the
 * description, the add bar under it, a status change waiting for approval and the last decided ones, the checklist, the
 * sub-issues, the dependencies and the files. A part with nothing to show renders nothing; the add bar adds its first
 * item. Each checks the viewer's permissions: without `issues/edit` nothing here changes the issue.
 */
import {
  ATTACHMENT_SIZE_MB,
  canDeleteIssues,
  canEditIssues,
  groupSubtasksByStage,
  statusTone,
  useIntakeBreakdown,
  useKindLabel,
  useMentionSearch,
  useStatusName,
  type IssuePageActions,
  type IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type {
  IssueDetail,
  StatusDefinition,
} from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import {
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
  IssueApprovalCard,
  IssueAttachments,
  IssueChecklist,
  IssueDeleteButton,
  IssueDependencies,
  IssueDescription,
  IssueFilesButton,
  IssueHeader,
  IssueRecentApprovals,
  IssueSubtasks,
  type DependencyItem,
  type IssueDetailLink,
  type IssueDetailStatus,
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

/** A status of the issue's workflow as the block shows it. */
function useStatusOf(
  statuses: readonly StatusDefinition[],
): (key: string) => IssueDetailStatus {
  const statusName = useStatusName();
  return (key) => ({
    name: statusName(statuses, key),
    color: toneColor(statusTone(statuses, key)),
  });
}

/** The header: the page's `actions` and "Delete", the parent, the title and the meta; the trail by the issue's project and parent goes in the shell header (`issue-trail.ts`). */
export function IssueHeaderSection({
  detail,
  update,
  actions,
  pageActions,
  meta,
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly actions?: ReactNode;
  readonly pageActions: IssuePageActions;
  readonly meta?: ReactNode;
}): ReactElement {
  const { detail: labels } = useIssuePageWording();
  const viewer = useViewer();
  const navigate = useNavigate();
  const statusOf = useStatusOf(detail.statuses);
  const parent = useIssueParent();
  useIssueTrail(detail);
  return (
    <IssueHeader
      identifier={detail.identifier}
      title={detail.title}
      status={statusOf(detail.statusKey)}
      parent={
        detail.parent
          ? {
              identifier: detail.parent.identifier,
              title: detail.parent.title,
              href: issueHrefUnder(parent, detail.parent.id),
            }
          : null
      }
      project={
        detail.project
          ? {
              name: detail.project.name,
              href: `/projects/${encodeURIComponent(detail.project.id)}`,
            }
          : null
      }
      actions={
        <>
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
        </>
      }
      meta={meta}
      {...(canEditIssues(viewer)
        ? {
            onRename: async (title: string) => {
              await update.mutateAsync({ title });
            },
          }
        : {})}
      link={routerLink}
      labels={labels}
    />
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

const OUTCOME_TONE = {
  approved: 'green',
  rejected: 'red',
  withdrawn: 'grey',
  stale: 'amber',
} as const;

/** A status change waiting for approval (unless `hidePending`, shown elsewhere), then the last decided ones. */
export function IssueApprovalsSection({
  detail,
  pageActions,
  hidePending,
}: {
  readonly detail: IssueDetail;
  readonly pageActions: IssuePageActions;
  readonly hidePending: boolean;
}): ReactElement {
  const { i18n } = useTranslation();
  const { t, detail: labels } = useIssuePageWording();
  const viewer = useViewer();
  const kindLabel = useKindLabel();
  const statusOf = useStatusOf(detail.statuses);
  const pending = detail.pendingApproval;
  return (
    <>
      {pending && !hidePending ? (
        <IssueApprovalCard
          from={statusOf(pending.fromStatus)}
          to={statusOf(pending.toStatus)}
          requester={`${pending.requestedByName ?? t('common.unknown')}${
            pending.requestedByType === 'user'
              ? ''
              : ` · ${kindLabel(pending.requestedByType)}`
          }`}
          requestedAt={pending.createdAt}
          approvers={pending.approverNames}
          canDecide={
            viewer !== undefined &&
            pending.approverUserIds.includes(viewer.userId)
          }
          canWithdraw={
            pending.requestedByType === 'user' &&
            pending.requestedById === viewer?.userId
          }
          onDecide={(decision, comment) =>
            pageActions.decideApproval(pending.id, decision, comment)
          }
          locale={i18n.language}
          labels={labels}
        />
      ) : null}
      <IssueRecentApprovals
        approvals={detail.recentApprovals.map((approval) => ({
          id: approval.id,
          from: statusOf(approval.fromStatus),
          to: statusOf(approval.toStatus),
          outcome: t(`approvals.outcomes.${approval.status}`),
          outcomeTone:
            OUTCOME_TONE[approval.status as keyof typeof OUTCOME_TONE] ??
            'grey',
          decidedBy: approval.decidedByName,
          at: approval.decidedAt ?? approval.updatedAt,
          comment: approval.comment,
        }))}
        locale={i18n.language}
        labels={labels}
      />
    </>
  );
}

/** The checklist of the current status, when its workflow has one. */
export function IssueChecklistSection({
  detail,
  pageActions,
}: {
  readonly detail: IssueDetail;
  readonly pageActions: IssuePageActions;
}): ReactElement | null {
  const { i18n } = useTranslation();
  const { t, detail: labels } = useIssuePageWording();
  const viewer = useViewer();
  const statusOf = useStatusOf(detail.statuses);
  const checklist = detail.checklist;
  if (!checklist) return null;
  return (
    <IssueChecklist
      status={statusOf(checklist.statusKey)}
      items={checklist.items.map((item) => ({
        key: item.itemKey,
        label: item.label,
        required: item.required,
        checked: item.checked,
        checkedBy: item.checkedByName ?? t('common.unknown'),
        checkedAt: item.checkedAt,
      }))}
      complete={checklist.complete}
      {...(canEditIssues(viewer)
        ? { onToggle: pageActions.toggleChecklistItem }
        : {})}
      locale={i18n.language}
      labels={labels}
    />
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
