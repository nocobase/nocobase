/**
 * The run endpoints (`RUN_ROUTES`), mounted at `/api/agents`: what the agent's CLI asks about its own run
 * (`/runs/current`), and the title a run on a conversation gives it, authenticated by the run token header.
 */
import {
  HEADERS,
  ProtocolError,
  RunSelfSchema,
} from '@nocobase/agent-protocol';
import {
  apiErrorResponse,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Hono, MiddlewareHandler } from 'hono';
import { z } from 'zod';

import { CONVERSATION_TITLE_AGENT_MAX } from '../../shared/conversations.js';

import type { Agents } from '../composition.js';
import type { RunTokenIdentity } from '../core/runs/index.js';
import { RUN_SELF_ACTION } from '../core/callers/index.js';
import { domainRouter } from '../kernel/http.js';
import { runTokenSecurity, tags } from './openapi.js';
import { RunContextSchema } from './schemas.js';

const ConversationTitleInput = z.strictObject({
  title: z
    .string()
    .min(1)
    .max(CONVERSATION_TITLE_AGENT_MAX)
    .meta({ description: 'The title, at most 40 characters.' }),
});

const RunConversationSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
});

export interface RunEnv {
  Variables: { run: RunTokenIdentity };
}

export function createRunRoutes(services: Agents): Hono<RunEnv> {
  const router = domainRouter<RunEnv>();
  const runToken: MiddlewareHandler<RunEnv> = async (context, next) => {
    context.set(
      'run',
      await services.runs.authenticateToken(
        context.req.header(HEADERS.runToken) ?? '',
      ),
    );
    await next();
  };
  const runTokenErrors = {
    401: apiErrorResponse(
      401,
      'No run token, or one that is unknown or whose run no runner holds (`RUN_TOKEN_INVALID`).',
    ),
    500: apiErrorResponse(500),
  };
  router.get(
    '/runs/current',
    runToken,
    describeRoute({
      tags,
      summary: 'Get the run the token belongs to',
      operationId: 'agentsGetCurrentRun',
      description:
        "What the agent's CLI asks about its own run: the run, its agent, subject and the person who woke it.",
      security: runTokenSecurity,
      responses: { 200: dataResponse(RunSelfSchema), ...runTokenErrors },
      ...cliRoute({ command: 'run self', action: RUN_SELF_ACTION }),
    }),
    async (context) =>
      context.json({ data: await services.runs.self(context.get('run')) }),
  );
  router.get(
    '/runs/current/context',
    runToken,
    describeRoute({
      tags,
      summary: "Get the context of the token's run",
      operationId: 'agentsGetCurrentRunContext',
      description:
        "The context the run's subject assembles for it now; its fields depend on the subject kind.",
      security: runTokenSecurity,
      responses: {
        200: dataResponse(RunContextSchema),
        404: apiErrorResponse(
          404,
          'The subject has no context to give (`RUN_CONTEXT_NOT_FOUND`).',
        ),
        ...runTokenErrors,
      },
      ...cliRoute({ command: 'run context', action: RUN_SELF_ACTION }),
    }),
    async (context) =>
      context.json({ data: await services.runs.context(context.get('run')) }),
  );
  router.patch(
    '/runs/current/conversation',
    runToken,
    describeRoute({
      tags,
      summary: "Name the token's conversation",
      operationId: 'agentsSetCurrentRunConversationTitle',
      description:
        "A run on a conversation names it (at most 40 characters); `meta.message` says so. Refused once the conversation's owner renamed it (`CONVERSATION_CONFLICT`, `metadata.reason` `titleLocked`).",
      security: runTokenSecurity,
      responses: {
        200: dataResponse(RunConversationSchema),
        400: apiErrorResponse(
          400,
          'The run is not on a conversation (`INVALID_REQUEST`), or its owner named it (`CONVERSATION_CONFLICT`).',
        ),
        ...runTokenErrors,
      },
      ...cliRoute({
        command: 'conversation title set',
        args: ['title'],
        action: RUN_SELF_ACTION,
        examples: ['conversation title set "Tidy the login issues"'],
      }),
    }),
    apiValidator('json', ConversationTitleInput),
    async (context) => {
      const { run } = context.get('run');
      const target = {
        subject: { kind: run.subjectKind, id: run.subjectId },
        actorUserId: run.actorUserId,
      };
      if (!(await services.conversations.ofRun(services.tx.read(), target)))
        throw new ProtocolError(
          'INVALID_REQUEST',
          'Only a run on a conversation has a title to set.',
        );
      const conversation = await services.conversations.setTitleFromRun(
        target,
        context.req.valid('json').title,
      );
      return context.json({
        data: { id: conversation.id, title: conversation.title },
        meta: {
          message: `The conversation is called "${conversation.title ?? ''}" now.`,
        },
      });
    },
  );
  return router;
}
