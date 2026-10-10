/**
 * The inbox entry of the projects plugin's notices (source `projects`): issue approvals and their outcomes (one that
 * no longer applies included), comments, mentions, assignments, status changes, sub-issue progress, suggested
 * executors, and Studio's notices sent as projects notices (a failed run, a blocked agent, a merged pull request). The detail pane loads the issue once; an
 * approval request is decided through the plugin's own API (`decideApproval`) by one of its approvers, and the plugin
 * then settles every approver's item through Studio's inbox port.
 */
import { ApiClientError } from '@nocobase/app-client';
import {
  pmKeys,
  usePmApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { ApprovalRequest } from '@nocobase/app-plugin-projects/shared/approvals';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  ArrowRightLeftIcon,
  AtSignIcon,
  BellIcon,
  BotIcon,
  CircleXIcon,
  CompassIcon,
  GitMergeIcon,
  HandIcon,
  LayersIcon,
  type LucideIcon,
  MessageSquareIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UnlockIcon,
  UserCheckIcon,
  UserPlusIcon,
} from 'lucide-react';

import {
  isSettled,
  kindOf,
  type InboxEntry,
} from '@/extensions/nocobase-inbox/model';
import {
  defineInboxRenderer,
  type InboxEntryRenderer,
} from '@/extensions/nocobase-inbox/registry';
import { ApprovalActions, ProjectsBody } from './projects-parts.js';
import {
  PROJECTS_SOURCE,
  useEntryText,
  useTypeLabel,
} from './projects-wording.js';

/** One icon per type, so a card is recognisable before it is read. */
const TYPE_ICON: Readonly<Record<string, LucideIcon>> = {
  approval_requested: ShieldCheckIcon,
  approval_decided: ShieldCheckIcon,
  approval_stale: ShieldAlertIcon,
  status_changed: ArrowRightLeftIcon,
  owner_notified: ArrowRightLeftIcon,
  batch_done: LayersIcon,
  dependency_released: UnlockIcon,
  owner_assigned: UserCheckIcon,
  executor_assigned: UserPlusIcon,
  executor_suggested: BotIcon,
  design_review: CompassIcon,
  mentioned: AtSignIcon,
  commented: MessageSquareIcon,
  // Studio's agent notices, sent through the projects plugin's notice rules.
  run_failed_final: CircleXIcon,
  agent_blocked: HandIcon,
  pr_merged: GitMergeIcon,
  stage_action_problem: TriangleAlertIcon,
};

/** The decisions settled through the projects plugin's approvals; any other decision has no approval to find. */
const APPROVAL_TYPES: ReadonlySet<string> = new Set(['approval_requested']);

/** Where an approval decision stands for the viewer: nothing to decide, loading, decidable, forbidden, or gone. */
type DecisionState = 'none' | 'loading' | 'bar' | 'forbidden' | 'gone';

export interface ProjectsModel {
  readonly issueId: string | null;
  readonly detail: UseQueryResult<IssueDetail>;
  readonly request: ApprovalRequest | null;
  readonly decision: DecisionState;
}

function useProjectsModel(entry: InboxEntry): ProjectsModel {
  const api = usePmApi();
  const viewer = useViewer();
  const { notice } = entry;
  const issueId = notice?.subject?.type === 'issue' ? notice.subject.id : null;
  const detail = useQuery({
    queryKey: pmKeys.issue(issueId ?? ''),
    queryFn: () => api.issue(issueId ?? ''),
    enabled: issueId !== null,
    retry: (count, error) =>
      !(error instanceof ApiClientError && [403, 404].includes(error.status)) &&
      count < 1,
  });
  const request =
    notice?.decisionKey &&
    detail.data?.pendingApproval?.id === notice.decisionKey
      ? detail.data.pendingApproval
      : null;
  const forbidden =
    detail.error instanceof ApiClientError && detail.error.status === 403;
  // A decision waits until the server says otherwise; what may be done about it depends on the issue.
  const waiting =
    kindOf(entry) === 'decision' &&
    !isSettled(entry) &&
    Boolean(notice?.decisionKey) &&
    APPROVAL_TYPES.has(notice?.type ?? '');
  const decision: DecisionState = !waiting
    ? 'none'
    : issueId === null
      ? 'bar'
      : detail.isPending
        ? 'loading'
        : forbidden
          ? 'forbidden'
          : !request
            ? 'gone'
            : viewer !== undefined &&
                !request.approverUserIds.includes(viewer.userId)
              ? 'forbidden'
              : 'bar';
  return { issueId, detail, request, decision };
}

/** The renderer's parts, which a card of another contributor sent as a projects notice reuses (`failed-runs.tsx`). */
export const projectsParts: InboxEntryRenderer<ProjectsModel> = {
  source: PROJECTS_SOURCE,
  icon: (entry) => TYPE_ICON[entry.notice?.type ?? ''] ?? BellIcon,
  useWording() {
    const { t } = useTranslation();
    const label = useTypeLabel();
    const text = useEntryText();
    return {
      label,
      text: (entry, model) =>
        model
          ? text(entry, {
              issueTitle:
                model.detail.data?.title ?? model.request?.issueTitle ?? null,
              statuses: model.detail.data?.statuses,
              request: model.request,
            })
          : text(entry),
      open: t('inbox.openIssue'),
    };
  },
  useModel: useProjectsModel,
  useCanAct(_entry, model) {
    const { t } = useTranslation();
    switch (model.decision) {
      case 'loading':
        return { state: 'loading' };
      case 'bar':
        return { state: 'yes' };
      case 'forbidden':
        return { state: 'no', reason: t('inbox.request.forbidden') };
      default:
        return { state: 'none' };
    }
  },
  Actions: ApprovalActions,
  Body: ProjectsBody,
  context(entry, model) {
    if (!model.issueId) return {};
    return {
      ids: [model.issueId],
      ask: {
        kind: 'issue',
        id: model.issueId,
        label: [entry.notice?.subject?.label, model.detail.data?.title]
          .filter(Boolean)
          .join(' '),
      },
    };
  },
};

export const projectsRenderer =
  defineInboxRenderer<ProjectsModel>(projectsParts);
