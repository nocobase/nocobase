/**
 * The chat API, mounted at `/api/agents` (`CHAT_ROUTES` in `shared/conversations`). Every route is behind the guard (a
 * signed-in person and their authorization context). A conversation is its owner's alone: the service answers 404 to
 * anyone else, whatever they may manage. Changing the team's default chat agent needs `agents.agents` manage.
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
import { type UserModelMessage, createUIMessageStreamResponse } from 'ai';
import {
  appUIMessageMetadataSchema,
  appUIToolApprovalInputSchema,
} from '../../shared/online-agent.js';
import { cleanTitle } from '../core/conversations/titles.js';
import { jsonSafe } from '../online/agent/messages/json.js';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';

import {
  CHAT_ATTACHMENT_SIZE_MAX,
  CHAT_ATTACHMENTS_PER_MESSAGE_MAX,
  CONVERSATION_SOURCE_PATTERN,
  CONVERSATION_TITLE_MAX,
  MESSAGE_CONTENT_MAX,
  type ConversationPatch,
  type CreateConversationRequest,
  type MessageAttachment,
  type OnlineChatConfigSnapshot,
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
  OnlineAgentResendSchema,
  ChatAgentSchema,
  ChatSettingsSchema,
  ChatAttachmentContentQuery,
  ChatAttachmentParams,
  ChatDefaultAgentSchema,
  ConversationAttentionSchema,
  ConversationDetailSchema,
  ConversationLinkParams,
  ConversationLinkSchema,
  ConversationListQuerySchema,
  ConversationParams,
  ConversationMessageParams,
  ConversationSummarySchema,
  ConversationUsageSchema,
  MessageAttachmentSchema,
  MessageListQuerySchema,
  PageTokenMetaSchema,
  SeqPageMetaSchema,
} from './schemas.js';

const noConversation = apiErrorResponse(
  404,
  "The conversation does not exist or is not the caller's (`CONVERSATION_NOT_FOUND`).",
);
const conversationConflict = (when: string) =>
  apiErrorResponse(400, `${when} (\`CONVERSATION_CONFLICT\`).`);

const MessagePosition = z.object({ before: z.number().int().min(1) });

const ConfigInput = z.strictObject({
  agentId: z.string().min(1).max(64).optional(),
  scope: z.array(z.string()).optional(),
  thinking: z.string().optional(),
  webSearch: z.boolean().optional(),
  context: z
    .strictObject({
      variable: z.json().optional(),
    })
    .optional(),
});
const ConfigOutput: z.ZodType<OnlineChatConfigSnapshot> = z.object({
  agentId: z.string().optional(),
  selectedModel: z
    .object({ modelService: z.string(), model: z.string() })
    .nullable(),
  scope: z.array(z.string()),
  model: z.array(z.string()).optional(),
  thinking: z.string().optional(),
  webSearch: z.boolean().optional(),
  tool: z.array(z.string()),
  toolVersions: z.record(z.string(), z.string()),
  systemPrompt: z.string(),
  variable: z.json().optional(),
});
const SelectedModel = z.strictObject({
  modelService: z.string().min(1),
  model: z.string().min(1),
});
const CreateSchema: z.ZodType<CreateConversationRequest> = z.strictObject({
  effort: z
    .string()
    .min(1)
    .max(40)
    .nullable()
    .optional()
    .describe('Runner reasoning effort; null restores the Agent default.'),
  agentId: z
    .string()
    .min(1)
    .max(64)
    .optional()
    .describe('The agent to start the conversation with.'),
  title: z
    .string()
    .max(CONVERSATION_TITLE_MAX * 2)
    .optional()
    .describe('The conversation title.'),
  source: z
    .string()
    .regex(CONVERSATION_SOURCE_PATTERN)
    .optional()
    .describe('The source context associated with this conversation.'),
  showInChatList: z
    .boolean()
    .optional()
    .describe(
      'Include this conversation in the default chat list (default true).',
    ),
  config: ConfigInput.optional().describe(
    'Explicit ordinary OnlineAgent configuration overrides for the new conversation.',
  ),
  selectedModel: SelectedModel.optional().describe(
    'Native model selection as modelService and model; omit for a Runner agent.',
  ),
});

const PatchSchema: z.ZodType<ConversationPatch> = z.strictObject({
  title: z
    .string()
    .max(CONVERSATION_TITLE_MAX * 2)
    .optional()
    .describe('The conversation title.'),
  archived: z
    .boolean()
    .optional()
    .describe('Whether to archive the conversation.'),
});

const NativeSendSchema = z.strictObject({
  message: z
    .strictObject({
      id: z.string().min(1).max(64),
      role: z.literal('user'),
      parts: z
        .array(
          z.strictObject({
            type: z.literal('text'),
            text: z.string().max(MESSAGE_CONTENT_MAX * 2),
          }),
        )
        .max(20),
    })
    .describe(
      'The current SDK user message with id, role user and text parts.',
    ),
  attachmentIds: z
    .array(z.string().min(1).max(64))
    .max(CHAT_ATTACHMENTS_PER_MESSAGE_MAX)
    .optional(),
  context: PageContextSchema.optional(),
  selectedModel: SelectedModel.optional(),
});
const SendSchema = NativeSendSchema.extend({
  effort: z
    .string()
    .min(1)
    .max(40)
    .nullable()
    .optional()
    .describe(
      'Runner reasoning effort; omit to retain the conversation preference, null restores the Agent default.',
    ),
  agentId: z
    .string()
    .min(1)
    .max(128)
    .optional()
    .describe(
      'Final Runner agent selection. Only an idle Runner conversation can change agents; binding, notice and message are committed together. Omit to keep the current agent.',
    ),
});
const NativeMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  metadata: appUIMessageMetadataSchema,
  parts: z.array(z.json()),
});
const ApprovalSchema = appUIToolApprovalInputSchema;

/** A multipart body of one file, as `file`. */
const singleFileBody: OpenAPIV3_1.RequestBodyObject = {
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'The file to upload for the conversation.',
          },
        },
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

/**
 * `guard` authenticates the request and sets `caller`; the route contribution passes the real one, tests a fake.
 * `personOrRun` also takes a run token (setting `caller.run`), for reading a conversation's files; `guard` by default.
 */
export function createChatRoutes(
  services: Agents,
  guard: MiddlewareHandler<AdminEnv>,
  personOrRun: MiddlewareHandler<AdminEnv> = guard,
  personOrOnlineAgent: MiddlewareHandler<AdminEnv> = guard,
): Hono<AdminEnv> {
  const router = domainRouter<AdminEnv>();
  const { conversations, chat } = services;
  const me = (context: Context<AdminEnv>) => context.get('caller').userId;
  const trusted = (context: Context<AdminEnv>) => {
    const value = context.get('caller').onlineContext;
    if (!value) throw forbidden('Trusted entry credentials are required.');
    return value;
  };

  const conversationParam = apiValidator('param', ConversationParams);
  const conversationId = (context: Context<AdminEnv>): string =>
    context.req.param('conversationId') ?? '';

  router.get(
    '/conversations',
    personOrOnlineAgent,
    describeRoute({
      tags,
      security: personOrRunSecurity,
      summary: "List the caller's conversations",
      operationId: 'agentsListConversations',
      ...cliRoute({
        command: 'conversation list',
        identities: ['person'],
        flags: {
          q: { name: 'query' },
          agentId: { name: 'agent' },
          pageSize: { name: 'limit' },
        },
        columns: ['id', 'title', 'agent.name', 'lastMessageAt', 'read'],
      }),
      description:
        "The conversations the caller started, newest message first, a page at a time; a conversation is its owner's alone. The runToken scheme accepts only OnlineAgent execution credentials here; Run tokens and other scoped credentials are refused.",
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
        ...(query.mode ? { mode: query.mode } : {}),
        ...(query.source ? { source: query.source } : {}),
        ...(query.linkKind ? { linkKind: query.linkKind } : {}),
        ...(query.linkTargetId ? { linkTargetId: query.linkTargetId } : {}),
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
        flags: {
          agentId: { name: 'agent' },
          showInChatList: { name: 'show-in-chat-list' },
        },
      }),
      description:
        'Creates an OnlineAgent session without sending input. Configuration defaults are resolved once; original model columns remain authoritative.',
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
          data: await (async () => {
            const request = context.req.valid('json');
            const title =
              request.title === undefined
                ? undefined
                : cleanTitle(request.title);
            if (title && title.length > CONVERSATION_TITLE_MAX)
              throw invalid('The conversation title is too long.');
            if (
              request.source &&
              request.source !== 'panel' &&
              !conversations.sources.has(request.source)
            )
              throw invalid('Unknown conversation source.');
            const agent = await services.onlineAgent.realtime(
              trusted(context),
              {
                ...request.config,
                ...(request.agentId ? { agentId: request.agentId } : {}),
                selectedModel: request.selectedModel,
                effort: request.effort,
                source: request.source ?? 'panel',
                title: title?.text || undefined,
                showInChatList: request.showInChatList,
              },
              'http',
            );
            return conversations.get(me(context), agent.sessionId);
          })(),
        },
        201,
      ),
  );
  router.get(
    '/conversations/:conversationId',
    personOrOnlineAgent,
    describeRoute({
      tags,
      security: personOrRunSecurity,
      description:
        'Owner-only read. The runToken scheme accepts OnlineAgent execution credentials here, not Run tokens or other scoped credentials.',
      summary: 'Get a conversation',
      operationId: 'agentsGetConversation',
      ...cliRoute({
        command: 'conversation get',
        identities: ['person'],
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
    personOrOnlineAgent,
    describeRoute({
      tags,
      security: personOrRunSecurity,
      description:
        'Owner-only update. The runToken scheme accepts OnlineAgent execution credentials, not Run tokens or other scoped credentials.',
      summary: 'Rename or archive a conversation',
      operationId: 'agentsUpdateConversation',
      ...cliRoute({
        command: 'conversation update',
        bodyFile: 'file',
        identities: ['person'],
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
  router.delete(
    '/conversations/:conversationId',
    guard,
    describeRoute({
      tags,
      summary: 'Delete a conversation',
      operationId: 'agentsDeleteConversation',
      ...cliRoute({
        command: 'conversation delete',
        identities: ['person'],
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      }),
      description:
        "Owner-only, for good: the conversation's open runs are cancelled, its messages, files, links and kept sessions are deleted, its inbox notices are settled, and runners remove its working directories and session files on their next report.",
      responses: {
        204: emptyResponse(),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    async (context) => {
      await conversations.delete(me(context), conversationId(context));
      return context.body(null, 204);
    },
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
        columns: ['metadata.seq', 'role', 'parts', 'metadata.createdAt'],
      }),
      description:
        'Newest page first, each page in order; after reads newly inserted sequences and pageToken reads older pages. Native ids rereads current messages after revision notifications, including updates at unchanged sequences.',
      responses: {
        200: listResponse(NativeMessageSchema, SeqPageMetaSchema),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('query', MessageListQuerySchema),
    async (context) => {
      const { after, pageSize, pageToken, ids } = context.req.valid('query');
      const before =
        pageToken === undefined
          ? undefined
          : decodePageToken(pageToken, MessagePosition).before;
      const agent = await services.onlineAgent.realtime(trusted(context), {
        sessionId: conversationId(context),
      });
      const wanted = ids?.split(',');
      if (
        wanted &&
        (wanted.length > 100 || wanted.some((id) => !id || id.length > 100))
      )
        throw invalid('Select at most 100 valid message IDs.');
      const page = await agent.messages({
        ids: wanted,
        before,
        after: before === undefined ? after : undefined,
        limit: pageSize,
      });
      return context.json({
        data: page.items,
        meta: {
          lastSeq: page.lastSeq,
          ...(page.nextAfter !== undefined
            ? { nextAfter: page.nextAfter }
            : {}),
          ...(page.hasMore && after === undefined && page.items[0]
            ? {
                nextPageToken: encodePageToken({
                  before: page.items[0].metadata!.seq!,
                }),
              }
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
        bodyFile: 'file',
        args: ['conversationId'],
        flags: {
          conversationId: { name: 'conversation' },
          message: { alias: 'm' },
          context: { hidden: true },
          selectedModel: { hidden: true },
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
          'conversation message send <conversation> --file current-user-message.json',
          'conversation message send <conversation> --file current-user-message.json --attach build.log',
        ],
      }),
      description:
        'Native input accepts only the current SDK user message with text parts and authorized attachmentIds, returning a standard UI message stream. Server metadata, history, tools and config are not writable here. Runner uses the same input and standard stream; only saved source records are projected. Busy input is refused. A timeout means outcome unknown: reconcile history and execution, never automatically resend.',
      responses: {
        200: {
          description:
            'Native AI SDK UI message stream. Finish closes this response; query execution for durable business state.',
          content: { 'text/event-stream': { schema: { type: 'string' } } },
        },
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('json', SendSchema),
    async (context) => {
      const id = context.req.valid('param').conversationId;
      const request = context.req.valid('json');
      const text = request.message.parts.map((part) => part.text).join('\n');
      if ([...text].length > MESSAGE_CONTENT_MAX)
        throw invalid('The message is too long.');
      if (!text.trim() && !request.attachmentIds?.length)
        throw invalid('A message or attachment is required.');
      const workContext = request.context
        ? await conversations.contextKinds.resolve(
            services.tx.read(),
            me(context),
            request.context,
          )
        : undefined;
      const actor = trusted(context);
      const agent = await services.onlineAgent.realtime(
        {
          ...actor,
          ...(workContext ? { business: jsonSafe(workContext) } : {}),
        },
        { sessionId: id },
      );
      const parts: Exclude<UserModelMessage['content'], string> =
        request.message.parts;
      if (request.agentId && agent.backend !== 'runner')
        throw invalid(
          'Only Runner conversations can select an agent when sending.',
        );
      if (request.effort !== undefined && agent.backend !== 'runner')
        throw invalid(
          'Online agents do not support conversation reasoning effort.',
          { reason: 'EFFORT_UNSUPPORTED' },
        );
      await agent.send([{ role: 'user', content: parts }], {
        agentId: request.agentId,
        effort: request.effort,
        attachmentIds: [[...(request.attachmentIds ?? [])]],
        clientId: request.message.id,
        messageId: request.message.id,
        selectedModel: request.selectedModel,
        workContext,
      });
      const stream = await agent.receive();
      if (!stream)
        throw invalid('The accepted response requires history reconciliation.');
      return createUIMessageStreamResponse({
        stream,
        headers: {
          'Cache-Control': 'private, no-store',
          'x-online-agent-recovery': services.onlineAgent.recovery,
        },
      });
    },
  );
  router.post(
    '/conversations/:conversationId/queue',
    guard,
    describeRoute({
      tags,
      summary: 'Queue a message while the agent works',
      operationId: 'agentsQueueConversationMessage',
      ...cliRoute({
        command: 'conversation message queue',
        bodyFile: 'file',
        args: ['conversationId'],
        flags: {
          conversationId: { name: 'conversation' },
          message: { alias: 'm' },
          context: { hidden: true },
          selectedModel: { hidden: true },
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
      }),
      description:
        'Runner only. The same input as sending a message, while the agent is working on the conversation: the message joins that work, the runner steering it into the running turn when its tool can and taking it as the next turn otherwise. Answers the saved user message; the current response keeps streaming. Refused (`409`) when the agent is not working on the conversation: send it instead.',
      responses: {
        200: dataResponse(NativeMessageSchema),
        404: noConversation,
        409: apiErrorResponse(
          409,
          'The agent is not working on the conversation.',
        ),
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('json', NativeSendSchema),
    async (context) => {
      const id = context.req.valid('param').conversationId;
      const request = context.req.valid('json');
      const text = request.message.parts.map((part) => part.text).join('\n');
      if ([...text].length > MESSAGE_CONTENT_MAX)
        throw invalid('The message is too long.');
      if (!text.trim() && !request.attachmentIds?.length)
        throw invalid('A message or attachment is required.');
      const workContext = request.context
        ? await conversations.contextKinds.resolve(
            services.tx.read(),
            me(context),
            request.context,
          )
        : undefined;
      const actor = trusted(context);
      const agent = await services.onlineAgent.realtime(
        {
          ...actor,
          ...(workContext ? { business: jsonSafe(workContext) } : {}),
        },
        { sessionId: id },
      );
      const seq = await agent.queue(
        [{ role: 'user', content: request.message.parts }],
        {
          attachmentIds: [[...(request.attachmentIds ?? [])]],
          clientId: request.message.id,
          messageId: request.message.id,
          selectedModel: request.selectedModel,
          workContext,
        },
      );
      const page = await agent.messages({ after: seq - 1, limit: 1 });
      const message = page.items.find(
        (item) => item.role === 'user' && item.metadata?.seq === seq,
      );
      // Saved but not readable now: the server's fault, not the request's; history has it once readable.
      if (!message)
        throw new Error(
          'The queued message was saved but could not be read back.',
        );
      return context.json({ data: message });
    },
  );
  router.post(
    '/conversations/:conversationId/messages/:messageId/withdraw',
    guard,
    describeRoute({
      tags,
      summary: 'Withdraw a queued message',
      operationId: 'agentsWithdrawConversationMessage',
      ...cliRoute({
        command: 'conversation message withdraw',
        args: ['conversationId', 'messageId'],
        flags: {
          conversationId: { name: 'conversation' },
          messageId: { name: 'message' },
        },
      }),
      description:
        'Takes back a message queued while the agent worked, as long as its runner has not taken it: it stays in the history, marked withdrawn, and the agent never sees it. Once the runner has it: `400` `CONVERSATION_CONFLICT` with `metadata.reason` `messageTaken`.',
      responses: {
        204: emptyResponse(),
        400: apiErrorResponse(
          400,
          'The agent already has the message (`CONVERSATION_CONFLICT`, `messageTaken`).',
        ),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', ConversationMessageParams),
    async (context) => {
      const { conversationId: id, messageId } = context.req.valid('param');
      await conversations.withdraw(me(context), id, messageId);
      return context.body(null, 204);
    },
  );
  router.post(
    '/conversations/:conversationId/resend',
    guard,
    describeRoute({
      tags,
      summary: 'Resend an existing user message',
      operationId: 'agentsResendConversationMessage',
      ...cliRoute(false),
      description:
        'Native only. Updates the user input in place and permanently deletes all later messages in the admission transaction. Retains original attachments and context. Business effects are not reversed. Unknown responses must not be automatically retried.',
      responses: {
        200: {
          description: 'Standard SDK UI message stream.',
          content: { 'text/event-stream': { schema: { type: 'string' } } },
        },
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('json', OnlineAgentResendSchema),
    async (context) => {
      const agent = await services.onlineAgent.realtime(trusted(context), {
        sessionId: conversationId(context),
      });
      await agent.resend(context.req.valid('json'));
      const stream = await agent.receive();
      if (!stream)
        throw invalid('The accepted response requires history reconciliation.');
      return createUIMessageStreamResponse({
        stream,
        headers: {
          'Cache-Control': 'private, no-store',
          'x-online-agent-recovery': services.onlineAgent.recovery,
        },
      });
    },
  );
  router.post(
    '/conversations/:conversationId/approval',
    guard,
    describeRoute({
      tags,
      summary: 'Respond to a native SDK tool approval',
      operationId: 'agentsRespondConversationApproval',
      ...cliRoute(false),
      description:
        'Only the SDK approval response is accepted. The server binds it to the owner, execution, message and real pending tool call. Duplicate, expired and concurrent responses are rejected without executing tools again.',
      responses: {
        200: {
          description: 'Standard SDK UI message continuation stream.',
          content: { 'text/event-stream': { schema: { type: 'string' } } },
        },
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('json', ApprovalSchema),
    async (context) => {
      const agent = await services.onlineAgent.realtime(trusted(context), {
        sessionId: conversationId(context),
      });
      await agent.approve(context.req.valid('json'));
      const stream = await agent.receive();
      if (!stream)
        throw invalid(
          'The accepted continuation requires history reconciliation.',
        );
      return createUIMessageStreamResponse({
        stream,
        headers: {
          'Cache-Control': 'private, no-store',
          'x-online-agent-recovery': services.onlineAgent.recovery,
        },
      });
    },
  );
  router.post(
    '/conversations/:conversationId/finalize',
    guard,
    describeRoute({
      tags,
      summary: 'Retry response persistence without executing again',
      operationId: 'agentsFinalizeConversation',
      ...cliRoute(false),
      responses: {
        200: dataResponse(ConversationDetailSchema),
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator('json', z.strictObject({})),
    async (context) => {
      const id = conversationId(context);
      const agent = await services.onlineAgent.realtime(trusted(context), {
        sessionId: id,
      });
      await agent.retryFinalization();
      return context.json({ data: await conversations.get(me(context), id) });
    },
  );
  router.post(
    '/conversations/:conversationId/switchAgent',
    guard,
    describeRoute({
      tags,
      summary: 'Change a Runner conversation’s agent',
      operationId: 'agentsSwitchConversationAgent',
      ...cliRoute(false),
      description:
        'Owner only. Select an enabled, callable Runner Agent once all pending work has ended. History and task links stay; the next message starts a fresh tool session with the new agent. No run is cancelled or automatically started.',
      responses: {
        200: dataResponse(ConversationDetailSchema),
        409: conversationConflict(
          'The conversation has pending work or has been archived.',
        ),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator(
      'json',
      z.strictObject({ agentId: z.string().trim().min(1).max(64) }),
    ),
    async (context) =>
      context.json({
        data: await conversations.switchAgent(
          me(context),
          conversationId(context),
          context.req.valid('json').agentId,
        ),
      }),
  );
  const acts: Record<
    'markRead' | 'stop' | 'switchRunner',
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
      act: async () => {
        throw invalid('Use the authenticated OnlineAgent stop handler.');
      },
      operationId: 'agentsStopConversation',
      cli: {
        command: 'conversation stop',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      },
      summary: "Stop a conversation's agent",
      description:
        'Processes a cancellation request. The returned execution may remain running until actual termination and canonical history synchronization; request success does not mean the agent has stopped.',
    },
    switchRunner: {
      act: (userId, id) => conversations.switchRunner(userId, id),
      operationId: 'agentsSwitchConversationRunner',
      cli: {
        command: 'conversation switch-runner',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      },
      summary: 'Unbind a conversation from its runner',
      description:
        "Owner only. The next run goes to whichever eligible runner takes it first, which binds the conversation and starts a fresh session with the conversation's history; queued runs wait for it. The old working directory is left to the old runner's cleanup.",
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
          data:
            verb === 'stop'
              ? await (async () => {
                  const id = conversationId(context);
                  const detail = await conversations.get(me(context), id);
                  if (!detail.execution)
                    return conversations.stop(me(context), id);
                  const agent = await services.onlineAgent.realtime(
                    trusted(context),
                    { sessionId: id },
                  );
                  await agent.abort();
                  return conversations.get(me(context), id);
                })()
              : await item.act(me(context), conversationId(context)),
        }),
    );

  router.post(
    '/conversations/:conversationId/markSeen',
    guard,
    describeRoute({
      tags,
      summary: 'Mark a conversation seen up to a message',
      operationId: 'agentsMarkConversationSeen',
      // UI-only: the chat panel marks what the person saw.
      ...cliRoute(false),
      description:
        'Owner only. Moves the read position forward to `seq` (never back): a reply or failure waiting for the owner up to there is settled, a question waits until they write.',
      responses: {
        200: dataResponse(ConversationDetailSchema),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator(
      'json',
      z.strictObject({
        seq: z
          .number()
          .int()
          .min(0)
          .meta({ description: 'The message seq seen up to.' }),
      }),
    ),
    async (context) =>
      context.json({
        data: await conversations.markSeen(
          me(context),
          conversationId(context),
          context.req.valid('json').seq,
        ),
      }),
  );
  router.get(
    '/conversations/:conversationId/links',
    guard,
    describeRoute({
      tags,
      summary: "List a conversation's links",
      operationId: 'agentsListConversationLinks',
      ...cliRoute({
        command: 'conversation link list',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
        columns: ['id', 'kind', 'targetId', 'view.key', 'view.title'],
      }),
      description:
        'Owner only. What the conversation is tied to, oldest first, as the application resolves each record for the caller; a bounded list.',
      responses: {
        200: listResponse(
          ConversationLinkSchema,
          z.object({ total: z.number().int() }),
        ),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    async (context) => {
      const items = await conversations.links.list(
        me(context),
        conversationId(context),
      );
      return context.json({ data: items, meta: { total: items.length } });
    },
  );
  router.post(
    '/conversations/:conversationId/links',
    guard,
    describeRoute({
      tags,
      summary: 'Tie a record to a conversation',
      operationId: 'agentsCreateConversationLink',
      ...cliRoute({
        command: 'conversation link add',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      }),
      description:
        'Owner only. Ties a record of a kind the application registered, which the caller may see; tying it again answers the existing link.',
      responses: {
        200: dataResponse(ConversationLinkSchema, 'Already tied.'),
        201: dataResponse(ConversationLinkSchema, 'Created.'),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    apiValidator(
      'json',
      z.strictObject({
        kind: z
          .string()
          .min(1)
          .max(64)
          .meta({ description: 'A link kind the application registered.' }),
        targetId: z
          .string()
          .min(1)
          .max(255)
          .meta({ description: 'The id of the record of that kind.' }),
      }),
    ),
    async (context) => {
      const target = context.req.valid('json');
      const id = conversationId(context);
      // Tying it again answers the existing link, as 200 rather than 201.
      const existed = (await conversations.links.list(me(context), id)).some(
        (link) =>
          link.kind === target.kind && link.targetId === target.targetId,
      );
      const data = await conversations.links.add(me(context), id, target);
      return context.json({ data }, existed ? 200 : 201);
    },
  );
  router.delete(
    '/conversations/:conversationId/links/:linkId',
    guard,
    describeRoute({
      tags,
      summary: 'Untie a record from a conversation',
      operationId: 'agentsDeleteConversationLink',
      ...cliRoute({
        command: 'conversation link remove',
        args: ['conversationId', 'linkId'],
        flags: { conversationId: { name: 'conversation' } },
      }),
      description: 'Owner only.',
      responses: {
        204: emptyResponse(),
        404: apiErrorResponse(
          404,
          "The conversation or the link does not exist, or is not the caller's.",
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', ConversationLinkParams),
    async (context) => {
      const { conversationId: id, linkId } = context.req.valid('param');
      await conversations.links.remove(me(context), id, linkId);
      return context.body(null, 204);
    },
  );
  router.get(
    '/conversations/:conversationId/usage',
    guard,
    describeRoute({
      tags,
      summary: "Get a conversation's token usage",
      operationId: 'agentsGetConversationUsage',
      ...cliRoute({
        command: 'conversation usage',
        args: ['conversationId'],
        flags: { conversationId: { name: 'conversation' } },
      }),
      description:
        "Owner only. The tokens the conversation's runs used, summed, and how full the context window was after the latest run whose coding tool reports it.",
      responses: {
        200: dataResponse(ConversationUsageSchema),
        404: noConversation,
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    async (context) =>
      context.json({
        data: await conversations.usage(me(context), conversationId(context)),
      }),
  );
  router.get(
    '/conversationAttention',
    guard,
    describeRoute({
      tags,
      summary: "Count the caller's conversations that wait for them",
      operationId: 'agentsGetConversationAttention',
      ...cliRoute(false),
      description:
        "Of the caller's open conversations in the chat list: how many are unread, and how many need them (a reply, a failure, a question).",
      responses: {
        200: dataResponse(ConversationAttentionSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json({ data: await conversations.attention(me(context)) }),
  );
  router.get(
    '/conversations/:conversationId/events',
    guard,
    describeRoute({
      tags,
      summary: 'Resume the current OnlineAgent UI stream',
      operationId: 'agentsConversationEvents',
      ...cliRoute(false),
      description:
        'Returns a full standard SDK replay and subsequent chunks when optional shared Redis recovery is configured. Without it, only an unclaimed local live response is available. Execution is never restarted. Missing streams return 204, which does not mean idle or successful: reconcile execution and persisted history. Disconnect never invokes Stop.',
      responses: {
        200: {
          description: 'Standard SDK UI message stream for Native and Runner.',
          content: { 'text/event-stream': { schema: { type: 'string' } } },
        },
        204: { description: 'No current stream; read saved history.' },
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    async (context) => {
      const agent = await services.onlineAgent.realtime(trusted(context), {
        sessionId: conversationId(context),
      });
      context.header('Cache-Control', 'private, no-store');
      context.header('x-online-agent-recovery', services.onlineAgent.recovery);
      const events = await agent.receive();
      if (!events) return context.body(null, 204);
      return createUIMessageStreamResponse({
        stream: events,
        headers: {
          'Cache-Control': 'private, no-store',
          'x-online-agent-recovery': services.onlineAgent.recovery,
        },
      });
    },
  );
  router.get(
    '/conversations/:conversationId/config',
    guard,
    describeRoute({
      tags,
      summary: 'Read the saved OnlineAgent configuration',
      operationId: 'agentsGetConversationConfig',
      ...cliRoute(false),
      responses: {
        200: dataResponse(ConfigOutput),
        ...apiErrorResponses,
      },
    }),
    conversationParam,
    async (context) => {
      const config = await services.onlineAgent.configuration(
        trusted(context),
        conversationId(context),
      );
      return context.json({ data: config });
    },
  );
  router.patch(
    '/conversations/:conversationId/config',
    guard,
    describeRoute({
      tags,
      summary: 'Update idle OnlineAgent configuration',
      operationId: 'agentsUpdateConversationConfig',
      ...cliRoute(false),
      description:
        'Explicit overrides only; running configuration is frozen. The selected model and snapshot update atomically.',
      responses: { 200: dataResponse(ConfigOutput), ...apiErrorResponses },
    }),
    conversationParam,
    apiValidator(
      'json',
      z.strictObject({
        config: ConfigInput,
        selectedModel: SelectedModel.optional(),
      }),
    ),
    async (context) => {
      const input = context.req.valid('json');
      const config = await services.onlineAgent.configure(
        trusted(context),
        conversationId(context),
        input.config,
        input.selectedModel,
        'http',
      );
      return context.json({ data: config });
    },
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
      const data = await services.conversations.chatAgents(me(context));
      return context.json({ data, meta: { total: data.length } });
    },
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
        200: dataResponse(ChatSettingsSchema),
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
        flags: {
          defaultAgentId: { name: 'default-agent' },
        },
      }),
      description:
        "Sets the team's default chat agent, an enabled agent. Needs `agents.agents` manage.",
      responses: {
        200: dataResponse(ChatSettingsSchema),
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

  return router;
}
