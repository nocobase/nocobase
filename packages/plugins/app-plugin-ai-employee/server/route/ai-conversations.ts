import type { AgentState } from '@nocobase/ai-employee';
import { parseApiInput } from '@nocobase/app-server/router';
import type { Context as HonoContext, Hono } from 'hono';
import { validator } from 'hono/validator';

import type { ConversationTransport } from '../agent/contracts.js';
import type { ServiceFactory } from '../factory/service-factory.js';
import type { GetAIConversationMessagesResult } from '../manager/ai-conversations-manager.js';
import type { ConversationStreamTarget } from '../types.js';
import { identityTranslate } from '../types.js';
import type { AIRouteGuards } from './settings-access.js';
import {
  ConversationOptionsInput,
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

/**
 * Conversations. `/aiEmployee/conversations` is the signed-in user's own chat; `/aiEmployee/managedConversations` and
 * `/aiEmployee/conversationOwners` are the conversation center, which reads every user's conversations and needs AI
 * settings access. They are separate resources because who may read them, and what a row carries, differ.
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
    settings,
    validator('query', (value) =>
      parseApiInput(ManagedConversationsQuery, value),
    ),
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
    settings,
    validator('param', (value) =>
      parseApiInput(ManagedConversationParams, value),
    ),
    validator('query', (value) => parseApiInput(MessagesQuery, value)),
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
    settings,
    validator('query', (value) =>
      parseApiInput(ConversationOwnersQuery, value),
    ),
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
    validator('query', (value) => parseApiInput(ConversationsQuery, value)),
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
    jsonBody,
    validator('json', (value) => parseApiInput(CreateConversationInput, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(UpdateConversationInput, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
    jsonBody,
    validator('json', (value) =>
      parseApiInput(ConversationOptionsInput, value),
    ),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
    validator('query', (value) => parseApiInput(MessagesQuery, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
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
    validator('param', (value) => parseApiInput(ToolCallParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(UserDecisionInput, value)),
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
    validator('param', (value) => parseApiInput(ToolCallParams, value)),
    jsonBody,
    validator('json', (value) => parseApiInput(ToolCallArgsInput, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
    runBody,
    validator('json', (value) => parseApiInput(SendMessagesInput, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
    runBody,
    validator('json', (value) => parseApiInput(ResendMessagesInput, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
    runBody,
    validator('json', (value) => parseApiInput(ResumeToolCallInput, value)),
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
    validator('param', (value) => parseApiInput(ConversationParams, value)),
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
