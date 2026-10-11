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
 * Approval may select an eligible executor and moves the issue atomically. An agent that wants sub-issues
 * says so in the proposal and creates them once approved.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import { canImplement } from './executor.js';
import { ProtocolError } from '@nocobase/agent-protocol';
import type {
  Projects,
  KindRegistry,
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
  type DesignExecutor,
  type DesignExecutorCandidate,
  type DesignState,
} from '../../shared/design.js';
import type { StudioInboxPort } from '../inbox/port.js';
import { ISSUE_SUBJECT, PROJECTS_SOURCE } from '../inbox/projects.js';
import { systemViewer } from '../previews/sources.js';
import { translated } from './commands/permissions.js';

type DesignProjects = Pick<
  Projects,
  | 'issueQueries'
  | 'issues'
  | 'comments'
  | 'commentQueries'
  | 'tx'
  | 'events'
  | 'projects'
>;

export interface DesignDeps {
  readonly agents: Pick<Agents, 'agents'>;
  readonly kinds: Pick<KindRegistry, 'requireExecutor'>;
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

  async function candidates(
    viewer: Viewer,
    issue: IssueDetail,
  ): Promise<DesignExecutorCandidate[]> {
    const conn = projects().tx.read();
    const agents = (await deps.agents.agents.listActive(conn)).filter(
      (agent) =>
        agent.type === 'runner' &&
        canImplement(agent) &&
        deps.agents.agents.mayInvoke(agent, viewer.userId),
    );
    const result: DesignExecutorCandidate[] = agents.map((agent) => ({
      type: 'agent',
      id: agent.id,
      name: agent.name,
    }));
    if (issue.projectId) {
      // Approving needs the issue, not the project: a viewer who may not see the project is offered the agents alone,
      // and its members stay hidden from them.
      const project = await projects()
        .projects.get(viewer, issue.projectId)
        .catch((error: unknown) => {
          const kind = (error as { kind?: unknown } | null)?.kind;
          if (kind === 'notFound' || kind === 'forbidden') return null;
          throw translated(error);
        });
      for (const member of project?.members ?? []) {
        try {
          await deps.kinds.requireExecutor(
            conn,
            'user',
            member.id,
            viewer.userId,
          );
        } catch {
          continue;
        }
        result.push({ type: 'user', id: member.id, name: member.name });
      }
    }
    return result;
  }

  async function executorOk(
    viewer: Viewer,
    issue: IssueDetail,
  ): Promise<boolean> {
    const executor = issue.executor;
    if (!executor || (executor.type !== 'user' && executor.type !== 'agent'))
      return false;
    try {
      await deps.kinds.requireExecutor(
        projects().tx.read(),
        executor.type,
        executor.id,
        viewer.userId,
      );
    } catch {
      return false;
    }
    if (executor.type === 'user') return true;
    const agent = await deps.agents.agents.findWorkable(
      projects().tx.read(),
      executor.id,
    );
    return (
      !!agent &&
      agent.type === 'runner' &&
      canImplement(agent) &&
      deps.agents.agents.mayInvoke(agent, viewer.userId)
    );
  }

  async function stateOf(
    viewer: Viewer,
    issue: IssueDetail,
  ): Promise<DesignState> {
    const inReview = issue.statusKey === PROPOSAL_REVIEW_STATUS;
    const proposal = await latestProposal(issue.id);
    const canApprove =
      inReview && proposal !== null && mayApprove(viewer, issue);
    const executorCandidates = canApprove
      ? await candidates(viewer, issue)
      : [];
    const recommendation =
      proposal?.content.match(
        /(?:推荐执行者|Recommended executor)[^\n]*\n([\s\S]*)$/iu,
      )?.[1] ?? '';
    const matches = executorCandidates.filter(
      (candidate) =>
        candidate.type === 'agent' &&
        (recommendation.includes(candidate.name) ||
          (candidate.id === 'studio-senior-developer' &&
            /高级开发|Senior developer/iu.test(recommendation))),
    );
    return {
      executorOk: await executorOk(viewer, issue),
      executorCandidates,
      recommendedAgentId: matches.length === 1 ? matches[0].id : null,
      issueId: issue.id,
      statusKey: issue.statusKey,
      inReview,
      proposal,
      canApprove,
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

  async function move(
    viewer: Viewer,
    issue: IssueDetail,
    statusKey: string,
    executor?: DesignExecutor,
  ) {
    const result = await call(() =>
      projects().issues.update(viewer, issue.id, {
        revision: issue.revision,
        statusKey,
        ...(executor ? { executor } : {}),
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
      input: { readonly comment?: unknown; readonly executor?: DesignExecutor },
    ): Promise<DesignState> {
      return projects().tx.unit(async () => {
        const issue = await waiting(viewer, idOrKey);
        if (!mayApprove(viewer, issue))
          throw new ProtocolError(
            'FORBIDDEN',
            'Only the owner, the project lead or an administrator may approve the proposal.',
            { code: 'DESIGN_APPROVE_FORBIDDEN' },
          );
        if (input.executor) {
          const eligible = await candidates(viewer, issue);
          if (
            !eligible.some(
              (candidate) =>
                candidate.type === input.executor!.type &&
                candidate.id === input.executor!.id,
            )
          )
            throw new ProtocolError(
              'INVALID_REQUEST',
              'The selected executor is no longer eligible.',
              { code: 'DESIGN_EXECUTOR_INVALID' },
            );
        } else if (!(await executorOk(viewer, issue))) {
          throw new ProtocolError(
            'CONFLICT',
            'Choose a developer agent or a person before approving.',
            { code: 'DESIGN_EXECUTOR_REQUIRED' },
          );
        }
        const comment = commentOf(input.comment, false);
        await move(viewer, issue, IN_PROGRESS_STATUS, input.executor);
        if (comment)
          await call(() =>
            projects().comments.post(
              viewer.actor,
              issue.id,
              { content: comment },
              { trigger: false },
            ),
          );
        return service.state(viewer, issue.id);
      });
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
