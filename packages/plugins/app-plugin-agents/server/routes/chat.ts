/**
 * The chat API, mounted at `/api/agents` (`CHAT_ROUTES` in `shared/conversations`), and the agent presets at
 * `/api/agents/presets`. Every route is behind the guard (a signed-in person and their authorization context). A
 * conversation is its owner's alone: the service answers 404 to anyone else, whatever they may manage. Changing the
 * team's default chat agent needs `agents.agents` manage; reading presets needs `agents.agents` read.
 */
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
  type CliRouteOptions,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import type { Context, Hono, MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';

import {
  CHAT_ATTACHMENT_SIZE_MAX,
  CHAT_ATTACHMENTS_PER_MESSAGE_MAX,
  CONVERSATION_SOURCE_PATTERN,
  CONVERSATION_TITLE_MAX,
  MESSAGE_CONTENT_MAX,
  type ConversationPatch,
  type CopyAgentRequest,
  type CreateConversationRequest,
  type MessageAttachment,
  type SendMessageRequest,
  type StartConversationRequest,
} from '../../shared/conversations.js';
import type { Agents } from '../composition.js';
import {
  ChatPreferencesPatchSchema,
  ChatSettingsPatchSchema,
  PageContextSchema,
} from '../core/conversations/index.js';
import { RUN_SELF_ACTION } from '../core/callers/index.js';
import { fileTooLarge } from '../core/conversations/attachments.js';
import { forbidden, invalid } from '../kernel/errors.js';
import {
  decodePageToken,
  domainRouter,
  encodePageToken,
} from '../kernel/http.js';
import type { AdminEnv } from './admin.js';
import { personOrRunSecurity, tags } from './openapi.js';
import {
  AgentParams,
  AgentPresetSchema,
  AgentSchema,
  ChatAgentSchema,
  ChatAttachmentContentQuery,
  ChatAttachmentParams,
  ChatDefaultAgentSchema,
  ConversationDetailSchema,
  ConversationListQuerySchema,
  ConversationMessageSchema,
  ConversationParams,
  ConversationSummarySchema,
  MessageAttachmentSchema,
  MessageListQuerySchema,
  PageTokenMetaSchema,
  SendMessageResultSchema,
  SeqPageMetaSchema,
} from './schemas.js';

const noConversation = apiErrorResponse(
  404,
  "The conversation does not exist or is not the caller's (`CONVERSATION_NOT_FOUND`).",
);
const conversationConflict = (when: string) =>
  apiErrorResponse(400, `${when} (\`CONVERSATION_CONFLICT\`).`);

const MessagePosition = z.object({ before: z.number().int().min(1) });

const CreateSchema: z.ZodType<CreateConversationRequest> = z.strictObject({
  agentId: z.string().min(1).max(64).optional(),
  title: z
    .string()
    .max(CONVERSATION_TITLE_MAX * 2)
    .optional(),
  source: z.string().regex(CONVERSATION_SOURCE_PATTERN).optional(),
  model: z
    .strictObject({
      modelService: z.string().min(1).max(100),
      model: z.string().min(1).max(200),
    })
    .nullable()
    .optional()
    .meta({
      description:
        "An online agent: the entry of its list (`ChatAgent.models`) to answer with; the agent's default when left out.",
    }),
});

const PatchSchema: z.ZodType<ConversationPatch> = z.strictObject({
  title: z
    .string()
    .max(CONVERSATION_TITLE_MAX * 2)
    .optional(),
  archived: z.boolean().optional(),
  model: z
    .strictObject({
      modelService: z.string().min(1).max(100),
      model: z.string().min(1).max(200),
    })
    .nullable()
    .optional(),
});

const SendSchema: z.ZodType<SendMessageRequest> = z.strictObject({
  content: z
    .string()
    .max(MESSAGE_CONTENT_MAX * 2)
    .meta({
      description: 'Markdown; empty only when files are sent.',
    }),
  context: PageContextSchema.optional(),
  clientId: z.string().min(1).max(100).optional(),
  attachmentIds: z
    .array(z.string().min(1).max(64))
    .max(CHAT_ATTACHMENTS_PER_MESSAGE_MAX)
    .optional()
    .meta({
      description: `The caller's uploads not sent yet (\`POST /api/agents/chatAttachments\`), at most ${CHAT_ATTACHMENTS_PER_MESSAGE_MAX}, sent with the message in this order.`,
    }),
});

/** A multipart body of one file, as `file`. */
const singleFileBody: OpenAPIV3_1.RequestBodyObject = {
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: ['file'],
        properties: { file: { type: 'string', format: 'binary' } },
      },
    },
  },
};

/** Room for the multipart envelope around one file. */
const ENVELOPE = 64 * 1024;

/** `filename*` per RFC 5987, so any name survives; the plain `filename` is an ASCII fallback. */
function contentDisposition(
  kind: 'inline' | 'attachment',
  filename: string,
): string {
  const ascii = filename.replace(/[^\x20-\x7e]|["\\]/gu, '_') || 'file';
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/gu,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

const MIME = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/iu;

/** The headers a file is served with: inline only for a safe image, unless a download is asked for. */
function contentHeaders(
  attachment: MessageAttachment,
  download: boolean,
): Record<string, string> {
  const inline = attachment.previewable && !download;
  const type = attachment.mimeType.split(';')[0]?.trim() ?? '';
  return {
    'Content-Type': MIME.test(type) ? type : 'application/octet-stream',
    'Content-Length': String(attachment.size),
    'Content-Disposition': contentDisposition(
      inline ? 'inline' : 'attachment',
      attachment.filename,
    ),
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "sandbox; default-src 'none'",
    'Cache-Control': 'private, no-store',
  };
}

const noAttachment = apiErrorResponse(
  404,
  'The file does not exist, or the caller may not read it (`NOT_FOUND`).',
);

const StartSchema: z.ZodType<StartConversationRequest> = z.strictObject({
  source: z.string().regex(CONVERSATION_SOURCE_PATTERN),
  text: z
    .string()
    .min(1)
    .max(MESSAGE_CONTENT_MAX * 2),
  agentId: z.string().min(1).max(64).optional(),
  title: z
    .string()
    .max(CONVERSATION_TITLE_MAX * 2)
    .optional(),
  context: PageContextSchema.optional(),
  clientId: z.string().min(1).max(100).optional(),
});

const CopySchema: z.ZodType<CopyAgentRequest> = z.strictObject({
  name: z.string().max(400).optional(),
  makeDefault: z.boolean().optional(),
});

/**
 * `guard` authenticates the request and sets `caller`; the route contribution passes the real one, tests a fake.
 * `personOrRun` also takes a run token (setting `caller.run`), for reading a conversation's files; `guard` by default.
 */
export function createChatRoutes(
  services: Agents,
  guard: MiddlewareHandler<AdminEnv>,
  personOrRun: MiddlewareHandler<AdminEnv> = guard,
): Hono<AdminEnv> {
  const router = domainRouter<AdminEnv>();
  const { conversations, chat } = services;
  const me = (context: Context<AdminEnv>) => context.get('caller').userId;
  const conversationParam = apiValidator('param', ConversationParams);
  const conversationId = (context: Context<AdminEnv>): string =>
    context.req.param('conversationId') ?? '';

  router.get(
    '/conversations',
    guard,
    describeRoute({
      tags,
      summary: "List the caller's conversations",
      operationId: 'agentsListConversations',
      ...cliRoute({
        command: 'conversation list',
        flags: {
          q: { name: 'query' },
          agentId: { name: 'agent' },
          pageSize: { name: 'limit' },
        },
        columns: ['id', 'title', 'agent.name', 'lastMessageAt', 'read'],
      }),
      description:
        "The conversations the caller started, newest message first, a page at a time; a conversation is its owner's alone.",
      responses: {
        200: listResponse(ConversationSummarySchema, PageTokenMetaSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ConversationListQuerySchema),
    async (context) => {
      const query = context.req.valid('query');
      const page = await conversations.list(me(context), {
        archived: query.archived === 'all' ? 'all' : query.archived === 'true',
        ...(query.q ? { q: query.q } : {}),
        ...(query.agentId ? { agentId: query.agentId } : {}),
        ...(query.source ? { source: query.source } : {}),
        ...(query.pageToken ? { pageToken: query.pageToken } : {}),
        pageSize: query.pageSize,
      });
      return context.json({
        data: page.items,
        meta: page.nextCursor ? { nextPageToken: page.nextCursor } : {},
      });
    },
  );
  router.post(
    '/conversations',
    guard,
    describeRoute({
      tags,
      summary: 'Create a conversation',
      operationId: 'agentsCreateConversation',
      ...cliRoute({
        command: 'conversation create',
        flags: { agentId: { name: 'agent' } },
      }),
      description:
        "With the given agent, or the caller's default chat agent when none is named; for an online agent, `model` chooses one of its `models` to answer with (400, `metadata.reason` `MODEL_NOT_LISTED`, for any other).",
      responses: {
        201: dataResponse(ConversationDetailSchema, 'Created.'),
        400: conversationConflict('No chat agent is available'),
        404: apiErrorResponse(
          404,
          'The agent does not exist (`AGENT_NOT_FOUND`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', CreateSchema),
    async (context) =>
      context.json(
        {
          data: await conversations.create(
            me(context),
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );
  router.post(
    '/conversations/start',
    guard,
    describeRoute({
      tags,
      summary: 'Start a conversation with its first message',
      operationId: 'agentsStartConversation',
      // UI-only: the pages' buttons, with page context; `conversation create` and `conversation message send` do it from the command line.
      ...cliRoute(false),
      description:
        "A new conversation from a place the application registered (`source`), with its first message, which wakes the agent. What the application's buttons call.",
      responses: {
        200: dataResponse(SendMessageResultSchema),
        400: conversationConflict('No chat agent is available'),
        404: apiErrorResponse(
          404,
          'The agent does not exist (`AGENT_NOT_FOUND`).',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', StartSchema),
    async (context) =>
      context.json({
        data: await conversations.start(me(context), context.req.valid('json')),
      }),
  );
  router.get(
    '/conversations/:conversationId',
    guard,
    describeRoute({
      tags,
      summary: 'Get a conversation',
      operationId: 'agentsGetConversation',
      ...cliRoute({
        command: 'conversation get',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      }),
      responses: {
        200: dataResponse(ConversationDetailSchema),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    async (context) =>
      context.json({
        data: await conversations.get(
          me(context),
          context.req.valid('param').conversationId,
        ),
      }),
  );
  router.patch(
    '/conversations/:conversationId',
    guard,
    describeRoute({
      tags,
      summary: 'Rename, archive or choose the model of a conversation',
      operationId: 'agentsUpdateConversation',
      description:
        "`model` picks one of the online conversation's `models` for its next runs (null: the agent's default); 400 `INVALID_REQUEST` with `reason: MODEL_NOT_LISTED` when the agent does not list it.",
      ...cliRoute({
        command: 'conversation update',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      }),
      responses: {
        200: dataResponse(ConversationDetailSchema),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('json', PatchSchema),
    async (context) =>
      context.json({
        data: await conversations.update(
          me(context),
          context.req.valid('param').conversationId,
          context.req.valid('json'),
        ),
      }),
  );
  router.get(
    '/conversations/:conversationId/messages',
    guard,
    describeRoute({
      tags,
      summary: "List a conversation's messages",
      operationId: 'agentsListConversationMessages',
      ...cliRoute({
        command: 'conversation message list',
        args: ['conversationId'],
        flags: {
          conversationId: { name: 'conversation' },
          pageSize: { name: 'limit' },
        },
        columns: ['seq', 'role', 'content.content', 'createdAt'],
      }),
      description:
        'Newest page first, each page in order; `after` reads only what arrived since a `seq`, and a page token the page before.',
      responses: {
        200: listResponse(ConversationMessageSchema, SeqPageMetaSchema),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('query', MessageListQuerySchema),
    async (context) => {
      const { after, pageSize, pageToken } = context.req.valid('query');
      const before =
        pageToken === undefined
          ? undefined
          : decodePageToken(pageToken, MessagePosition).before;
      const page = await conversations.messages(
        me(context),
        context.req.valid('param').conversationId,
        {
          ...(before === undefined ? {} : { before }),
          ...(after === undefined || before !== undefined ? {} : { after }),
          limit: pageSize,
        },
      );
      const first = page.items[0];
      return context.json({
        data: page.items,
        meta: {
          lastSeq: page.lastSeq,
          ...(page.hasMore && first
            ? { nextPageToken: encodePageToken({ before: first.seq }) }
            : {}),
        },
      });
    },
  );
  router.post(
    '/conversations/:conversationId/messages',
    guard,
    describeRoute({
      tags,
      summary: 'Send a message',
      operationId: 'agentsSendConversationMessage',
      ...cliRoute({
        command: 'conversation message send',
        args: ['conversationId'],
        flags: {
          conversationId: { name: 'conversation' },
          content: { contentFile: true, alias: 'm' },
          context: { hidden: true },
          clientId: { hidden: true },
        },
        uploads: {
          attach: {
            upload: 'agentsUploadChatAttachment',
            field: 'attachmentIds',
            multiple: true,
            maxBytes: CHAT_ATTACHMENT_SIZE_MAX,
            description: 'A file to send with the message (repeatable).',
          },
        },
        examples: [
          'conversation message send <conversation> -m "What is left on PM-12?"',
          'conversation message send <conversation> -m "See the log" --attach build.log',
        ],
      }),
      description:
        "Adds the caller's message and hands it to the conversation's agent: a new run, or the open one. The answer arrives as messages later; `run` says what happened to the agent. `attachmentIds` sends the caller's uploads with it; any other id answers 400 and nothing is sent.",
      responses: {
        201: dataResponse(SendMessageResultSchema, 'Created.'),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('json', SendSchema),
    async (context) =>
      context.json(
        {
          data: await conversations.send(
            me(context),
            context.req.valid('param').conversationId,
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );
  const acts: Record<
    'markRead' | 'stop' | 'fallback' | 'restore',
    {
      readonly act: (userId: string, id: string) => Promise<unknown>;
      readonly operationId: string;
      /** The command, or false for a UI-only one. */
      readonly cli: CliRouteOptions | false;
      readonly summary: string;
      readonly description: string;
      readonly conflict?: string;
    }
  > = {
    markRead: {
      act: (userId, id) => conversations.markRead(userId, id),
      operationId: 'agentsMarkConversationRead',
      // UI-only: the chat panel marks what the person saw.
      cli: false,
      summary: 'Mark a conversation read',
      description: "Marks the conversation's messages read for the caller.",
    },
    stop: {
      act: (userId, id) => conversations.stop(userId, id),
      operationId: 'agentsStopConversation',
      cli: {
        command: 'conversation stop',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      },
      summary: "Stop a conversation's agent",
      description: 'Cancels the run answering in the conversation, if any.',
    },
    fallback: {
      act: (userId, id) => conversations.fallback(userId, id),
      operationId: 'agentsFallbackConversation',
      cli: {
        command: 'conversation fallback',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      },
      summary: 'Switch a conversation to the default agent',
      description:
        'Continues the conversation with the default chat agent while its own agent cannot answer.',
      conflict: 'The conversation cannot fall back',
    },
    restore: {
      act: (userId, id) => conversations.restore(userId, id),
      operationId: 'agentsRestoreConversation',
      cli: {
        command: 'conversation restore',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      },
      summary: 'Switch a conversation back to its agent',
      description:
        'Gives the conversation back to the agent it fell back from.',
      conflict: 'The conversation has nothing to switch back to',
    },
  };
  for (const [verb, item] of Object.entries(acts))
    router.post(
      `/conversations/:conversationId/${verb}`,
      guard,
      describeRoute({
        tags,
        summary: item.summary,
        operationId: item.operationId,
        description: item.description,
        ...cliRoute(item.cli),
        responses: {
          200: dataResponse(ConversationDetailSchema),
          ...(item.conflict
            ? { 400: conversationConflict(item.conflict) }
            : {}),
          404: noConversation,
          ...apiErrorResponses,
        },
      }),
      conversationParam,
      async (context) =>
        context.json({
          data: await item.act(me(context), conversationId(context)),
        }),
    );

  router.get(
    '/chatAgents',
    guard,
    describeRoute({
      tags,
      summary: 'List the agents the caller may chat with',
      operationId: 'agentsListChatAgents',
      // UI-only: the chat panel's agent picker; `agent list` lists the same agents.
      ...cliRoute(false),
      description: 'With whether each can answer now.',
      responses: {
        200: listResponse(ChatAgentSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const data = await conversations.chatAgents(me(context));
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.post(
    '/:agentId/copy',
    guard,
    describeRoute({
      tags,
      summary: 'Copy an agent for oneself',
      operationId: 'agentsCopyAgent',
      ...cliRoute({
        command: 'agent copy',
        args: ['agentId'],
        flags: { agentId: { name: 'agent' } },
      }),
      description:
        "A private copy of an agent the caller may wake, owned and usable only by them; `makeDefault` makes it the caller's default chat agent.",
      responses: {
        200: dataResponse(AgentSchema),
        404: apiErrorResponse(
          404,
          'The agent does not exist, or the caller may not wake it.',
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', AgentParams),
    apiValidator('json', CopySchema),
    async (context) =>
      context.json({
        data: await conversations.copyAgent(
          me(context),
          context.req.valid('param').agentId,
          context.req.valid('json'),
        ),
      }),
  );

  router.get(
    '/chatPreferences',
    guard,
    describeRoute({
      tags,
      summary: "Get the caller's chat preferences",
      operationId: 'agentsGetChatPreferences',
      ...cliRoute({ command: 'conversation preferences get' }),
      responses: {
        200: dataResponse(ChatDefaultAgentSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json({ data: await chat.preferences(me(context)) }),
  );
  router.patch(
    '/chatPreferences',
    guard,
    describeRoute({
      tags,
      summary: "Update the caller's chat preferences",
      operationId: 'agentsUpdateChatPreferences',
      ...cliRoute({
        command: 'conversation preferences update',
        flags: { defaultAgentId: { name: 'default-agent' } },
      }),
      description: "Sets the caller's own default chat agent.",
      responses: {
        200: dataResponse(ChatDefaultAgentSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', ChatPreferencesPatchSchema),
    async (context) =>
      context.json({
        data: await chat.updatePreferences(
          me(context),
          context.req.valid('json'),
        ),
      }),
  );
  router.get(
    '/chatSettings',
    guard,
    describeRoute({
      tags,
      summary: "Get the team's chat settings",
      operationId: 'agentsGetChatSettings',
      ...cliRoute({ command: 'conversation settings get' }),
      responses: {
        200: dataResponse(ChatDefaultAgentSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => context.json({ data: await chat.settings() }),
  );
  router.patch(
    '/chatSettings',
    guard,
    async (context, next) => {
      if (!(await context.get('caller').can('agents.agents', 'manage')))
        throw forbidden('This needs agents.agents manage permission.');
      await next();
    },
    describeRoute({
      tags,
      summary: "Update the team's chat settings",
      operationId: 'agentsUpdateChatSettings',
      ...cliRoute({
        command: 'conversation settings update',
        flags: { defaultAgentId: { name: 'default-agent' } },
      }),
      description:
        "Sets the team's default chat agent. Needs `agents.agents` manage.",
      responses: {
        200: dataResponse(ChatDefaultAgentSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', ChatSettingsPatchSchema),
    async (context) =>
      context.json({
        data: await chat.updateSettings(me(context), context.req.valid('json')),
      }),
  );

  router.post(
    '/chatAttachments',
    guard,
    describeRoute({
      tags,
      summary: 'Upload a file to send in chat',
      operationId: 'agentsUploadChatAttachment',
      ...cliRoute({ command: 'conversation attachment upload' }),
      description: `One file as the \`file\` field of a multipart body, at most ${CHAT_ATTACHMENT_SIZE_MAX} bytes. It is the caller's alone until it is sent with a message (\`attachmentIds\`); one never sent is purged after a day.`,
      requestBody: singleFileBody,
      responses: {
        201: dataResponse(MessageAttachmentSchema, 'Stored.'),
        413: apiErrorResponse(
          413,
          `The file is over ${CHAT_ATTACHMENT_SIZE_MAX} bytes (\`UPLOAD_TOO_LARGE\`).`,
        ),
        503: apiErrorResponse(
          503,
          'The application stores no files (`NOT_IMPLEMENTED`).',
        ),
        ...apiErrorResponses,
      },
    }),
    bodyLimit({
      maxSize: CHAT_ATTACHMENT_SIZE_MAX + ENVELOPE,
      onError: () => {
        throw fileTooLarge();
      },
    }),
    async (context) => {
      let body: Record<string, unknown>;
      try {
        body = await context.req.parseBody();
      } catch {
        throw invalid('Send one file as multipart form data, as `file`.');
      }
      const file = body.file;
      if (!(file instanceof File))
        throw invalid('Send one file as multipart form data, as `file`.');
      return context.json(
        { data: await services.chatAttachments.upload(me(context), file) },
        201,
      );
    },
  );
  router.delete(
    '/chatAttachments/:attachmentId',
    guard,
    describeRoute({
      tags,
      summary: 'Discard a file not sent yet',
      operationId: 'agentsDeleteChatAttachment',
      // The composer removes a file before sending; a file sent with a message stays with it.
      ...cliRoute(false),
      description:
        "The caller's own upload that was not sent with a message; any other file answers 404.",
      responses: {
        204: emptyResponse(),
        404: noAttachment,
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', ChatAttachmentParams),
    async (context) => {
      await services.chatAttachments.remove(
        me(context),
        context.req.valid('param').attachmentId,
      );
      return context.body(null, 204);
    },
  );
  router.get(
    '/chatAttachments/:attachmentId/content',
    personOrRun,
    describeRoute({
      tags,
      summary: 'Download a file sent in chat',
      operationId: 'agentsDownloadChatAttachment',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'conversation attachment download',
        flags: {
          attachmentId: {
            name: 'file',
            description: 'The file id, as the message lists it.',
          },
          download: { hidden: true },
        },
        action: RUN_SELF_ACTION,
        examples: ['conversation attachment download <file-id>'],
      }),
      description:
        "The bytes of a file sent with a message, for the conversation's owner, or a run of its agent on that conversation (by its run token); an upload not sent yet, for its uploader. A safe raster image is served inline unless `download=true`; anything else, SVG and HTML included, as a download. Always with `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox` and `Cache-Control: private, no-store`.",
      responses: {
        200: {
          description:
            'The bytes, with the type the uploader declared (`application/octet-stream` when it is not a valid media type) and a `Content-Disposition` naming the file.',
          content: {
            'application/octet-stream': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        404: noAttachment,
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', ChatAttachmentParams),
    apiValidator('query', ChatAttachmentContentQuery),
    async (context) => {
      const who = context.get('caller');
      const { attachment, body } = await services.chatAttachments.content(
        { userId: who.userId, run: who.run ?? null },
        context.req.valid('param').attachmentId,
      );
      return new Response(body, {
        status: 200,
        headers: contentHeaders(
          attachment,
          context.req.valid('query').download,
        ),
      });
    },
  );

  router.get(
    '/presets',
    guard,
    describeRoute({
      tags,
      summary: 'List agent presets',
      operationId: 'agentsListPresets',
      ...cliRoute({
        command: 'agent preset list',
        columns: ['key', 'name', 'type', 'description'],
      }),
      description:
        'The roles the application registered that a new agent can start from. Needs `agents.agents` read.',
      responses: {
        200: listResponse(AgentPresetSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      if (!(await context.get('caller').can('agents.agents', 'read')))
        throw forbidden('This needs agents.agents read permission.');
      const data = services.presets.list();
      return context.json({ data, meta: { total: data.length } });
    },
  );

  return router;
}
