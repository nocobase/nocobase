/**
 * The inbox entry of the projects plugin's notices (source `projects`): comments, mentions, assignments, status
 * changes, sub-issue progress, and Studio's notices sent as projects notices (a failed run, a blocked agent, a merged
 * pull request). Notices of removed features (approvals, stage rules) stay readable. The detail pane loads the issue
 * once.
 */
import { ApiClientError } from '@nocobase/app-client';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
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

import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import {
  defineInboxRenderer,
  type InboxEntryRenderer,
} from '@/extensions/nocobase-inbox/registry';
import { ProjectsBody } from './projects-parts.js';
import {
  PROJECTS_SOURCE,
  useEntryText,
  useTypeLabel,
} from './projects-wording.js';

/** One icon per type, so a card is recognisable before it is read. */
const TYPE_ICON: Readonly<Record<string, LucideIcon>> = {
  owner_handoff: UserCheckIcon,
  owner_handoff_rejected: CircleXIcon,
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
  comment_runs_limited: TriangleAlertIcon,
};

export interface ProjectsModel {
  readonly issueId: string | null;
  readonly detail: UseQueryResult<IssueDetail>;
}

function useProjectsModel(entry: InboxEntry): ProjectsModel {
  const api = usePmApi();
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
  return { issueId, detail };
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
              issueTitle: model.detail.data?.title ?? null,
              statuses: model.detail.data?.statuses,
            })
          : text(entry),
      open: t('inbox.openIssue'),
    };
  },
  useModel: useProjectsModel,
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
