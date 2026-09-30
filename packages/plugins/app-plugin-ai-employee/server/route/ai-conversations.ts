import type { ServiceFactory } from '../factory/service-factory.js';
import type { Context as HonoContext, Hono } from 'hono';
import type { AgentState } from '@nocobase/ai-employee';
import type { ConversationTransport } from '../agent/contracts.js';
import type { ConversationStreamTarget } from '../types.js';
import { identityTranslate, ResourceActionError } from '../types.js';
import { requireConversationReadAccess } from '../service/utils.js';
import { createAISSEStreamResponse, requiredString } from './utils.js';

export function createAIConversationsRouter(
  app: Hono,
  services: ServiceFactory,
): void {
  app.get('/aiConversations:list', async (context) => {
    const actor = context.var.currentUser;
    const result = await services.conversationService.list({
      actorId: actor.id,
      scope: actor.scope,
      options: {
        keyword: context.req.query('keyword') || undefined,
      },
    });
    return context.json(result as never);
  });

  app.get('/aiConversations:listAll', async (context) => {
    requireConversationReadAccess(context.var.conversationManagementActor);
    validateSingleQueries(context, [
      'keyword',
      'userId',
      'aiEmployeeUsername',
      'page',
      'pageSize',
    ]);
    const result = await services.conversationService.listAll({
      actor: context.var.conversationManagementActor,
      keyword: context.req.query('keyword'),
      userId: context.req.query('userId'),
      aiEmployeeUsername: context.req.query('aiEmployeeUsername'),
      page: paginationQuery(context, 'page', 1),
      pageSize: paginationQuery(context, 'pageSize', 20),
    });
    return context.json(result as never);
  });

  app.get('/aiConversations:listUsers', async (context) => {
    requireConversationReadAccess(context.var.conversationManagementActor);
    validateSingleQueries(context, ['keyword', 'userId', 'limit']);
    const result = await services.conversationService.listConversationUsers({
      actor: context.var.conversationManagementActor,
      keyword: context.req.query('keyword'),
      userId: context.req.query('userId'),
      limit: paginationQuery(context, 'limit', 20),
    });
    return context.json(result as never);
  });

  app.get('/aiConversations:getAllMessages', async (context) => {
    requireConversationReadAccess(context.var.conversationManagementActor);
    validateSingleQueries(context, ['sessionId', 'cursor']);
    const result = await services.conversationService.getAllMessages({
      actor: context.var.conversationManagementActor,
      sessionId: requiredQuery(context, 'sessionId'),
      cursor: context.req.query('cursor'),
    });
    return context.json(result as never);
  });

  app.get('/aiConversations:unreadCounts', async (context) => {
    const result = await services.conversationService.unreadCounts({
      actorId: context.var.currentUser.id,
    });
    return context.json(result as never);
  });

  app.get('/aiConversations:unreadCount', async (context) => {
    const result = (
      await services.conversationService.unreadCounts({
        actorId: context.var.currentUser.id,
      })
    ).conversationUnreadCount;
    return context.json(result as never);
  });

  app.get('/aiConversations:getMessages', async (context) => {
    const result = await services.conversationService.getMessages({
      actorId: context.var.currentUser.id,
      options: {
        sessionId: requiredQuery(context, 'sessionId'),
        cursor: context.req.query('cursor') || undefined,
        paginate: context.req.query('paginate') !== 'false',
        updateRead: context.req.query('updateRead') === 'true',
      },
    });
    return context.json(result as never);
  });

  app.get('/aiConversations:get', async (context) => {
    const result = await services.conversationService.getActiveState({
      actorId: context.var.currentUser.id,
      sessionId: requiredQuery(context, 'sessionId'),
    });
    return context.json(result as never);
  });

  app.post('/aiConversations:create', async (context) => {
    const result = await services.conversationService.create({
      actorId: context.var.currentUser.id,
      input: await jsonObject(context),
    });
    return context.json(result as never);
  });

  app.put('/aiConversations:update', async (context) => {
    const result = await services.conversationService.update({
      actorId: context.var.currentUser.id,
      sessionId: requiredQuery(context, 'sessionId'),
      input: await jsonObject(context),
    });
    return context.json(result as never);
  });

  app.put('/aiConversations:updateOptions', async (context) => {
    const result = await services.conversationService.updateOptions({
      actorId: context.var.currentUser.id,
      sessionId: requiredQuery(context, 'sessionId'),
      input: await jsonObject(context),
    });
    return context.json(result as never);
  });

  app.delete('/aiConversations:destroy', async (context) => {
    const result = await services.conversationService.destroy({
      actorId: context.var.currentUser.id,
      options: { sessionId: requiredQuery(context, 'sessionId') },
    });
    return context.json(result as never);
  });

  app.post('/aiConversations:sendMessages', async (context) =>
    createConversationSSE(
      context,
      'aiConversations:sendMessages',
      (input, target) =>
        services.conversationService.sendMessages({
          actor: context.var.currentUser,
          aiEmployee: input.aiEmployee,
          messages: Array.isArray(input.messages) ? input.messages : undefined,
          stream: input.stream !== false,
          state: parseAgentState(context, input),
          transport: transport(context, target),
        }),
    ),
  );

  app.post('/aiConversations:resendMessages', async (context) =>
    createConversationSSE(
      context,
      'aiConversations:resendMessages',
      (input, target) =>
        services.conversationService.resendMessages({
          actor: context.var.currentUser,
          stream: input.stream !== false,
          state: parseAgentState(context, input),
          transport: transport(context, target),
        }),
    ),
  );

  app.post('/aiConversations:updateUserDecision', async (context) => {
    const input = await jsonObject(context);
    const result = await services.conversationService.updateUserDecision({
      actor: context.var.currentUser,
      messageId: input.messageId,
      toolCallId: input.toolCallId,
      userDecision: input.userDecision,
      state: parseAgentState(context, input),
      transport: transport(context),
    });
    return context.json(result as never);
  });

  app.post('/aiConversations:resumeToolCall', async (context) =>
    createConversationSSE(
      context,
      'aiConversations:resumeToolCall',
      (input, target) =>
        services.conversationService.resumeToolCall({
          actor: context.var.currentUser,
          state: parseAgentState(context, input),
          transport: transport(context, target),
        }),
    ),
  );

  app.post('/aiConversations:resumeStream', async (context) =>
    createConversationSSE(
      context,
      'aiConversations:resumeStream',
      (input, target) =>
        services.conversationService.resumeStream({
          actorId: context.var.currentUser.id,
          sessionId: requiredString(input.sessionId, 'sessionId'),
          transport: transport(context, target),
        }),
    ),
  );

  app.post('/aiConversations:abort', async (context) => {
    const input = await jsonObject(context);
    const result = await services.conversationService.abort({
      actorId: context.var.currentUser.id,
      input: { sessionId: requiredString(input.sessionId, 'sessionId') },
    });
    return context.json(result as never);
  });

  app.post('/aiConversations:updateToolArgs', async (context) => {
    const result = await services.conversationService.updateToolArgs({
      actorId: context.var.currentUser.id,
      input: await jsonObject(context),
    });
    return context.json(result as never);
  });
}

function createConversationSSE(
  context: HonoContext,
  action: string,
  handler: (
    input: Record<string, any>,
    target: ConversationStreamTarget,
  ) => unknown | Promise<unknown>,
): Response {
  return createAISSEStreamResponse(context, action, async (target) =>
    handler(await jsonObject(context), target),
  );
}

async function jsonObject(context: HonoContext): Promise<Record<string, any>> {
  const value = await context.req.json<unknown>();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('JSON body must be an object');
  }
  return value as Record<string, any>;
}

function requiredQuery(context: HonoContext, name: string): string {
  return requiredString(context.req.query(name), name);
}

function validateSingleQueries(context: HonoContext, names: string[]): void {
  for (const name of names) {
    if ((context.req.queries(name)?.length ?? 0) > 1) {
      throw new ResourceActionError(400, `Invalid ${name}`);
    }
  }
}

function paginationQuery(
  context: HonoContext,
  name: string,
  fallback: number,
): number {
  const value = context.req.query(name);
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new ResourceActionError(400, `Invalid ${name}`);
  }
  return Number(value);
}

/**
 * The one place a conversation request body becomes agent state. Nothing
 * downstream reads the body again.
 */
function parseAgentState(
  context: HonoContext,
  input: Record<string, any>,
): AgentState {
  return {
    sessionId: requiredString(input.sessionId, 'sessionId'),
    messageId:
      typeof input.messageId === 'string'
        ? input.messageId
        : typeof input.editingMessageId === 'string'
          ? input.editingMessageId
          : undefined,
    model:
      typeof input.model?.llmService === 'string' &&
      typeof input.model?.model === 'string'
        ? { llmService: input.model.llmService, model: input.model.model }
        : undefined,
    webSearch: input.webSearch === true,
    important:
      typeof input.important === 'string' ? input.important : undefined,
    frontendTools: Array.isArray(input.frontendTools)
      ? input.frontendTools
      : undefined,
    toolCallResults: Array.isArray(input.toolCallResults)
      ? input.toolCallResults
      : undefined,
    timezone:
      typeof input.timezone === 'string'
        ? input.timezone
        : context.req.header('x-timezone'),
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
