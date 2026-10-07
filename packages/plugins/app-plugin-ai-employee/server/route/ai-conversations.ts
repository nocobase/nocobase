import type { AgentState } from '@nocobase/ai-employee';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Context as HonoContext, Hono } from 'hono';

import type { ConversationTransport } from '../agent/contracts.js';
import type { ServiceFactory } from '../factory/service-factory.js';
import type { GetAIConversationMessagesResult } from '../manager/ai-conversations-manager.js';
import type { ConversationStreamTarget } from '../types.js';
import { identityTranslate } from '../types.js';
import { requiresSettings, type AIRouteGuards } from './settings-access.js';
import { bodyTooLargeResponse, runStreamResponse, tags } from './openapi.js';
import {
  BoundedListMeta,
  ConversationOptionsInput,
  ConversationOptionsResponse,
  ConversationResponse,
  ConversationUserResponse,
  ManagedConversationResponse,
  MessagePageMeta,
  MessageResponse,
  PagedListMeta,
  ToolCallResponse,
  UnreadCountResponse,
  UserDecisionResponse,
  ConversationOwnersQuery,
  ConversationParams,
  ConversationsQuery,
  CreateConversationInput,
  ManagedConversationParams,
  ManagedConversationsQuery,
  MessagesQuery,
  ResendMessagesInput,
  ResumeToolCallInput,
  SendMessagesInput,
  ToolCallArgsInput,
  ToolCallParams,
  UpdateConversationInput,
  UserDecisionInput,
  type AgentStateInput,
} from './schemas.js';
import { createAISSEStreamResponse, jsonBody, runBody } from './utils.js';

const conversationNotFound = apiErrorResponse(
  404,
  "No conversation of the caller's has this session id (`CONVERSATION_NOT_FOUND`).",
);

const toolCallNotFound = apiErrorResponse(
  404,
  "No conversation of the caller's has this session id (`CONVERSATION_NOT_FOUND`), it has no such message (`MESSAGE_NOT_FOUND`), or the message has no such tool call (`TOOL_CALL_NOT_FOUND`).",
);

const runLimitReached = apiErrorResponse(
  429,
  'The caller already has as many runs in progress as allowed (`CONVERSATION_LIMIT_REACHED`). Retry once one ends.',
);

/**
 * Conversations. `/aiEmployee/conversations` is the signed-in user's own chat; `/aiEmployee/managedConversations` and
 * `/aiEmployee/conversationOwners` are the conversation center, which reads every user's conversations and needs
 * `read` on the `ai.conversations` AI settings item. They are separate resources because who may read them, and what a row carries, differ.
 */
export function createAIConversationsRouter(
  app: Hono,
  services: ServiceFactory,
  { settings, signedIn }: AIRouteGuards,
): void {
  const conversations = services.conversationService;

  // ---- The conversation center ----

  app.get(
    '/aiEmployee/managedConversations',
    settings(['conversations', 'read']),
    describeRoute({
      tags,
      summary: "List every user's conversations",
      operationId: 'aiEmployeesListManagedConversations',
      description:
        'The conversation center: main conversations of every user, newest first, with their owner and employee. `q` matches part of the title. ' +
        requiresSettings(['conversations', 'read']),
      responses: {
        200: listResponse(ManagedConversationResponse, PagedListMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ManagedConversationsQuery),
    async (context) => {
      const query = context.req.valid('query');
      const result = await conversations.listAll({
        actor: context.var.aiSettingsActor,
        keyword: query.q,
        userId: query.userId,
        aiEmployeeUsername: query.aiEmployeeUsername,
        page: query.page,
        pageSize: query.pageSize,
      });
      return context.json({
        data: result.rows,
        meta: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.count,
        },
      });
    },
  );

  app.get(
    '/aiEmployee/managedConversations/:sessionId/messages',
    settings(['conversations', 'read']),
    describeRoute({
      tags,
      summary: "Read the messages of any user's conversation",
      operationId: 'aiEmployeesListManagedConversationMessages',
      description:
        'Newest first, `pageSize` (10 by default, at most 200) at a time; pass `meta.nextPageToken` as `pageToken` for the next older page. Sub-agent conversations appear inside the message that delegated to them. ' +
        requiresSettings(['conversations', 'read']),
      responses: {
        200: listResponse(MessageResponse, MessagePageMeta),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No conversation has this session id (`CONVERSATION_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', ManagedConversationParams),
    apiValidator('query', MessagesQuery),
    async (context) => {
      const query = context.req.valid('query');
      const page = await conversations.getAllMessages({
        actor: context.var.aiSettingsActor,
        sessionId: context.req.valid('param').sessionId,
        cursor: query.pageToken,
        pageSize: query.pageSize,
      });
      return context.json(messagePage(page));
    },
  );

  // Users who own a conversation, for choosing whose conversations the center lists.
  app.get(
    '/aiEmployee/conversationOwners',
    settings(['conversations', 'read']),
    describeRoute({
      tags,
      summary: 'List the users who own a conversation',
      operationId: 'aiEmployeesListConversationOwners',
      description:
        'For choosing whose conversations the conversation center lists. Only users with at least one main conversation are listed. `q` matches part of the name or username; `userId` resolves one user. ' +
        requiresSettings(['conversations', 'read']),
      responses: {
        200: listResponse(ConversationUserResponse, PagedListMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ConversationOwnersQuery),
    async (context) => {
      const query = context.req.valid('query');
      const result = await conversations.listConversationUsers({
        actor: context.var.aiSettingsActor,
        keyword: query.q,
        userId: query.userId,
        page: query.page,
        pageSize: query.pageSize,
      });
      return context.json({
        data: result.rows,
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.count,
        },
      });
    },
  );

  // ---- The signed-in user's own conversations ----

  app.get(
    '/aiEmployee/conversations',
    signedIn,
    describeRoute({
      tags,
      summary: "List the caller's conversations",
      operationId: 'aiEmployeesListConversations',
      description:
        "The caller's own chat conversations, most recently updated first, read whole. `q` matches part of the title.",
      responses: {
        200: listResponse(ConversationResponse, BoundedListMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', ConversationsQuery),
    async (context) => {
      const actor = context.var.currentUser;
      const data = await conversations.list({
        actorId: actor.id,
        scope: actor.scope,
        options: { keyword: context.req.valid('query').q || undefined },
      });
      // A user's own chat list is read whole; it is not paged.
      return context.json({ data, meta: { total: data.length } });
    },
  );

  app.post(
    '/aiEmployee/conversations',
    signedIn,
    describeRoute({
      tags,
      summary: 'Start a conversation',
      operationId: 'aiEmployeesCreateConversation',
      description:
        "Starts an empty conversation with an employee; `send` puts the first message in it. The settings given are kept as the conversation's options. Answers `400` when the employee does not exist (`AI_EMPLOYEE_NOT_FOUND`) or is disabled (`AI_EMPLOYEE_DISABLED`).",
      responses: {
        201: dataResponse(ConversationResponse, 'The created conversation.'),
        400: apiErrorResponse(
          400,
          'The employee does not exist (`AI_EMPLOYEE_NOT_FOUND`) or is disabled (`FAILED_PRECONDITION`, `AI_EMPLOYEE_DISABLED`).',
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        413: bodyTooLargeResponse,
      },
    }),
    jsonBody,
    apiValidator('json', CreateConversationInput),
    async (context) => {
      const data = await conversations.create({
        actorId: context.var.currentUser.id,
        input: context.req.valid('json'),
      });
      return context.json({ data }, 201);
    },
  );

  // Registered before `/:sessionId`, which it would otherwise be read as.
  app.get(
    '/aiEmployee/conversations/unreadCount',
    signedIn,
    describeRoute({
      tags,
      summary: "Count the caller's unread conversations",
      operationId: 'aiEmployeesCountUnreadConversations',
      description:
        'Main chat conversations whose latest answer the caller has not opened yet.',
      responses: {
        200: dataResponse(UnreadCountResponse),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    async (context) => {
      const data = await conversations.unreadCount({
        actorId: context.var.currentUser.id,
      });
      return context.json({ data });
    },
  );

  app.get(
    '/aiEmployee/conversations/:sessionId',
    signedIn,
    describeRoute({
      tags,
      summary: 'Get a conversation',
      operationId: 'aiEmployeesGetConversation',
      description:
        "One of the caller's own conversations. `llmActiveState` tells whether a run is still going.",
      responses: {
        200: dataResponse(ConversationResponse),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
      },
    }),
    apiValidator('param', ConversationParams),
    async (context) => {
      const data = await conversations.get({
        actorId: context.var.currentUser.id,
        sessionId: context.req.valid('param').sessionId,
      });
      return context.json({ data });
    },
  );

  app.patch(
    '/aiEmployee/conversations/:sessionId',
    signedIn,
    describeRoute({
      tags,
      summary: 'Rename a conversation',
      operationId: 'aiEmployeesUpdateConversation',
      description:
        "Changes the title of one of the caller's own conversations.",
      responses: {
        200: dataResponse(ConversationResponse),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', ConversationParams),
    jsonBody,
    apiValidator('json', UpdateConversationInput),
    async (context) => {
      const data = await conversations.update({
        actorId: context.var.currentUser.id,
        sessionId: context.req.valid('param').sessionId,
        input: context.req.valid('json'),
      });
      return context.json({ data });
    },
  );

  app.delete(
    '/aiEmployee/conversations/:sessionId',
    signedIn,
    describeRoute({
      tags,
      summary: 'Delete a conversation',
      operationId: 'aiEmployeesDeleteConversation',
      description: "Deletes one of the caller's own conversations.",
      responses: {
        204: emptyResponse('The conversation was deleted.'),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
      },
    }),
    apiValidator('param', ConversationParams),
    async (context) => {
      await conversations.destroy({
        actorId: context.var.currentUser.id,
        sessionId: context.req.valid('param').sessionId,
      });
      return context.body(null, 204);
    },
  );

  app.put(
    '/aiEmployee/conversations/:sessionId/options',
    signedIn,
    describeRoute({
      tags,
      summary: "Replace a conversation's options",
      operationId: 'aiEmployeesReplaceConversationOptions',
      description:
        "Replaces the settings the conversation's runs use as a whole: a field left out is removed.",
      responses: {
        200: dataResponse(ConversationOptionsResponse),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', ConversationParams),
    jsonBody,
    apiValidator('json', ConversationOptionsInput),
    async (context) => {
      const data = await conversations.updateOptions({
        actorId: context.var.currentUser.id,
        sessionId: context.req.valid('param').sessionId,
        input: context.req.valid('json'),
      });
      return context.json({ data });
    },
  );

  // Reading history never marks a conversation read; opening it in the chat does, through this request.
  app.get(
    '/aiEmployee/conversations/:sessionId/messages',
    signedIn,
    describeRoute({
      tags,
      summary: "Read a conversation's messages",
      operationId: 'aiEmployeesListConversationMessages',
      description:
        'Newest first, `pageSize` (10 by default, at most 200) at a time; pass `meta.nextPageToken` as `pageToken` for the next older page. Reading never marks the conversation read; `markRead` does.',
      responses: {
        200: listResponse(MessageResponse, MessagePageMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
      },
    }),
    apiValidator('param', ConversationParams),
    apiValidator('query', MessagesQuery),
    async (context) => {
      const query = context.req.valid('query');
      const page = await conversations.getMessages({
        actorId: context.var.currentUser.id,
        options: {
          sessionId: context.req.valid('param').sessionId,
          cursor: query.pageToken,
          pageSize: query.pageSize,
        },
      });
      return context.json(messagePage(page));
    },
  );

  app.post(
    '/aiEmployee/conversations/:sessionId/markRead',
    signedIn,
    describeRoute({
      tags,
      summary: 'Mark a conversation read',
      operationId: 'aiEmployeesMarkConversationRead',
      description:
        "Marks one of the caller's own conversations read and answers it.",
      responses: {
        200: dataResponse(ConversationResponse),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
      },
    }),
    apiValidator('param', ConversationParams),
    async (context) => {
      const data = await conversations.markRead({
        actorId: context.var.currentUser.id,
        sessionId: context.req.valid('param').sessionId,
      });
      return context.json({ data });
    },
  );

  app.post(
    '/aiEmployee/conversations/:sessionId/abort',
    signedIn,
    describeRoute({
      tags,
      summary: 'Stop the run of a conversation',
      operationId: 'aiEmployeesAbortConversation',
      description:
        'Stops the run in progress, if there is one, and answers the conversation. A conversation with no run in progress is answered unchanged.',
      responses: {
        200: dataResponse(ConversationResponse),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
      },
    }),
    apiValidator('param', ConversationParams),
    async (context) => {
      const actorId = context.var.currentUser.id;
      const { sessionId } = context.req.valid('param');
      await conversations.abort({ actorId, input: { sessionId } });
      return context.json({
        data: await conversations.get({ actorId, sessionId }),
      });
    },
  );

  // The user's answer to a tool call that waits for one: approve, reject, or run it with edited arguments.
  app.put(
    '/aiEmployee/conversations/:sessionId/messages/:messageId/toolCalls/:toolCallId/userDecision',
    signedIn,
    describeRoute({
      tags,
      summary: 'Decide on a tool call that waits for the user',
      operationId: 'aiEmployeesReplaceToolCallUserDecision',
      description:
        'Approves the call, rejects it with an optional message, or approves it with edited arguments. The decision is recorded; `resumeToolCall` continues the run. Answers `400 FAILED_PRECONDITION` (`FRONTEND_TOOL_UNAVAILABLE`) when a frontend tool the call needs is no longer offered by the page.',
      responses: {
        200: dataResponse(UserDecisionResponse),
        400: apiErrorResponse(
          400,
          'A frontend tool the call needs is no longer offered by the page (`FAILED_PRECONDITION`, `FRONTEND_TOOL_UNAVAILABLE`).',
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: toolCallNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', ToolCallParams),
    jsonBody,
    apiValidator('json', UserDecisionInput),
    async (context) => {
      const { sessionId, messageId, toolCallId } = context.req.valid('param');
      const data = await conversations.updateUserDecision({
        actor: context.var.currentUser,
        messageId,
        toolCallId,
        userDecision: context.req.valid('json'),
        state: parseAgentState(context, sessionId, {}),
        transport: transport(context),
      });
      return context.json({ data });
    },
  );

  app.patch(
    '/aiEmployee/conversations/:sessionId/messages/:messageId/toolCalls/:toolCallId',
    signedIn,
    describeRoute({
      tags,
      summary: "Replace a tool call's arguments",
      operationId: 'aiEmployeesUpdateToolCall',
      description:
        'Replaces the arguments of a tool call that has not run yet, and answers the call.',
      responses: {
        200: dataResponse(ToolCallResponse),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: toolCallNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', ToolCallParams),
    jsonBody,
    apiValidator('json', ToolCallArgsInput),
    async (context) => {
      const { sessionId, messageId, toolCallId } = context.req.valid('param');
      const data = await conversations.updateToolArgs({
        actorId: context.var.currentUser.id,
        sessionId,
        messageId,
        toolCallId,
        args: context.req.valid('json').args,
      });
      return context.json({ data });
    },
  );

  // ---- Runs, answered as server-sent events ----
  // The path and body are checked before the stream opens — the conversation, the employee and message the body names,
  // and the caller's limit on parallel runs — so those failures are the standard error body. Once it is open, a failure
  // is an `error` event on the stream.

  app.post(
    '/aiEmployee/conversations/:sessionId/send',
    signedIn,
    describeRoute({
      tags,
      summary: 'Send messages and stream the answer',
      operationId: 'aiEmployeesSendConversationMessages',
      description:
        "Adds the messages to the conversation and runs the employee on them, streaming the answer. `editingMessageId` replaces that message and everything after it. `systemMessage` and `skillSettings` are accepted and not applied; a run uses the conversation's options. Before the stream opens the request is answered `400` when no message has the role `user` (`INVALID_INPUT`) or the employee does not exist (`AI_EMPLOYEE_NOT_FOUND`), and `429` when the caller has too many runs in progress; the user messages of a refused send are kept, so `resend` can run them later.",
      responses: {
        200: runStreamResponse(),
        400: apiErrorResponse(
          400,
          'No message has the role `user` (`INVALID_INPUT`), or the employee does not exist (`AI_EMPLOYEE_NOT_FOUND`).',
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
        413: bodyTooLargeResponse,
        429: runLimitReached,
      },
    }),
    apiValidator('param', ConversationParams),
    runBody,
    apiValidator('json', SendMessagesInput),
    async (context) => {
      const { sessionId } = context.req.valid('param');
      const input = context.req.valid('json');
      await conversations.checkRun({
        kind: 'send',
        actor: context.var.currentUser,
        sessionId,
        aiEmployee: input.aiEmployee,
        messages: input.messages as never,
        messageId: input.messageId ?? input.editingMessageId,
      });
      return createAISSEStreamResponse(context, 'send', (target) =>
        conversations.sendMessages({
          actor: context.var.currentUser,
          aiEmployee: input.aiEmployee,
          messages: input.messages as never,
          stream: true,
          state: parseAgentState(context, sessionId, {
            ...input,
            messageId: input.messageId ?? input.editingMessageId,
          }),
          transport: transport(context, target),
        }),
      );
    },
  );

  app.post(
    '/aiEmployee/conversations/:sessionId/resend',
    signedIn,
    describeRoute({
      tags,
      summary: 'Run a conversation again and stream the answer',
      operationId: 'aiEmployeesResendConversationMessages',
      description:
        "Runs the employee again from `messageId`, or from the latest message. Before the stream opens the request is answered `400` when `messageId` names no message of the conversation (`MESSAGE_NOT_FOUND`), `400 FAILED_PRECONDITION` when the conversation's employee no longer exists (`AI_EMPLOYEE_NOT_FOUND`) or the conversation has no message (`CONVERSATION_EMPTY`), and `429` when the caller has too many runs in progress.",
      responses: {
        200: runStreamResponse(),
        400: apiErrorResponse(
          400,
          "`messageId` names no message of the conversation (`MESSAGE_NOT_FOUND`), or (`FAILED_PRECONDITION`) the conversation's employee no longer exists (`AI_EMPLOYEE_NOT_FOUND`) or the conversation has no message (`CONVERSATION_EMPTY`).",
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
        413: bodyTooLargeResponse,
        429: runLimitReached,
      },
    }),
    apiValidator('param', ConversationParams),
    runBody,
    apiValidator('json', ResendMessagesInput),
    async (context) => {
      const { sessionId } = context.req.valid('param');
      const input = context.req.valid('json');
      await conversations.checkRun({
        kind: 'resend',
        actor: context.var.currentUser,
        sessionId,
        messageId: input.messageId,
      });
      return createAISSEStreamResponse(context, 'resend', (target) =>
        conversations.resendMessages({
          actor: context.var.currentUser,
          stream: true,
          state: parseAgentState(context, sessionId, input),
          transport: transport(context, target),
        }),
      );
    },
  );

  app.post(
    '/aiEmployee/conversations/:sessionId/resumeToolCall',
    signedIn,
    describeRoute({
      tags,
      summary: 'Continue a run after its tool calls and stream the answer',
      operationId: 'aiEmployeesResumeConversationToolCall',
      description:
        "Continues the run of `messageId`, or of the latest message, once its tool calls have a decision or, for frontend tools, a result in `toolCallResults`. Before the stream opens the request is answered `400` when `messageId` names no message of the conversation (`MESSAGE_NOT_FOUND`), and `400 FAILED_PRECONDITION` when the conversation's employee no longer exists (`AI_EMPLOYEE_NOT_FOUND`), the conversation has no message (`CONVERSATION_EMPTY`) or the message has no tool calls (`NO_TOOL_CALLS`).",
      responses: {
        200: runStreamResponse(),
        400: apiErrorResponse(
          400,
          "`messageId` names no message of the conversation (`MESSAGE_NOT_FOUND`), or (`FAILED_PRECONDITION`) the conversation's employee no longer exists (`AI_EMPLOYEE_NOT_FOUND`), the conversation has no message (`CONVERSATION_EMPTY`) or the message has no tool calls (`NO_TOOL_CALLS`).",
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', ConversationParams),
    runBody,
    apiValidator('json', ResumeToolCallInput),
    async (context) => {
      const { sessionId } = context.req.valid('param');
      const input = context.req.valid('json');
      await conversations.checkRun({
        kind: 'resumeToolCall',
        actor: context.var.currentUser,
        sessionId,
        messageId: input.messageId,
      });
      return createAISSEStreamResponse(context, 'resumeToolCall', (target) =>
        conversations.resumeToolCall({
          actor: context.var.currentUser,
          state: parseAgentState(context, sessionId, input),
          transport: transport(context, target),
        }),
      );
    },
  );

  // Replays a run still in progress, such as after the page reloads. It takes no body.
  app.post(
    '/aiEmployee/conversations/:sessionId/resumeStream',
    signedIn,
    describeRoute({
      tags,
      summary: 'Replay the stream of a run in progress',
      operationId: 'aiEmployeesResumeConversationStream',
      description:
        'Replays what the run in progress has streamed so far and follows it to the end, such as after the page reloads. It takes no body.',
      responses: {
        200: runStreamResponse(
          'Nothing is streamed when no run is in progress. When a run is in progress but its frames are no longer cached, the one frame is `{ "type": "chunks_cache_missing", "body": { "llmActiveState": "…" } }`; read the messages once it ends.',
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        404: conversationNotFound,
      },
    }),
    apiValidator('param', ConversationParams),
    async (context) => {
      const { sessionId } = context.req.valid('param');
      await conversations.requireOwnConversation(
        context.var.currentUser.id,
        sessionId,
      );
      return createAISSEStreamResponse(context, 'resumeStream', (target) =>
        conversations.resumeStream({
          actorId: context.var.currentUser.id,
          sessionId,
          transport: transport(context, target),
        }),
      );
    },
  );
}

/** A history page in the standard list shape: newest first, with the token of the next older page while there is one. */
function messagePage(page: GetAIConversationMessagesResult): {
  data: unknown[];
  meta: { nextPageToken?: string };
} {
  return {
    data: page.rows,
    meta:
      page.hasMore && page.cursor ? { nextPageToken: String(page.cursor) } : {},
  };
}

/** The one place a run's request becomes agent state. Nothing downstream reads the body again. */
function parseAgentState(
  context: HonoContext,
  sessionId: string,
  input: AgentStateInput,
): AgentState {
  return {
    sessionId,
    messageId: input.messageId,
    model: input.model,
    webSearch: input.webSearch === true,
    important: input.important,
    frontendTools: input.frontendTools as AgentState['frontendTools'],
    toolCallResults: input.toolCallResults as AgentState['toolCallResults'],
    timezone: input.timezone ?? context.req.header('x-timezone'),
  };
}

function transport(
  context: HonoContext,
  streamTarget?: ConversationStreamTarget,
): ConversationTransport {
  return {
    streamTarget,
    abortSignal: context.req.raw.signal,
    translate: identityTranslate,
    getHeader: (name) => context.req.header(name),
  };
}
