/**
 * Issues in the reports: what the agents plugin's reports may say about the issue a run worked on (its label and
 * project, and whether the person asking may see it), and the issue figures of the acceptance metrics, both from the
 * projects plugin's `reports` and over what the person may see there.
 */
import type {
  SubjectFacts,
  SubjectReports,
} from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';

import { AGENT_KIND } from '../agents/tx.js';

/** The issue figures of the metrics, over the issues the person may see. */
export interface IssueFigures {
  /** `YYYY-MM-DD` days with work on an issue (created, commented). */
  readonly activityDays: readonly string[];
  readonly issuesCreated: number;
  readonly commentsCreated: number;
  readonly memberIds: readonly string[];
  readonly deliveredTotal: number;
  readonly deliveredByAgent: number;
  readonly deliveredByAgentId: Readonly<Record<string, number>>;
  /** `YYYY-MM-DD` → the issues delivered that day, and those of them an agent executes. */
  readonly deliveredDaily: Readonly<
    Record<string, { readonly total: number; readonly byAgent: number }>
  >;
  /** Created → delivered of each delivered issue, in milliseconds. */
  readonly cycleMs: readonly number[];
  readonly reviewExits: number;
  readonly reviewPassed: number;
  readonly reworked: number;
  readonly approvalsApproved: number;
  readonly approvalsRejected: number;
  readonly decisionsCreated: number;
  readonly decisionsOpen: number;
  readonly decisionResolveMs: readonly number[];
  readonly decisionsByOutcome: Readonly<Record<string, number>>;
}

export type ViewerOf = (userId: string) => Promise<Viewer>;

/** What the agents plugin's reports say about an issue a run worked on; its group is its project. */
export function issueReports(
  projects: () => Pick<Projects, 'reports'>,
  viewerOf: ViewerOf,
): SubjectReports {
  return {
    async describe(_conn, userId, ids) {
      const facts = await projects().reports.describe(
        await viewerOf(userId),
        ids,
      );
      return new Map(
        [...facts].map(([id, issue]): [string, SubjectFacts] => [
          id,
          {
            label: `${issue.identifier} ${issue.title}`,
            visible: issue.visible,
            group: issue.project,
          },
        ]),
      );
    },
  };
}

/** The issue figures of `range`, in `projectId` when one is asked. */
export async function issueFigures(
  projects: Pick<Projects, 'reports'>,
  viewer: Viewer,
  range: {
    readonly from: Date;
    readonly to: Date;
    readonly projectId: string | null;
  },
): Promise<IssueFigures> {
  const report = await projects.reports.report(viewer, {
    ...range,
    agentKind: AGENT_KIND,
  });
  return {
    activityDays: report.adoption.activityDays,
    issuesCreated: report.adoption.issuesCreated,
    commentsCreated: report.adoption.commentsCreated,
    memberIds: report.adoption.memberIds,
    deliveredTotal: report.aiShare.deliveredTotal,
    deliveredByAgent: report.aiShare.deliveredByAgent,
    deliveredByAgentId: report.aiShare.byAgent,
    deliveredDaily: report.aiShare.daily,
    cycleMs: report.aiShare.cycleMs,
    reviewExits: report.trust.reviewExits,
    reviewPassed: report.trust.reviewPassed,
    reworked: report.trust.reworked,
    approvalsApproved: report.trust.approvalsApproved,
    approvalsRejected: report.trust.approvalsRejected,
    decisionsCreated: report.decisions.created,
    decisionsOpen: report.decisions.open,
    decisionResolveMs: report.decisions.resolveMs,
    decisionsByOutcome: report.decisions.byOutcome,
  };
}
