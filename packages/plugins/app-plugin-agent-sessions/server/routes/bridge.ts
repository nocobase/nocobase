import {
  BridgeCommandSchema,
  PollRequestSchema,
  RegisterRequestSchema,
  ReplyRequestSchema,
  ReportRequestSchema,
} from '@nocobase/acp-bridge/protocol';
import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  apiErrorResponse,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';

import { signedInUser as userId } from '../errors.js';
import type { AgentSessionsService } from '../service.js';

const tags = ['AgentSessions'];
const bridgeOnly =
  "Called by the bridge on a person's computer (`<cli> acp start`), signed in as that person; it is the person's own computer that answers. The bodies are the wire protocol of `@nocobase/acp-bridge`, which a newer bridge may extend, so fields this version does not know are ignored rather than refused.";
const errors = { 401: apiErrorResponse(401), 500: apiErrorResponse(500) };
const computerNotFound = apiErrorResponse(
  404,
  'No computer with this id is yours, such as one its owner removed (`AGENT_SESSIONS_COMPUTER_NOT_FOUND`).',
);

/** The bridge's side of agent sessions, under `/agentSessions/bridge`. Not on the command line: only the bridge calls. */
export function bridgeRoutes(service: AgentSessionsService): Hono<AuthEnv> {
  const router = new Hono<AuthEnv>();

  router.post(
    '/register',
    describeRoute({
      tags,
      summary: 'Register a computer',
      operationId: 'agentSessionsRegisterComputer',
      ...cliRoute(false),
      description: `Records the computer, as a new one or as the one \`computerId\` names, with the agents it found. ${bridgeOnly}`,
      responses: {
        200: dataResponse(z.object({ computerId: z.string() })),
        ...errors,
        400: apiErrorResponse(
          400,
          'The bridge speaks another protocol version (`AGENT_SESSIONS_UPGRADE_REQUIRED`).',
        ),
      },
    }),
    apiValidator('json', RegisterRequestSchema),
    async (context) =>
      context.json({
        data: await service.register(
          userId(context),
          context.req.valid('json'),
        ),
      }),
  );

  router.post(
    '/poll',
    describeRoute({
      tags,
      summary: "Take a computer's commands",
      operationId: 'agentSessionsPoll',
      ...cliRoute(false),
      description: `Answers with the commands waiting for the computer and takes them away; with \`wait\`, waits up to 25 seconds for one. ${bridgeOnly}`,
      responses: {
        200: dataResponse(z.object({ commands: z.array(BridgeCommandSchema) })),
        ...errors,
        404: computerNotFound,
      },
    }),
    apiValidator('json', PollRequestSchema),
    async (context) =>
      context.json({
        data: await service.poll(
          userId(context),
          context.req.valid('json'),
          context.req.raw.signal,
        ),
      }),
  );

  router.post(
    '/report',
    describeRoute({
      tags,
      summary: 'Report what happened in a session',
      operationId: 'agentSessionsReport',
      ...cliRoute(false),
      description: `Appends the events to the session's transcript and keeps its state; a report already taken is ignored. \`open\` is false once the session is archived. ${bridgeOnly}`,
      responses: {
        200: dataResponse(z.object({ open: z.boolean() })),
        ...errors,
        404: apiErrorResponse(
          404,
          'The computer or the session is not yours, or the session runs elsewhere.',
        ),
      },
    }),
    apiValidator('json', ReportRequestSchema),
    async (context) =>
      context.json({
        data: await service.report(userId(context), context.req.valid('json')),
      }),
  );

  router.post(
    '/reply',
    describeRoute({
      tags,
      summary: 'Answer a command',
      operationId: 'agentSessionsReply',
      ...cliRoute(false),
      description: `The bridge's answer to a command that asks for one, such as \`listFolders\`, for the request waiting on it. ${bridgeOnly}`,
      responses: {
        204: emptyResponse('The answer was taken.'),
        ...errors,
        404: computerNotFound,
      },
    }),
    apiValidator('json', ReplyRequestSchema),
    async (context) => {
      await service.reply(userId(context), context.req.valid('json'));
      return context.body(null, 204);
    },
  );

  return router;
}
