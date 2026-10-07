/**
 * The browser API of `/api/projects`, typed with the server's `shared/` contracts. One method per endpoint; responses
 * are unwrapped from `{ data }`, and cursor lists become a `Page` whose `nextCursor` is the next `pageToken`. Failures
 * throw `ApiClientError` (status, reason, message).
 */
import type { ApiClient } from '@nocobase/app-client';

import type { Page } from '../../shared/common.js';
import type { ApprovalRequest } from '../../shared/approvals.js';
import type { Attachment } from '../../shared/attachments.js';
import type {
  IssueChecklist,
  UpdateChecklistItemRequest,
} from '../../shared/checklists.js';
import {
  THREAD_PAGE_LIMIT,
  type CommentReaction,
  type CommentReactions,
  type CreateCommentRequest,
  type CreateCommentResult,
  type IssueComment,
  type MentionCandidate,
  type ThreadPage,
  type ThreadResolution,
} from '../../shared/comments.js';
import type {
  CreateInvitationsRequest,
  Invitation,
  InvitationResult,
} from '../../shared/invitations.js';
import {
  ACTIVITY_PAGE_LIMIT,
  ISSUE_PAGE_LIMIT,
  type ActivityPage,
  type CreateIssueRequest,
  type Issue,
  type IssueBoard,
  type IssueStarts,
  type IssueDetail,
  type IssueListItem,
  type IssueListQuery,
  type IssueSort,
  type StatusDefinition,
  type UpdateIssueRequest,
  type UpdateIssueResult,
} from '../../shared/issues.js';
import type {
  CreateLabelRequest,
  Label,
  UpdateLabelRequest,
} from '../../shared/labels.js';
import type { ExecutorCandidate } from '../../shared/kinds.js';
import type { ApiKeyActor, Me, Member } from '../../shared/members.js';
import type {
  CreateProjectRequest,
  CreateProjectResourceRequest,
  ProjectDetail,
  ProjectListItem,
  ProjectResource,
  UpdateProjectRequest,
  UpdateProjectResourceRequest,
} from '../../shared/projects.js';
import type {
  UpdateSettingsRequest,
  WorkspaceSettings,
} from '../../shared/settings.js';
import type {
  AddDependencyRequest,
  IssueDependency,
} from '../../shared/subtasks.js';
import type { UserRef } from '../../shared/common.js';
import type { SubscriptionState } from '../../shared/subscriptions.js';
import type {
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowDefinition,
  WorkflowListItem,
  WorkflowPreview,
} from '../../shared/workflows.js';

type Method = 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type Query = Readonly<Record<string, string | number | boolean | undefined>>;

const id = (value: string) => encodeURIComponent(value);

/** Query parameters without empty values. */
function present(query: Query): Query {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== '' && value !== false,
    ),
  );
}

const ORDER_FIELDS: Readonly<Record<IssueSort, string>> = {
  updated: 'updatedAt',
  created: 'createdAt',
  number: 'number',
  priority: 'priority',
};

/** The list query as URL parameters: the filters, `orderBy`, and a page of `ISSUE_PAGE_LIMIT.default` issues. */
function issueQuery(query: IssueListQuery): Query {
  const { sort, direction, cursor, limit, ...filters } = query;
  return present({
    ...filters,
    orderBy: `${ORDER_FIELDS[sort ?? 'updated']} ${direction ?? 'desc'}`,
    pageSize: limit ?? ISSUE_PAGE_LIMIT.default,
    pageToken: cursor,
  });
}

/** A cursor list as the API answers it. */
interface CursorList<T> {
  readonly data: T[];
  readonly meta?: { readonly nextPageToken?: string };
}

export class PmApi {
  public constructor(private readonly api: ApiClient) {}

  // Members and access

  public me(): Promise<Me> {
    return this.get('projects/me');
  }

  public members(): Promise<Member[]> {
    return this.get('projects/members');
  }

  /** Organizations' API keys, by their identities: not members, but named where they acted. */
  public apiKeyActors(): Promise<ApiKeyActor[]> {
    return this.get('projects/apiKeyActors');
  }

  /** Executors of other kinds (agents, say) the signed-in user may give work to. */
  public executors(): Promise<ExecutorCandidate[]> {
    return this.get('projects/executors');
  }

  public invitations(): Promise<Invitation[]> {
    return this.get('projects/invitations');
  }

  public async invite(
    input: CreateInvitationsRequest,
  ): Promise<readonly InvitationResult[]> {
    const { results } = await this.send<{
      readonly results: readonly InvitationResult[];
    }>('projects/invitations', 'POST', input);
    return results;
  }

  public resendInvitation(invitationId: string): Promise<InvitationResult> {
    return this.send(`projects/invitations/${id(invitationId)}/resend`, 'POST');
  }

  public revokeInvitation(invitationId: string): Promise<void> {
    return this.send(`projects/invitations/${id(invitationId)}`, 'DELETE');
  }

  // Settings and labels

  public settings(): Promise<WorkspaceSettings> {
    return this.get('projects/settings');
  }

  public updateSettings(
    input: UpdateSettingsRequest,
  ): Promise<WorkspaceSettings> {
    return this.send('projects/settings', 'PATCH', input);
  }

  public labels(): Promise<Label[]> {
    return this.get('projects/labels');
  }

  public createLabel(input: CreateLabelRequest): Promise<Label> {
    return this.send('projects/labels', 'POST', input);
  }

  public updateLabel(
    labelId: string,
    input: UpdateLabelRequest,
  ): Promise<Label> {
    return this.send(`projects/labels/${id(labelId)}`, 'PATCH', input);
  }

  public deleteLabel(labelId: string): Promise<void> {
    return this.send(`projects/labels/${id(labelId)}`, 'DELETE');
  }

  // Workflows

  public workflows(): Promise<WorkflowListItem[]> {
    return this.get('projects/workflows');
  }

  public workflow(workflowId: string): Promise<WorkflowListItem> {
    return this.get(`projects/workflows/${id(workflowId)}`);
  }

  public createWorkflow(
    input: CreateWorkflowRequest,
  ): Promise<WorkflowListItem> {
    return this.send('projects/workflows', 'POST', input);
  }

  public updateWorkflow(
    workflowId: string,
    input: UpdateWorkflowRequest,
  ): Promise<WorkflowListItem> {
    return this.send(`projects/workflows/${id(workflowId)}`, 'PATCH', input);
  }

  /** What saving `definition` would change in the workflow's rules; nothing is written. */
  public previewWorkflow(
    workflowId: string,
    definition: WorkflowDefinition,
  ): Promise<WorkflowPreview> {
    return this.send(`projects/workflows/${id(workflowId)}/preview`, 'POST', {
      definition,
    });
  }

  public setDefaultWorkflow(workflowId: string): Promise<WorkflowListItem> {
    return this.send(`projects/workflows/${id(workflowId)}/setDefault`, 'POST');
  }

  public deleteWorkflow(workflowId: string): Promise<void> {
    return this.send(`projects/workflows/${id(workflowId)}`, 'DELETE');
  }

  // Projects

  public projects(): Promise<ProjectListItem[]> {
    return this.get('projects');
  }

  public project(projectId: string): Promise<ProjectDetail> {
    return this.get(`projects/${id(projectId)}`);
  }

  public createProject(input: CreateProjectRequest): Promise<ProjectDetail> {
    return this.send('projects', 'POST', input);
  }

  public updateProject(
    projectId: string,
    input: UpdateProjectRequest,
  ): Promise<ProjectDetail> {
    return this.send(`projects/${id(projectId)}`, 'PATCH', input);
  }

  public deleteProject(projectId: string): Promise<void> {
    return this.send(`projects/${id(projectId)}`, 'DELETE');
  }

  /** Answers the member added. */
  public addProjectMember(projectId: string, userId: string): Promise<UserRef> {
    return this.send(`projects/${id(projectId)}/members`, 'POST', {
      userId,
    });
  }

  public removeProjectMember(projectId: string, userId: string): Promise<void> {
    return this.send(
      `projects/${id(projectId)}/members/${id(userId)}`,
      'DELETE',
    );
  }

  public addProjectResource(
    projectId: string,
    input: CreateProjectResourceRequest,
  ): Promise<ProjectResource> {
    return this.send(`projects/${id(projectId)}/resources`, 'POST', input);
  }

  public updateProjectResource(
    projectId: string,
    resourceId: string,
    input: UpdateProjectResourceRequest,
  ): Promise<ProjectResource> {
    return this.send(
      `projects/${id(projectId)}/resources/${id(resourceId)}`,
      'PATCH',
      input,
    );
  }

  public deleteProjectResource(
    projectId: string,
    resourceId: string,
  ): Promise<void> {
    return this.send(
      `projects/${id(projectId)}/resources/${id(resourceId)}`,
      'DELETE',
    );
  }

  // Issues

  /** The statuses of a project's workflow; without a project, those of issues without one. */
  public statuses(projectId?: string | null): Promise<StatusDefinition[]> {
    return this.get('projects/issues/statuses', projectId ? { projectId } : {});
  }

  /** The ways a new issue may start in a project's workflow; without a project, in that of issues without one. */
  public starts(projectId?: string | null): Promise<IssueStarts> {
    return this.get('projects/issues/starts', projectId ? { projectId } : {});
  }

  public issuePage(query: IssueListQuery): Promise<Page<IssueListItem>> {
    return this.page('projects/issues', issueQuery(query));
  }

  /** A column per status, each with its first `ISSUE_PAGE_LIMIT.default` issues. */
  public board(query: IssueListQuery): Promise<IssueBoard> {
    return this.get(
      'projects/issues/board',
      issueQuery({ ...query, cursor: undefined }),
    );
  }

  /** One issue, by id or identifier (`PM-12`). */
  public issue(idOrKey: string): Promise<IssueDetail> {
    return this.get(`projects/issues/${id(idOrKey)}`);
  }

  public activities(issueId: string, cursor?: string): Promise<ActivityPage> {
    return this.page(
      `projects/issues/${id(issueId)}/activities`,
      present({ pageSize: ACTIVITY_PAGE_LIMIT.default, pageToken: cursor }),
    );
  }

  public createIssue(input: CreateIssueRequest): Promise<Issue> {
    return this.send('projects/issues', 'POST', input);
  }

  /** The issue after the change; with `pendingApproval`, unchanged because the status change waits for approval. */
  public updateIssue(
    issueId: string,
    input: UpdateIssueRequest,
  ): Promise<UpdateIssueResult> {
    return this.send(`projects/issues/${id(issueId)}`, 'PATCH', input);
  }

  public deleteIssue(issueId: string): Promise<void> {
    return this.send(`projects/issues/${id(issueId)}`, 'DELETE');
  }

  public restoreIssue(issueId: string): Promise<Issue> {
    return this.send(`projects/issues/${id(issueId)}/restore`, 'POST');
  }

  // Approvals

  /** The status changes waiting for the caller's approval. */
  public approvals(): Promise<ApprovalRequest[]> {
    return this.get('projects/approvals');
  }

  public decideApproval(
    requestId: string,
    decision: 'approve' | 'reject',
    comment?: string,
  ): Promise<ApprovalRequest> {
    return this.send(
      `projects/approvals/${id(requestId)}/${decision}`,
      'POST',
      comment ? { comment } : {},
    );
  }

  public withdrawApproval(requestId: string): Promise<ApprovalRequest> {
    return this.send(`projects/approvals/${id(requestId)}/withdraw`, 'POST');
  }

  /** Makes the issue wait for (`blockedBy`, the default) or link to (`relatedTo`) another; answers the link. */
  public addDependency(
    issueId: string,
    input: AddDependencyRequest,
  ): Promise<IssueDependency> {
    return this.send(
      `projects/issues/${id(issueId)}/dependencies`,
      'POST',
      input,
    );
  }

  /** Removes the link to `dependsOnIssueId` of `type` (`blockedBy` when left out). */
  public removeDependencyTo(
    issueId: string,
    input: AddDependencyRequest,
  ): Promise<void> {
    return this.send(
      `projects/issues/${id(issueId)}/removeDependency`,
      'POST',
      input,
    );
  }

  public removeDependency(
    issueId: string,
    dependencyId: string,
  ): Promise<void> {
    return this.send(
      `projects/issues/${id(issueId)}/dependencies/${id(dependencyId)}`,
      'DELETE',
    );
  }

  /** Checks or unchecks one item of the issue's checklist of `statusKey`; answers that checklist. */
  public setChecklistItem(
    issueId: string,
    statusKey: string,
    itemKey: string,
    input: UpdateChecklistItemRequest,
  ): Promise<IssueChecklist> {
    return this.send(
      `projects/issues/${id(issueId)}/checklists/${id(statusKey)}/items/${id(itemKey)}`,
      'PATCH',
      input,
    );
  }

  // Comments and subscriptions

  /** Threads older than `cursor` (the detail brings the newest page and its cursor). */
  public threads(issueId: string, cursor?: string): Promise<ThreadPage> {
    return this.page(
      `projects/issues/${id(issueId)}/comments`,
      present({ pageSize: THREAD_PAGE_LIMIT.default, pageToken: cursor }),
    );
  }

  public createComment(
    issueId: string,
    input: CreateCommentRequest,
  ): Promise<CreateCommentResult> {
    return this.send(`projects/issues/${id(issueId)}/comments`, 'POST', input);
  }

  public updateComment(
    commentId: string,
    content: string,
  ): Promise<IssueComment> {
    return this.send(`projects/comments/${id(commentId)}`, 'PATCH', {
      content,
    });
  }

  public deleteComment(commentId: string): Promise<void> {
    return this.send(`projects/comments/${id(commentId)}`, 'DELETE');
  }

  /** The comment's reactions after adding the caller's `emoji`. */
  public react(
    commentId: string,
    emoji: string,
  ): Promise<readonly CommentReaction[]> {
    return this.reaction(commentId, 'react', emoji);
  }

  /** The comment's reactions after removing the caller's `emoji`. */
  public unreact(
    commentId: string,
    emoji: string,
  ): Promise<readonly CommentReaction[]> {
    return this.reaction(commentId, 'unreact', emoji);
  }

  private async reaction(
    commentId: string,
    verb: 'react' | 'unreact',
    emoji: string,
  ): Promise<readonly CommentReaction[]> {
    const { reactions } = await this.send<CommentReactions>(
      `projects/comments/${id(commentId)}/${verb}`,
      'POST',
      { emoji },
    );
    return reactions;
  }

  public setThreadResolved(
    commentId: string,
    resolved: boolean,
  ): Promise<ThreadResolution> {
    return this.send(
      `projects/comments/${id(commentId)}/${resolved ? 'resolve' : 'unresolve'}`,
      'POST',
    );
  }

  public setSubscription(
    issueId: string,
    subscribed: boolean,
  ): Promise<SubscriptionState> {
    return this.send(
      `projects/issues/${id(issueId)}/${subscribed ? 'subscribe' : 'unsubscribe'}`,
      'POST',
    );
  }

  /** The `@` list for a comment on `issueId`: every mentionable kind's candidates matching `q`. */
  public mentionCandidates(query: {
    readonly issueId?: string;
    readonly q?: string;
    readonly limit?: number;
  }): Promise<MentionCandidate[]> {
    const { limit, ...filters } = query;
    return this.get(
      'projects/mentionCandidates',
      present({ ...filters, pageSize: limit }),
    );
  }

  // Attachments

  /** Uploads one file of the caller's, attached to nothing yet (to be sent with a comment). */
  public uploadAttachment(
    file: File,
    signal?: AbortSignal,
  ): Promise<Attachment> {
    return this.upload('projects/attachments', file, signal);
  }

  /** Uploads one file straight onto the issue. */
  public uploadIssueAttachment(
    issueId: string,
    file: File,
    signal?: AbortSignal,
  ): Promise<Attachment> {
    return this.upload(
      `projects/issues/${id(issueId)}/attachments`,
      file,
      signal,
    );
  }

  public issueAttachments(issueId: string): Promise<Attachment[]> {
    return this.get(`projects/issues/${id(issueId)}/attachments`);
  }

  public removeAttachment(attachmentId: string): Promise<void> {
    return this.send(`projects/attachments/${id(attachmentId)}`, 'DELETE');
  }

  private async upload<T>(
    path: string,
    file: File,
    signal?: AbortSignal,
  ): Promise<T> {
    const body = new FormData();
    body.append('file', file);
    const { data } = await this.api.request<{ readonly data: T }>({
      path,
      method: 'POST',
      body,
      ...(signal ? { signal } : {}),
    });
    return data;
  }

  private async page<T>(path: string, query: Query): Promise<Page<T>> {
    const { data, meta } = await this.api.request<CursorList<T>>({
      path,
      query,
    });
    return { data, nextCursor: meta?.nextPageToken ?? null };
  }

  private async get<T>(path: string, query?: Query): Promise<T> {
    const { data } = await this.api.request<{ readonly data: T }>({
      path,
      ...(query ? { query } : {}),
    });
    return data;
  }

  private async send<T = void>(
    path: string,
    method: Method,
    json?: unknown,
  ): Promise<T> {
    const body = await this.api.request<{ readonly data: T } | undefined>({
      path,
      method,
      ...(json === undefined ? {} : { json }),
    });
    return body?.data as T;
  }
}
