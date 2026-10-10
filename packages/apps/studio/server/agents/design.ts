/**
 * Design first (`shared/design.ts`), on the projects plugin's public services: the proposal is a comment of kind
 * `proposal` written as the agent (`CommentWriter`), and every decision is the plugin's own status move, so the
 * workflow's rules and runs hold:
 *
 * - `propose`: the agent of a run on the issue writes its proposal; an issue in Analysis moves to Proposal review.
 * - `approve`: the owner, the project lead or an administrator moves the issue to In progress (the workflow's stage
 *   run there tells its agent to implement the approved proposal); an optional comment goes with it, waking nobody.
 * - `requestChanges`: anyone who may comment on the issue writes why (waking nobody by itself) and moves it back to
 *   Analysis, whose stage run tells the agent to revise the whole proposal.
 * - The owner's card (`design_review`, through Studio's inbox port as a projects notice about the issue): sent when the
 *   issue enters Proposal review, settled when it leaves (approved, sent back, or moved by hand).
 *
 * The decision is about the document only: approving creates no sub-issues and sets no
 * executor; an agent that wants sub-issues says so in the proposal and creates them once approved.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';

import {
  ANALYSIS_STATUS,
  DESIGN_COMMENT_MAX,
  DESIGN_PROPOSAL_KIND,
  DESIGN_REVIEW_TYPE,
  IN_PROGRESS_STATUS,
  PROPOSAL_REVIEW_STATUS,
  type DesignProposal,
  type DesignState,
} from '../../shared/design.js';
import type { StudioInboxPort } from '../inbox/port.js';
import { ISSUE_SUBJECT, PROJECTS_SOURCE } from '../inbox/projects.js';
import { systemViewer } from '../previews/sources.js';
import { translated } from './commands/permissions.js';
import { AI_REVIEW_TEMPLATE_KEY } from './catalog/workflow-templates.js';

type DesignProjects = Pick<
  Projects,
  'issueQueries' | 'issues' | 'comments' | 'commentQueries' | 'tx' | 'events'
>;

export interface DesignDeps {
  readonly projects: () => DesignProjects;
  /** Studio's inbox port, for the owner's card; no card without one. */
  readonly inbox: () => StudioInboxPort | undefined;
}

/** The owner's card of an issue's proposal: one per issue, settled when the issue leaves Proposal review. */
export function designDecisionKey(issueId: string): string {
  return `design:${issueId}`;
}

/** How the card ends, by where the issue went. */
function outcomeOf(to: string): string {
  if (to === IN_PROGRESS_STATUS) return 'approved';
  if (to === ANALYSIS_STATUS) return 'changesRequested';
  return 'moved';
}

const SUMMARY_LENGTH = 300;

async function call<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw translated(error);
  }
}

export function createDesignService(deps: DesignDeps) {
  const projects = () => deps.projects();

  async function latestProposal(
    issueId: string,
  ): Promise<DesignProposal | null> {
    const comments = await projects().commentQueries.list(
      projects().tx.read(),
      issueId,
      { rootsOnly: true },
    );
    const proposal = [...comments]
      .reverse()
      .find(
        (comment) => comment.kind === DESIGN_PROPOSAL_KIND && !comment.deleted,
      );
    return proposal
      ? {
          commentId: proposal.id,
          content: proposal.content,
          authorType: proposal.authorType,
          authorId: proposal.authorId,
          authorName: proposal.authorName,
          createdAt: proposal.createdAt,
        }
      : null;
  }

  function mayApprove(viewer: Viewer, issue: IssueDetail): boolean {
    return (
      issue.ownerUserId === viewer.userId ||
      (issue.project?.leadUserId ?? null) === viewer.userId ||
      viewer.permissions.scopes['pm.issues/change-owner'] === 'all'
    );
  }

  function mayComment(viewer: Viewer): boolean {
    return viewer.permissions.scopes['pm.issues/comment'] !== 'none';
  }

  async function stateOf(
    viewer: Viewer,
    issue: IssueDetail,
  ): Promise<DesignState> {
    const inReview = issue.statusKey === PROPOSAL_REVIEW_STATUS;
    const proposal = await latestProposal(issue.id);
    return {
      issueId: issue.id,
      statusKey: issue.statusKey,
      inReview,
      proposal,
      canApprove: inReview && proposal !== null && mayApprove(viewer, issue),
      canRequestChanges: inReview && proposal !== null && mayComment(viewer),
    };
  }

  async function waiting(viewer: Viewer, idOrKey: string) {
    const issue = await call(() =>
      projects().issueQueries.detail(viewer, idOrKey),
    );
    if (issue.statusKey !== PROPOSAL_REVIEW_STATUS)
      throw new ProtocolError(
        'CONFLICT',
        `${issue.identifier} is not waiting in proposal review.`,
        { code: 'DESIGN_NOT_IN_REVIEW' },
      );
    if (!(await latestProposal(issue.id)))
      throw new ProtocolError(
        'CONFLICT',
        `${issue.identifier} has no design proposal.`,
        { code: 'DESIGN_PROPOSAL_MISSING' },
      );
    return issue;
  }

  function commentOf(value: unknown, required: boolean): string | null {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) {
      if (required)
        throw new ProtocolError(
          'INVALID_REQUEST',
          'Say what should change: a comment is required.',
          { code: 'DESIGN_COMMENT_REQUIRED' },
        );
      return null;
    }
    if (text.length > DESIGN_COMMENT_MAX)
      throw new ProtocolError(
        'INVALID_REQUEST',
        `The comment is longer than ${DESIGN_COMMENT_MAX} characters.`,
        { code: 'DESIGN_COMMENT_TOO_LONG' },
      );
    return text;
  }

  async function move(viewer: Viewer, issue: IssueDetail, statusKey: string) {
    const result = await call(() =>
      projects().issues.update(viewer, issue.id, {
        revision: issue.revision,
        statusKey,
      }),
    );
    if (result.pendingApproval)
      throw new ProtocolError(
        'CONFLICT',
        `Moving ${issue.identifier} to ${statusKey} waits for an approval.`,
        { code: 'DESIGN_MOVE_PENDING_APPROVAL' },
      );
  }

  const service = {
    async state(viewer: Viewer, idOrKey: string): Promise<DesignState> {
      const issue = await call(() =>
        projects().issueQueries.detail(viewer, idOrKey),
      );
      return stateOf(viewer, issue);
    },

    /** The agent's proposal for the issue of its run; an issue in Analysis moves to Proposal review. */
    async propose(
      viewer: Viewer,
      idOrKey: string,
      content: string,
      /** The issue the agent's run works on: the only one it proposes for. */
      runIssueId: string,
    ): Promise<{
      readonly proposal: DesignProposal;
      readonly statusKey: string;
    }> {
      if (!content.trim())
        throw new ProtocolError('INVALID_REQUEST', 'The proposal is empty.');
      let issue = await call(() =>
        projects().issueQueries.detail(viewer, idOrKey),
      );
      if (issue.id !== runIssueId)
        throw new ProtocolError(
          'FORBIDDEN',
          `Your run works on another issue than ${issue.identifier}: propose for that one.`,
        );
      const { comment } = await call(() =>
        projects().comments.post(
          viewer.actor,
          issue.id,
          { content },
          { kind: DESIGN_PROPOSAL_KIND, trigger: false },
        ),
      );
      if (issue.statusKey === ANALYSIS_STATUS) {
        await move(viewer, issue, PROPOSAL_REVIEW_STATUS);
        issue = await call(() =>
          projects().issueQueries.detail(viewer, issue.id),
        );
      }
      return {
        proposal: {
          commentId: comment.id,
          content: comment.content,
          authorType: comment.authorType,
          authorId: comment.authorId,
          authorName: comment.authorName,
          createdAt: comment.createdAt,
        },
        statusKey: issue.statusKey,
      };
    },

    async approve(
      viewer: Viewer,
      idOrKey: string,
      input: { readonly comment?: unknown },
    ): Promise<DesignState> {
      const issue = await waiting(viewer, idOrKey);
      if (!mayApprove(viewer, issue))
        throw new ProtocolError(
          'FORBIDDEN',
          'Only the owner, the project lead or an administrator may approve the proposal.',
          { code: 'DESIGN_APPROVE_FORBIDDEN' },
        );
      const comment = commentOf(input.comment, false);
      if (comment)
        await call(() =>
          projects().comments.post(
            viewer.actor,
            issue.id,
            { content: comment },
            { trigger: false },
          ),
        );
      await move(viewer, issue, IN_PROGRESS_STATUS);
      return service.state(viewer, issue.id);
    },

    async requestChanges(
      viewer: Viewer,
      idOrKey: string,
      input: { readonly comment?: unknown },
    ): Promise<DesignState> {
      const issue = await waiting(viewer, idOrKey);
      if (!mayComment(viewer))
        throw new ProtocolError(
          'FORBIDDEN',
          'Only someone who may comment on the issue may send the proposal back.',
          { code: 'DESIGN_REQUEST_CHANGES_FORBIDDEN' },
        );
      const comment = commentOf(input.comment, true) ?? '';
      // The comment wakes nobody by itself: entering Analysis runs the agent, which reads it.
      await call(() =>
        projects().comments.post(
          viewer.actor,
          issue.id,
          { content: comment },
          { trigger: false },
        ),
      );
      await move(viewer, issue, ANALYSIS_STATUS);
      return service.state(viewer, issue.id);
    },

    /**
     * Sends the owner's card when an issue enters Proposal review, and settles it when it leaves. Returns what stops
     * it.
     */
    bindCards(onError: (error: unknown) => void): () => void {
      return projects().events.on('issue.updated', (event) => {
        const status = event.changes.status;
        if (!status) return;
        const port = deps.inbox();
        if (!port) return;
        const key = designDecisionKey(event.issueId);
        const work = async () => {
          if (status.from === PROPOSAL_REVIEW_STATUS)
            await port.resolve({
              source: PROJECTS_SOURCE,
              decisionKey: key,
              outcome: outcomeOf(status.to),
            });
          if (status.to !== PROPOSAL_REVIEW_STATUS) return;
          const issue = await projects().issueQueries.detail(
            systemViewer(),
            event.issueId,
          );
          const conn = projects().tx.read();
          const project = issue.projectId
            ? await conn
                .repository<{ id: string; workflowId: string | null }>(
                  'pmProjects',
                )
                .findOne({ filter: { id: issue.projectId } })
            : null;
          const workflow = await conn
            .repository<{
              id: string;
              isDefault: boolean;
              builtInKey: string | null;
            }>('pmWorkflows')
            .findOne({
              filter: project?.workflowId
                ? { id: project.workflowId }
                : { isDefault: true },
            });
          // Agent review asks the owner only when a reviewer explicitly needs a human decision.
          if (workflow?.builtInKey === AI_REVIEW_TEMPLATE_KEY) return;
          const proposal = await latestProposal(issue.id);
          // A card still waiting from an earlier review is replaced.
          await port.resolve({
            source: PROJECTS_SOURCE,
            decisionKey: key,
            outcome: 'superseded',
          });
          await port.send({
            key: `${key}:${event.revision}`,
            source: PROJECTS_SOURCE,
            kind: 'decision',
            type: DESIGN_REVIEW_TYPE,
            userIds: [issue.ownerUserId],
            title: `A design proposal for ${issue.identifier} is waiting for your review`,
            body: issue.title,
            path: `/issues/${issue.identifier}`,
            subject: {
              type: ISSUE_SUBJECT,
              id: issue.id,
              label: issue.identifier,
            },
            decisionKey: key,
            actor: proposal
              ? {
                  type: proposal.authorType,
                  id: proposal.authorId,
                  name: proposal.authorName,
                }
              : null,
            data: {
              identifier: issue.identifier,
              ...(proposal
                ? {
                    proposalCommentId: proposal.commentId,
                    summary: proposal.content.slice(0, SUMMARY_LENGTH),
                  }
                : {}),
            },
          });
        };
        work().catch(onError);
      });
    },
  };
  return service;
}

export type DesignService = ReturnType<typeof createDesignService>;
