/**
 * The plugin's own notices (`PlannedNotice`), from the events of one transaction:
 *
 * | Event           | When                                         | Type                | To                              |
 * | --------------- | -------------------------------------------- | ------------------- | ------------------------------- |
 * | issue.created   | a person created it                          | `owner_assigned`    | the owner                       |
 * | issue.created   | a person executes it                         | `executor_assigned` | the executor                    |
 * | issue.created   | the description mentions people              | `mentioned`         | them, followers or not          |
 * | issue.updated   | the owner changed                            | `owner_assigned`    | the new owner                   |
 * | issue.updated   | a person became the executor                 | `executor_assigned` | them                            |
 * | issue.updated   | the description mentions more people         | `mentioned`         | the newly mentioned             |
 * | issue.updated   | the status changed, not by the system        | `status_changed`    | the followers                   |
 * | comment.created | a person's comment, or another kind's non-note | `mentioned`       | the people it mentions          |
 * | comment.created | the same                                     | `commented`         | the followers                   |
 * | comment.updated | the edit mentions more people                | `mentioned`         | the newly mentioned             |
 *
 * The planner (`notice.planner.ts`) then removes the actor and lets a mention beat a comment, and a decision or the
 * workflow's owner notice beat a status change.
 */
import { EXCERPT_LENGTH } from '../../../shared/comments.js';
import type { Issue } from '../../../shared/issues.js';
import { excerpt } from '../../kernel/mentions.js';
import { findComment } from '../comments/comment.store.js';
import { findIssue, type StatusCatalogs } from '../issues/index.js';
import type { NoticeRule, NoticeRuleContext, PlannedNotice } from './ports.js';

const usersIn = (
  refs: readonly { readonly kind: string; readonly id: string }[],
) => refs.filter((ref) => ref.kind === 'user').map((ref) => ref.id);

const issuePath = (identifier: string) =>
  `/issues/${encodeURIComponent(identifier)}`;
const commentPath = (identifier: string, commentId: string) =>
  `${issuePath(identifier)}?comment=${encodeURIComponent(commentId)}`;

export function builtInRules(deps: {
  readonly statuses: StatusCatalogs;
}): NoticeRule {
  return async (context: NoticeRuleContext) => {
    const { tx, events } = context;
    const notices: PlannedNotice[] = [];
    const issues = new Map<string, Issue | undefined>();
    const issueOf = async (id: string) => {
      if (!issues.has(id)) issues.set(id, await findIssue(tx.conn, id));
      return issues.get(id);
    };
    const base = async (
      issue: Issue,
      actor: { readonly type: string; readonly id: string | null },
    ) => {
      const actorName = await context.nameOf(actor.type, actor.id);
      return {
        issue: {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
        },
        actor: { ...actor, name: actorName },
        params: {
          identifier: issue.identifier,
          ...(actorName ? { actorName } : {}),
        },
      };
    };

    for (const event of events) {
      if (event.type === 'issue.created') {
        const issue = await issueOf(event.issueId);
        if (!issue) continue;
        const common = await base(issue, event.actor);
        if (event.actor.type === 'user')
          notices.push({
            ...common,
            key: `pm:owner:${issue.id}:${issue.revision}`,
            kind: 'info',
            type: 'owner_assigned',
            userIds: [issue.ownerUserId],
            slot: 'assignment',
          });
        if (issue.executor?.type === 'user')
          notices.push({
            ...common,
            key: `pm:executor:${issue.id}:${issue.revision}`,
            kind: 'info',
            type: 'executor_assigned',
            userIds: [issue.executor.id],
            slot: 'assignment',
          });
        const mentioned = usersIn(event.mentions);
        if (mentioned.length > 0)
          notices.push({
            ...common,
            key: `pm:mentioned:description:${issue.id}:${issue.revision}`,
            kind: 'info',
            type: 'mentioned',
            userIds: mentioned,
            group: `mentioned:${issue.id}`,
            slot: 'description',
            params: { ...common.params, source: 'description' },
          });
      }

      if (event.type === 'issue.updated') {
        const issue = await issueOf(event.issueId);
        if (!issue) continue;
        const common = await base(issue, event.actor);
        const { changes } = event;
        if (changes.owner) {
          const fromName = await context.nameOf('user', changes.owner.from);
          notices.push({
            ...common,
            key: `pm:owner:${issue.id}:${event.revision}`,
            kind: 'info',
            type: 'owner_assigned',
            userIds: [changes.owner.to],
            slot: 'assignment',
            params: {
              ...common.params,
              from: changes.owner.from,
              ...(fromName ? { fromName } : {}),
            },
          });
        }
        if (changes.executor?.to?.type === 'user')
          notices.push({
            ...common,
            key: `pm:executor:${issue.id}:${event.revision}`,
            kind: 'info',
            type: 'executor_assigned',
            userIds: [changes.executor.to.id],
            slot: 'assignment',
          });
        const mentioned = usersIn(changes.mentions ?? []);
        if (mentioned.length > 0)
          notices.push({
            ...common,
            key: `pm:mentioned:description:${issue.id}:${event.revision}`,
            kind: 'info',
            type: 'mentioned',
            userIds: mentioned,
            group: `mentioned:${issue.id}`,
            slot: 'description',
            params: { ...common.params, source: 'description' },
          });
        if (changes.status && event.actor.type !== 'system') {
          const catalog = await deps.statuses.forProject(
            tx.conn,
            issue.projectId,
          );
          const to = changes.status.to;
          notices.push({
            ...common,
            key: `pm:status:${issue.id}:${event.revision}`,
            kind: 'info',
            type: 'status_changed',
            userIds: await context.subscribers(issue.id),
            group: `status:${issue.id}`,
            slot: 'change',
            params: {
              ...common.params,
              from: changes.status.from,
              status: to,
              statusName:
                catalog.statuses.find((status) => status.key === to)?.name ??
                to,
            },
          });
        }
      }

      if (event.type === 'comment.created') {
        if (event.actor.type !== 'user' && event.note) continue;
        const issue = await issueOf(event.issueId);
        const comment = await findComment(tx.conn, event.commentId);
        if (!issue || !comment) continue;
        const common = await base(issue, event.actor);
        const params = {
          ...common.params,
          commentId: comment.id,
          excerpt: excerpt(comment.content, EXCERPT_LENGTH),
        };
        const path = commentPath(issue.identifier, comment.id);
        const mentioned = usersIn(event.mentions);
        if (mentioned.length > 0)
          notices.push({
            ...common,
            key: `pm:mentioned:comment:${comment.id}`,
            kind: 'info',
            type: 'mentioned',
            userIds: mentioned,
            group: `mentioned:${issue.id}`,
            slot: 'comment',
            params: { ...params, source: 'comment' },
            path,
          });
        notices.push({
          ...common,
          key: `pm:commented:${comment.id}`,
          kind: 'info',
          type: 'commented',
          userIds: await context.subscribers(issue.id),
          group: `commented:${issue.id}`,
          slot: 'comment',
          params,
          path,
        });
      }

      if (event.type === 'comment.updated') {
        const mentioned = usersIn(event.mentions);
        if (mentioned.length === 0) continue;
        const issue = await issueOf(event.issueId);
        const comment = await findComment(tx.conn, event.commentId);
        if (!issue || !comment) continue;
        const common = await base(issue, event.actor);
        notices.push({
          ...common,
          key: `pm:mentioned:comment-edit:${comment.id}:${event.editedAt}`,
          kind: 'info',
          type: 'mentioned',
          userIds: mentioned,
          group: `mentioned:${issue.id}`,
          slot: 'comment',
          params: {
            ...common.params,
            source: 'comment',
            commentId: comment.id,
            excerpt: excerpt(comment.content, EXCERPT_LENGTH),
          },
          path: commentPath(issue.identifier, comment.id),
        });
      }
    }
    return notices;
  };
}

export { issuePath };
