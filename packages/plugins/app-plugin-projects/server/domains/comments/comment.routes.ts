import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { DatabaseConnection } from '@nocobase/db';
import type { Hono } from 'hono';

import { ATTACHMENT_SIZE_MAX } from '../../../shared/attachments.js';
import {
  delegatedWrite,
  viewerOf,
  type ViewerEnv,
} from '../../access/request.js';
import {
  cursorList,
  domainRouter,
  referencedBy,
  tags,
  personOrRunSecurity,
} from '../../kernel/http.js';
import {
  CommentParams,
  CommentReactionsSchema,
  CommentThreadSchema,
  CreateCommentBody,
  CreateCommentResultSchema,
  CursorListMeta,
  CursorPageQuery,
  EmptyListMeta,
  IssueCommentSchema,
  IssueParams,
  MentionCandidateSchema,
  MentionCandidatesQuery,
  ReactionBody,
  ThreadResolutionSchema,
  UpdateCommentBody,
} from '../../routes/schemas.js';
import type { CommentQueries } from './comment.queries.js';
import type { CommentService } from './comment.service.js';

const notFound = apiErrorResponse(404);

/**
 * Under `/api/projects/issues`: `GET /{issueId}/comments?pageToken&pageSize` (a page of threads) and
 * `POST /{issueId}/comments`, answering `{ comment, triggered }`.
 */
export function createIssueCommentRoutes(deps: {
  readonly comments: CommentService;
  readonly queries: CommentQueries;
  /** A connection to read with, for answering a comment a delegated write made. */
  readonly read: () => DatabaseConnection;
}): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/:issueId/comments',
    describeRoute({
      tags,
      summary: 'List an issue’s comment threads',
      operationId: 'projectsListIssueComments',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue comment list',
        flags: { issueId: { name: 'issue' }, pageSize: { name: 'limit' } },
        columns: [
          'root.id',
          'root.authorName',
          'root.createdAt',
          'root.content',
          'replies.length',
        ],
        action: 'pm.issues/view',
      }),
      description:
        'A page of threads, the newest page first and each page oldest first; a thread is a root and all its replies. `issueId` is an id or an identifier.',
      responses: {
        200: listResponse(CommentThreadSchema, CursorListMeta),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', IssueParams),
    apiValidator('query', CursorPageQuery),
    async (context) =>
      context.json(
        cursorList(
          await deps.queries.threads(
            viewerOf(context),
            context.req.valid('param').issueId,
            context.req.valid('query'),
          ),
        ),
      ),
  );
  routes.post(
    '/:issueId/comments',
    describeRoute({
      tags,
      summary: 'Comment on an issue',
      operationId: 'projectsCreateIssueComment',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue comment add',
        flags: {
          issueId: { name: 'issue' },
          content: {
            contentFile: true,
            description:
              'The comment, in Markdown. Write anything longer than a line to a file and pass it with --content-file.',
          },
          parentId: {
            name: 'reply-to',
            description: 'The id of the comment this answers.',
          },
        },
        uploads: {
          attach: {
            upload: 'projectsUploadAttachment',
            field: 'attachmentIds',
            multiple: true,
            maxBytes: ATTACHMENT_SIZE_MAX,
            description: `A file to attach (repeatable); attaching needs \`upload\` on \`pm.attachments\`.`,
          },
        },
        action: 'pm.issues/comment',
        examples: [
          'issue comment add PM-12 --content-file note.md --attach screenshot.png',
        ],
      }),
      description:
        'Needs `comment` on the issue, and `upload` on `pm.attachments` to send `attachmentIds` (the caller’s uploads attached to nothing). Markdown, with mentions as `[@Name](mention://<kind>/<id>)`; a comment starting with `/note` starts no work.',
      responses: {
        201: dataResponse(CreateCommentResultSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'When an attachment is not an upload of the caller’s attached to nothing (`INVALID_ATTACHMENT`).',
        ),
        404: notFound,
      },
    }),
    apiValidator('param', IssueParams),
    apiValidator('json', CreateCommentBody),
    async (context) => {
      const { issueId } = context.req.valid('param');
      const input = context.req.valid('json');
      const delegated = await delegatedWrite(context, {
        title: `Comment on ${issueId}`,
        rows: [{ op: 'comment.create', params: { issue: issueId, ...input } }],
      });
      if (delegated) {
        const created = delegated.plan.rows[0]?.result?.created?.id;
        const issue = delegated.plan.rows[0]?.result?.target?.id;
        const comment =
          created && issue
            ? (await deps.queries.list(deps.read(), issue)).find(
                (candidate) => candidate.id === created,
              )
            : undefined;
        return context.json(
          {
            data: { comment: comment ?? null, triggered: [] },
            meta: delegated.meta,
          },
          201,
        );
      }
      const { comment, triggered } = await deps.comments.create(
        viewerOf(context),
        issueId,
        input,
      );
      return context.json({ data: { comment, triggered } }, 201);
    },
  );
  return routes;
}

/**
 * Under `/api/projects/comments`: `PATCH /{commentId}`, `DELETE /{commentId}`, `POST /{commentId}/react` and
 * `/unreact` with `{ emoji }` (answering `{ reactions }`), and `POST /{commentId}/resolve` and `/unresolve`.
 */
export function createCommentRoutes(comments: CommentService): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.patch(
    '/:commentId',
    describeRoute({
      tags,
      summary: 'Edit a comment',
      operationId: 'projectsUpdateComment',
      ...cliRoute({
        command: 'comment update',
        flags: {
          commentId: { name: 'comment' },
          content: { contentFile: true },
        },
        examples: ['comment update <comment> --content-file note.md'],
      }),
      description: 'By its author.',
      responses: {
        200: dataResponse(IssueCommentSchema),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', CommentParams),
    apiValidator('json', UpdateCommentBody),
    async (context) =>
      context.json({
        data: await comments.update(
          viewerOf(context),
          context.req.valid('param').commentId,
          context.req.valid('json'),
        ),
      }),
  );
  routes.delete(
    '/:commentId',
    describeRoute({
      tags,
      summary: 'Delete a comment',
      operationId: 'projectsDeleteComment',
      ...cliRoute({
        command: 'comment delete',
        flags: { commentId: { name: 'comment' } },
        confirm: 'Delete this comment and its files?',
      }),
      description:
        'By its author, or by whoever may moderate comments on the issue. Its files go with it.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', CommentParams),
    async (context) => {
      await comments.remove(
        viewerOf(context),
        context.req.valid('param').commentId,
      );
      return context.body(null, 204);
    },
  );
  for (const verb of ['react', 'unreact'] as const)
    routes.post(
      `/:commentId/${verb}`,
      describeRoute({
        tags,
        summary:
          verb === 'react'
            ? 'React to a comment'
            : 'Remove a reaction from a comment',
        operationId:
          verb === 'react' ? 'projectsReactComment' : 'projectsUnreactComment',
        ...cliRoute({
          command: `comment ${verb}`,
          args: ['commentId', 'emoji'],
          flags: { commentId: { name: 'comment' } },
          ...(verb === 'react'
            ? { examples: ['comment react <comment> 👍'] }
            : {}),
        }),
        description: 'Answers the comment’s reactions after the change.',
        responses: {
          200: dataResponse(CommentReactionsSchema),
          ...apiErrorResponses,
          404: notFound,
        },
      }),
      apiValidator('param', CommentParams),
      apiValidator('json', ReactionBody),
      async (context) =>
        context.json({
          data: {
            reactions: await comments[verb](
              viewerOf(context),
              context.req.valid('param').commentId,
              context.req.valid('json').emoji,
            ),
          },
        }),
    );
  for (const [verb, resolved] of [
    ['resolve', true],
    ['unresolve', false],
  ] as const)
    routes.post(
      `/:commentId/${verb}`,
      describeRoute({
        tags,
        summary: resolved
          ? 'Resolve a comment thread'
          : 'Reopen a resolved comment thread',
        operationId: resolved
          ? 'projectsResolveComment'
          : 'projectsUnresolveComment',
        ...cliRoute({
          command: `comment ${verb}`,
          flags: { commentId: { name: 'comment' } },
        }),
        description:
          'On a thread’s root comment; needs `comment` on the issue.',
        responses: {
          200: dataResponse(ThreadResolutionSchema),
          ...apiErrorResponses,
          404: notFound,
        },
      }),
      apiValidator('param', CommentParams),
      async (context) =>
        context.json({
          data: await comments.resolve(
            viewerOf(context),
            context.req.valid('param').commentId,
            resolved,
          ),
        }),
    );
  return routes;
}

/** `GET /api/projects/mentionCandidates?q&issueId&pageSize`: the `@` list, one short page. */
export function createMentionRoutes(queries: CommentQueries): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/mentionCandidates',
    describeRoute({
      tags,
      summary: 'List mention candidates',
      operationId: 'projectsListMentionCandidates',
      // The editor's `@` picker.
      ...cliRoute(false),
      description:
        'One short page of who and what may be mentioned in text about `issueId`, or about no issue yet, matching `q`. An `issueId` that names no issue the caller sees is a 400 naming the field.',
      responses: {
        200: listResponse(MentionCandidateSchema, EmptyListMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', MentionCandidatesQuery),
    async (context) =>
      context.json({
        data: await referencedBy('issueId', () =>
          queries.mentionCandidates(
            viewerOf(context),
            context.req.valid('query'),
          ),
        ),
        meta: {},
      }),
  );
  return routes;
}
