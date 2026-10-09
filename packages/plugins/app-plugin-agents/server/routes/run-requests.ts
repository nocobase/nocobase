/**
 * Run requests, mounted at `/api/agents`: work someone asked of an agent on a subject another person answers for,
 * waiting for that person (`shared/runs.ts`, `core/runs/run-requests.ts`). For people only, by their session or an
 * unscoped API key: a run's token or a scoped key never settles a request, because confirming one makes a run act as
 * the person who confirms.
 *
 * - The caller sees the requests they answer for or asked, and no other: an administrator or a manager of agents
 *   included, since a request holds someone's words for one person.
 * - Only the responsible confirms or rejects; only the person who asked withdraws or runs it as themselves.
 * - A request that is not pending answers `RUN_REQUEST_SETTLED`.
 */
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  listResponse,
  type ApiResponseObject,
} from '@nocobase/app-server/router';
import type { Context, Hono, MiddlewareHandler } from 'hono';
import { z } from 'zod';

import type { RunRequestItem } from '../../shared/runs.js';
import type { Agents } from '../composition.js';
import { forbidden, notFound } from '../kernel/errors.js';
import {
  decodePageToken,
  domainRouter,
  encodePageToken,
} from '../kernel/http.js';
import type { AdminEnv } from './admin.js';
import { tags } from './openapi.js';
import {
  PageTokenMetaSchema,
  RunRequestItemSchema,
  RunRequestListQuery,
  RunRequestOutcomeSchema,
  RunRequestParams,
  RunRequestRejectInput,
  RunRequestSchema,
} from './schemas.js';

const RequestPosition = z.object({ createdAt: z.string(), id: z.string() });

/** Who the caller has to be for an action on a request. */
type Party = 'responsible' | 'requester';

const noRequest: ApiResponseObject = apiErrorResponse(
  404,
  'The run request does not exist, or the caller neither answers for it nor asked it.',
);
const settledError = (also = ''): ApiResponseObject =>
  apiErrorResponse(
    400,
    `The request is not pending any more (\`RUN_REQUEST_SETTLED\`, \`metadata.status\` its status)${also}.`,
  );

/** `guard` authenticates a person (no run token, no scoped key) and sets `caller`. */
export function createRunRequestRoutes(
  services: Agents,
  guard: MiddlewareHandler<AdminEnv>,
): Hono<AdminEnv> {
  const router = domainRouter<AdminEnv>();
  const requests = services.runs.requests;

  /** The request of the path, if the caller answers for it or asked it (404 otherwise, as if it did not exist). */
  const visible = async (
    context: Context<AdminEnv>,
  ): Promise<RunRequestItem> => {
    const userId = context.get('caller').userId;
    const request = await requests.get(context.req.param('requestId') ?? '');
    if (
      request.responsibleUserId !== userId &&
      request.requestedByUserId !== userId
    )
      throw notFound('Run request');
    return request;
  };

  /** Only the party who may act on the request goes on: 404 when the caller is in it neither way, 403 when not as `party`. */
  const party =
    (who: Party): MiddlewareHandler<AdminEnv> =>
    async (context, next) => {
      const request = await visible(context);
      const userId = context.get('caller').userId;
      if (who === 'responsible' && request.responsibleUserId !== userId)
        throw forbidden(
          'Only the person who answers for the subject may confirm or reject this request.',
        );
      if (who === 'requester' && request.requestedByUserId !== userId)
        throw forbidden(
          'Only the person who asked may withdraw this request or run it as themselves.',
        );
      await next();
    };

  const requestParam = apiValidator('param', RunRequestParams);

  router.get(
    '/runRequests',
    guard,
    describeRoute({
      tags,
      summary: 'List run requests',
      operationId: 'agentsListRunRequests',
      description:
        'The run requests the caller answers for or asked, newest first, a page at a time: an inbox of work waiting for the caller to confirm (`role=responsible&status=pending`), or of what the caller asked of others.',
      ...cliRoute({
        command: 'run request list',
        flags: {
          subjectId: { name: 'subject' },
          agentId: { name: 'agent' },
          pageSize: { name: 'limit' },
        },
        columns: [
          'id',
          'agentName',
          'subject.kind',
          'subject.id',
          'requestedByName',
          'responsibleName',
          'status',
          'createdAt',
        ],
        examples: [
          'run request list --role responsible --status pending',
          'run request list --role requester',
        ],
      }),
      responses: {
        200: listResponse(RunRequestItemSchema, PageTokenMetaSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', RunRequestListQuery),
    async (context) => {
      const query = context.req.valid('query');
      const found = await requests.list({
        userId: context.get('caller').userId,
        ...(query.role ? { role: query.role } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.subjectKind
          ? {
              subject: {
                kind: query.subjectKind,
                ...(query.subjectId ? { id: query.subjectId } : {}),
              },
            }
          : {}),
        ...(query.agentId ? { agentId: query.agentId } : {}),
        limit: query.pageSize + 1,
        ...(query.pageToken === undefined
          ? {}
          : { cursor: decodePageToken(query.pageToken, RequestPosition) }),
      });
      const page = found.slice(0, query.pageSize);
      const last = page.at(-1);
      return context.json({
        data: page,
        meta:
          found.length > query.pageSize && last
            ? {
                nextPageToken: encodePageToken({
                  createdAt: last.createdAt,
                  id: last.id,
                }),
              }
            : {},
      });
    },
  );

  router.get(
    '/runRequests/:requestId',
    guard,
    describeRoute({
      tags,
      summary: 'Get a run request',
      operationId: 'agentsGetRunRequest',
      description:
        'With the input as it was asked, in full: what confirming it runs. For the person who answers for it and the person who asked it.',
      ...cliRoute({
        command: 'run request get',
        args: ['requestId'],
        flags: { requestId: { name: 'request' } },
      }),
      responses: {
        200: dataResponse(RunRequestItemSchema),
        404: noRequest,
        ...apiErrorResponses,
      },
    }),
    requestParam,
    async (context) => context.json({ data: await visible(context) }),
  );

  router.post(
    '/runRequests/:requestId/confirm',
    guard,
    party('responsible'),
    describeRoute({
      tags,
      summary: 'Confirm a run request',
      operationId: 'agentsConfirmRunRequest',
      description:
        "Runs the work as the request's responsible, who must still be able to wake the agent. When the subject binds a current responsible resolver, it is rechecked; otherwise the application must reassign requests when responsibility changes. Administrators and agent managers cannot confirm for them. The original input joins only a run acting as the caller.",
      ...cliRoute({
        command: 'run request confirm',
        args: ['requestId'],
        flags: { requestId: { name: 'request' } },
        confirm: 'Run this request as you?',
      }),
      responses: {
        200: dataResponse(RunRequestOutcomeSchema),
        400: settledError(', or the agent is archived (`AGENT_ARCHIVED`)'),
        403: apiErrorResponse(
          403,
          'The caller does not answer for the subject, or may no longer wake the agent (`FORBIDDEN`).',
        ),
        404: noRequest,
        409: apiErrorResponse(
          409,
          'The request changed concurrently; read it again.',
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    requestParam,
    async (context) =>
      context.json({
        data: await requests.confirm(
          context.req.valid('param').requestId,
          context.get('caller').userId,
        ),
      }),
  );

  router.post(
    '/runRequests/:requestId/reject',
    guard,
    party('responsible'),
    describeRoute({
      tags,
      summary: 'Reject a run request',
      operationId: 'agentsRejectRunRequest',
      description:
        "Declines the work; only the request's responsible may. The subject's current responsible resolver is rechecked when bound; otherwise the application must reassign requests on responsibility changes. The person who asked may run it as themselves by asking again.",
      ...cliRoute({
        command: 'run request reject',
        args: ['requestId'],
        flags: { requestId: { name: 'request' } },
      }),
      responses: {
        200: dataResponse(RunRequestSchema),
        400: settledError(),
        409: apiErrorResponse(
          409,
          'The request changed concurrently; read it again.',
        ),
        404: noRequest,
        ...apiErrorResponses,
      },
    }),
    requestParam,
    apiValidator('json', RunRequestRejectInput),
    async (context) => {
      const { note } = context.req.valid('json');
      return context.json({
        data: await requests.reject(
          context.req.valid('param').requestId,
          context.get('caller').userId,
          note,
        ),
      });
    },
  );

  router.post(
    '/runRequests/:requestId/withdraw',
    guard,
    party('requester'),
    describeRoute({
      tags,
      summary: 'Withdraw a run request',
      operationId: 'agentsWithdrawRunRequest',
      description: 'Takes the request back; only the person who asked may.',
      ...cliRoute({
        command: 'run request withdraw',
        args: ['requestId'],
        flags: { requestId: { name: 'request' } },
      }),
      responses: {
        200: dataResponse(RunRequestSchema),
        400: settledError(),
        409: apiErrorResponse(
          409,
          'The request changed concurrently; read it again.',
        ),
        404: noRequest,
        ...apiErrorResponses,
      },
    }),
    requestParam,
    async (context) =>
      context.json({
        data: await requests.withdraw(
          context.req.valid('param').requestId,
          context.get('caller').userId,
        ),
      }),
  );

  router.post(
    '/runRequests/:requestId/runAsMe',
    guard,
    party('requester'),
    describeRoute({
      tags,
      summary: 'Run a run request as the caller',
      operationId: 'agentsRunRunRequestAsMe',
      description:
        'The person who asked runs the work as themselves now, without waiting for confirmation: on their own runner or a team runner, never on the runners of the person who answers for the subject. A pending request is withdrawn; an expired one that went nowhere may be run this way once. Refused with `NO_RUNNER_AVAILABLE` when no runner the caller may use can run the agent now, so the work never waits unseen.',
      ...cliRoute({
        command: 'run request run-as-me',
        args: ['requestId'],
        flags: { requestId: { name: 'request' } },
      }),
      responses: {
        200: dataResponse(RunRequestOutcomeSchema),
        400: settledError(
          ', no runner the caller may use can run the agent (`NO_RUNNER_AVAILABLE`), or the agent is archived (`AGENT_ARCHIVED`)',
        ),
        403: apiErrorResponse(
          403,
          'The caller did not ask it, or may not wake the agent (`FORBIDDEN`).',
        ),
        404: noRequest,
        409: apiErrorResponse(
          409,
          'The request changed concurrently; read it again.',
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    requestParam,
    async (context) =>
      context.json({
        data: await requests.runAsRequester(
          context.req.valid('param').requestId,
          context.get('caller').userId,
        ),
      }),
  );

  return router;
}
