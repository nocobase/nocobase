import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  apiErrorResponse,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';

import { signedInUser as userId, viewerOf } from '../errors.js';
import type { AgentSessionsService } from '../service.js';
import {
  AnswerInput,
  ChooseInput,
  DecideLinksInput,
  ComputerParams,
  ComputerSchema,
  CreateSessionInput,
  FolderListingSchema,
  ListEventsQuery,
  ListFoldersQuery,
  ListMentionsQuery,
  ListSessionsQuery,
  ProjectSchema,
  ReferenceSchema,
  UpdateComputerInput,
  PromptInput,
  SessionParams,
  SessionSchema,
  TranscriptEventSchema,
  UpdateSessionInput,
} from './schemas.js';

const tags = ['AgentSessions'];
// The pages' API: a person talks to a session in the browser or in their own agent, so the command line offers only
// `acp start` (`@nocobase/app-cli-client`).
const pageOnly = cliRoute(false);
const own =
  "Every signed-in person has their own computers and sessions and reaches only those; anyone else's answers 404.";
const errors = { 401: apiErrorResponse(401), 500: apiErrorResponse(500) };
const computerNotFound = apiErrorResponse(
  404,
  'No computer with this id is yours (`AGENT_SESSIONS_COMPUTER_NOT_FOUND`).',
);
const sessionNotFound = apiErrorResponse(
  404,
  'No session with this id is yours (`AGENT_SESSIONS_SESSION_NOT_FOUND`).',
);
const notWritable = apiErrorResponse(
  400,
  'The session is archived (`AGENT_SESSIONS_SESSION_ARCHIVED`), or its computer is offline (`AGENT_SESSIONS_COMPUTER_OFFLINE`).',
);

/** The signed-in person's computers and sessions, under `/agentSessions`. */
export function sessionRoutes(service: AgentSessionsService): Hono<AuthEnv> {
  const router = new Hono<AuthEnv>();

  router.get(
    '/computers',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'List your computers',
      operationId: 'agentSessionsListComputers',
      description: `The computers connected to your account with \`<cli> acp start\`, whether each is online, and the agents it can run. ${own}`,
      responses: {
        200: listResponse(
          ComputerSchema,
          z.object({ total: z.number().int() }),
        ),
        ...errors,
      },
    }),
    async (context) => {
      const data = await service.listComputers(userId(context));
      return context.json({ data, meta: { total: data.length } });
    },
  );

  router.delete(
    '/computers/:computerId',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'Remove a computer',
      operationId: 'agentSessionsRemoveComputer',
      description: `Its bridge stops at its next poll; its sessions stay, read-only. ${own}`,
      responses: {
        204: emptyResponse('The computer was removed.'),
        ...errors,
        404: apiErrorResponse(
          404,
          'No computer with this id is yours (`AGENT_SESSIONS_COMPUTER_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', ComputerParams),
    async (context) => {
      await service.removeComputer(
        userId(context),
        context.req.valid('param').computerId,
      );
      return context.body(null, 204);
    },
  );

  router.patch(
    '/computers/:computerId',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'Choose where sessions on a computer work',
      operationId: 'agentSessionsUpdateComputer',
      description: `Sets the directories sessions on the computer may work in, each under what its bridge allows (its \`roots\`, the home directory unless started with \`--root\`); null allows all of those. ${own}`,
      responses: {
        200: dataResponse(ComputerSchema),
        ...errors,
        400: apiErrorResponse(
          400,
          'A directory is outside what the bridge allows (`AGENT_SESSIONS_DIRECTORY_NOT_ALLOWED`).',
        ),
        404: computerNotFound,
      },
    }),
    apiValidator('param', ComputerParams),
    apiValidator('json', UpdateComputerInput),
    async (context) =>
      context.json({
        data: await service.updateComputer(
          userId(context),
          context.req.valid('param').computerId,
          context.req.valid('json'),
        ),
      }),
  );

  router.get(
    '/computers/:computerId/folders',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'List the folders in a directory of a computer',
      operationId: 'agentSessionsListFolders',
      description: `Asks the computer's bridge for the folders in \`path\`, for choosing where sessions work, and waits up to 10 seconds for it. ${own}`,
      responses: {
        200: dataResponse(FolderListingSchema),
        ...errors,
        400: apiErrorResponse(
          400,
          'The computer is offline (`AGENT_SESSIONS_COMPUTER_OFFLINE`), the directory is outside what its bridge allows (`AGENT_SESSIONS_DIRECTORY_NOT_ALLOWED`), or it cannot be opened (`AGENT_SESSIONS_FOLDER_UNAVAILABLE`).',
        ),
        404: computerNotFound,
        504: apiErrorResponse(
          504,
          'The computer did not answer in time (`AGENT_SESSIONS_COMPUTER_NOT_ANSWERING`).',
        ),
      },
    }),
    apiValidator('param', ComputerParams),
    apiValidator('query', ListFoldersQuery),
    async (context) =>
      context.json({
        data: await service.listFolders(
          userId(context),
          context.req.valid('param').computerId,
          context.req.valid('query').path,
        ),
      }),
  );

  router.get(
    '/projects',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'List the projects a session may work for',
      operationId: 'agentSessionsListProjects',
      description:
        "The application's projects you may see, for a new session to work for; empty when the application has no projects.",
      responses: {
        200: listResponse(ProjectSchema, z.object({ total: z.number().int() })),
        ...errors,
      },
    }),
    async (context) => {
      const data = await service.listProjects(viewerOf(context));
      return context.json({ data, meta: { total: data.length } });
    },
  );

  router.get(
    '/mentions',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'Find what a message can mention',
      operationId: 'agentSessionsSearchMentions',
      description:
        'The records you may mention in a message with `#`, such as issues, whose key or title contains `q`; those of `projectId` first.',
      responses: {
        200: listResponse(ReferenceSchema),
        ...errors,
      },
    }),
    apiValidator('query', ListMentionsQuery),
    async (context) => {
      const { q, projectId } = context.req.valid('query');
      return context.json({
        data: await service.searchMentions(
          viewerOf(context),
          q,
          projectId ?? null,
        ),
        meta: {},
      });
    },
  );

  router.get(
    '/sessions',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'List your sessions',
      operationId: 'agentSessionsListSessions',
      description: `Your sessions, the most recently active first; \`archived=true\` lists the archived ones. Pages by \`pageToken\`. ${own}`,
      responses: {
        200: listResponse(SessionSchema),
        ...errors,
        400: apiErrorResponse(
          400,
          'The `pageToken` was not issued by this list (`AGENT_SESSIONS_INVALID_PAGE_TOKEN`).',
        ),
      },
    }),
    apiValidator('query', ListSessionsQuery),
    async (context) => {
      const query = context.req.valid('query');
      const page = await service.listSessions(viewerOf(context), {
        ...query,
        archived: query.archived === 'true',
      });
      return context.json({
        data: page.sessions,
        meta: page.nextPageToken ? { nextPageToken: page.nextPageToken } : {},
      });
    },
  );

  router.post(
    '/sessions',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'Start a session',
      operationId: 'agentSessionsCreateSession',
      description: `Starts a conversation with an agent on one of your online computers, in a directory its bridge allows, with a first message. ${own}`,
      responses: {
        201: dataResponse(
          SessionSchema,
          'The session, its first message sent.',
        ),
        ...errors,
        400: apiErrorResponse(
          400,
          'The computer is offline (`AGENT_SESSIONS_COMPUTER_OFFLINE`) or not yours (`AGENT_SESSIONS_COMPUTER_NOT_FOUND`), cannot run the agent (`AGENT_SESSIONS_AGENT_UNAVAILABLE`), or does not allow the directory (`AGENT_SESSIONS_DIRECTORY_NOT_ALLOWED`).',
        ),
      },
    }),
    apiValidator('json', CreateSessionInput),
    async (context) =>
      context.json(
        {
          data: await service.createSession(
            viewerOf(context),
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );

  router.get(
    '/sessions/:sessionId',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'Get a session',
      operationId: 'agentSessionsGetSession',
      description: own,
      responses: {
        200: dataResponse(SessionSchema),
        ...errors,
        404: sessionNotFound,
      },
    }),
    apiValidator('param', SessionParams),
    async (context) =>
      context.json({
        data: await service.getSession(
          viewerOf(context),
          context.req.valid('param').sessionId,
        ),
      }),
  );

  router.patch(
    '/sessions/:sessionId',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'Rename or archive a session',
      operationId: 'agentSessionsUpdateSession',
      description: `Archiving stops the session's agent on its computer; restoring makes it writable again. ${own}`,
      responses: {
        200: dataResponse(SessionSchema),
        ...errors,
        404: sessionNotFound,
      },
    }),
    apiValidator('param', SessionParams),
    apiValidator('json', UpdateSessionInput),
    async (context) =>
      context.json({
        data: await service.updateSession(
          viewerOf(context),
          context.req.valid('param').sessionId,
          context.req.valid('json'),
        ),
      }),
  );

  router.get(
    '/sessions/:sessionId/events',
    describeRoute({
      tags,
      ...pageOnly,
      summary: "Read a session's transcript",
      operationId: 'agentSessionsListEvents',
      description: `The events after \`after\`, oldest first; \`meta.hasMore\` says another page follows. ${own}`,
      responses: {
        200: listResponse(
          TranscriptEventSchema,
          z.object({ hasMore: z.boolean() }),
        ),
        ...errors,
        404: sessionNotFound,
      },
    }),
    apiValidator('param', SessionParams),
    apiValidator('query', ListEventsQuery),
    async (context) => {
      const { after, pageSize } = context.req.valid('query');
      const events = await service.listEvents(
        userId(context),
        context.req.valid('param').sessionId,
        {
          after,
          limit: pageSize + 1,
        },
      );
      return context.json({
        data: events.slice(0, pageSize),
        meta: { hasMore: events.length > pageSize },
      });
    },
  );

  router.post(
    '/sessions/:sessionId/prompt',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'Send a message to a session',
      operationId: 'agentSessionsPrompt',
      description: `The agent answers it after the turn it is in, if any. ${own}`,
      responses: {
        200: dataResponse(
          TranscriptEventSchema,
          'The message as it entered the transcript.',
        ),
        ...errors,
        400: notWritable,
        404: sessionNotFound,
      },
    }),
    apiValidator('param', SessionParams),
    apiValidator('json', PromptInput),
    async (context) =>
      context.json({
        data: await service.prompt(
          viewerOf(context),
          context.req.valid('param').sessionId,
          context.req.valid('json').content,
          context.req.valid('json').mentions,
        ),
      }),
  );

  router.post(
    '/sessions/:sessionId/cancel',
    describeRoute({
      tags,
      ...pageOnly,
      summary: "Stop a session's turn",
      operationId: 'agentSessionsCancel',
      description: `Stops the running turn and drops the messages waiting behind it. ${own}`,
      responses: {
        204: emptyResponse('Sent to the computer.'),
        ...errors,
        400: notWritable,
        404: sessionNotFound,
      },
    }),
    apiValidator('param', SessionParams),
    async (context) => {
      await service.cancel(
        userId(context),
        context.req.valid('param').sessionId,
      );
      return context.body(null, 204);
    },
  );

  router.post(
    '/sessions/:sessionId/answer',
    describeRoute({
      tags,
      ...pageOnly,
      summary: "Answer an agent's permission request",
      operationId: 'agentSessionsAnswer',
      description: `Allows or declines the tool call the agent asked about, with one of the options it offered. ${own}`,
      responses: {
        204: emptyResponse('Sent to the computer.'),
        ...errors,
        400: notWritable,
        404: apiErrorResponse(
          404,
          'No session with this id is yours, or the request no longer waits (`AGENT_SESSIONS_PERMISSION_REQUEST_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', SessionParams),
    apiValidator('json', AnswerInput),
    async (context) => {
      await service.answer(
        userId(context),
        context.req.valid('param').sessionId,
        context.req.valid('json'),
      );
      return context.body(null, 204);
    },
  );

  router.post(
    '/sessions/:sessionId/choose',
    describeRoute({
      tags,
      ...pageOnly,
      summary: "Change one of a session's choices",
      operationId: 'agentSessionsChoose',
      description: `Changes the mode, model, reasoning effort or another choice the agent offers, and keeps it for when the session reopens. ${own}`,
      responses: {
        200: dataResponse(SessionSchema),
        ...errors,
        400: apiErrorResponse(
          400,
          'The agent offers no such choice or value (`AGENT_SESSIONS_CHOICE_NOT_FOUND`), or the session cannot take it now.',
        ),
        404: sessionNotFound,
      },
    }),
    apiValidator('param', SessionParams),
    apiValidator('json', ChooseInput),
    async (context) =>
      context.json({
        data: await service.choose(
          viewerOf(context),
          context.req.valid('param').sessionId,
          context.req.valid('json'),
        ),
      }),
  );

  router.post(
    '/sessions/:sessionId/links/decide',
    describeRoute({
      tags,
      ...pageOnly,
      summary: 'Start or skip the work tied to a session',
      operationId: 'agentSessionsDecideLinks',
      description: `Starts the work on the records in \`start\`, as the application starts it, and leaves those in \`skip\`; the session stops asking about both. ${own}`,
      responses: {
        200: dataResponse(SessionSchema),
        ...errors,
        400: apiErrorResponse(
          400,
          'A record is not tied to the session, or its work cannot start from it (`AGENT_SESSIONS_LINK_NOT_FOUND`).',
        ),
        404: sessionNotFound,
      },
    }),
    apiValidator('param', SessionParams),
    apiValidator('json', DecideLinksInput),
    async (context) =>
      context.json({
        data: await service.decideLinks(
          viewerOf(context),
          context.req.valid('param').sessionId,
          context.req.valid('json'),
        ),
      }),
  );

  return router;
}
