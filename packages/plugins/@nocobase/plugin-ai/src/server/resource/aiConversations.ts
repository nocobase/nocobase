/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import snowflake from '../snowflake';
import PluginAIServer from '../plugin';
import { Model } from '@nocobase/database';
import { convertUiSchemaToJsonSchema } from '../utils';

export default {
  name: 'aiConversations',
  actions: {
    async list(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }
      ctx.action.mergeParams({
        filter: {
          userId,
        },
      });
      return actions.list(ctx, next);
    },
    async create(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      const { aiEmployees } = ctx.action.params.values || {};
      const repo = ctx.db.getRepository('aiConversations');
      ctx.body = await repo.create({
        values: {
          title: 'New Conversation',
          userId,
          aiEmployees,
        },
      });
      await next();
    },
    async destroy(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }
      ctx.action.mergeParams({
        filter: {
          userId,
        },
      });
      return actions.destroy(ctx, next);
    },
    async getMessages(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }
      const { sessionId } = ctx.action.params || {};
      if (!sessionId) {
        ctx.throw(400);
      }
      const conversation = await ctx.db.getRepository('aiConversations').findOne({
        filter: {
          sessionId,
          userId,
        },
      });
      if (!conversation) {
        ctx.throw(400);
      }
      const rows = await ctx.db.getRepository('aiConversations.messages', sessionId).find({
        sort: ['-messageId'],
        limit: 10,
      });
      ctx.body = rows.map((row: Model) => ({
        messageId: row.messageId,
        role: row.role,
        content: {
          title: row.title,
          content: row.content,
          type: row.type,
        },
      }));
      await next();
    },
    async sendMessages(ctx: Context, next: Next) {
      ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const { sessionId, aiEmployee, messages } = ctx.action.params.values || {};
      if (!sessionId) {
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'sessionId is required' })}\n\n`);
        ctx.res.end();
        return next();
      }
      const userMessage = messages.find((message: any) => message.role === 'user');
      if (!userMessage) {
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'user message is required' })}\n\n`);
        ctx.res.end();
        return next();
      }
      const conversation = await ctx.db.getRepository('aiConversations').findOne({
        filterByTk: sessionId,
      });
      if (!conversation) {
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'conversation not found' })}\n\n`);
        ctx.res.end();
        return next();
      }
      const employee = await ctx.db.getRepository('aiEmployees').findOne({
        filter: {
          username: aiEmployee,
        },
      });
      if (!employee) {
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'AI employee not found' })}\n\n`);
        ctx.res.end();
        return next();
      }
      const modelSettings = employee.modelSettings;
      if (!modelSettings?.llmService) {
        ctx.log.error('llmService not configured');
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
        ctx.res.end();
        return next();
      }
      const service = await ctx.db.getRepository('llmServices').findOne({
        filter: {
          name: modelSettings.llmService,
        },
      });
      if (!service) {
        ctx.log.error('llmService not found');
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
        ctx.res.end();
        return next();
      }
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const providerOptions = plugin.aiManager.llmProviders.get(service.provider);
      if (!providerOptions) {
        ctx.log.error('llmService provider not found');
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
        ctx.res.end();
        return next();
      }

      try {
        await ctx.db.getRepository('aiConversations.messages', sessionId).create({
          values: messages.map((message: any) => ({
            messageId: snowflake.generate(),
            role: message.role,
            content: message.content.content,
            type: message.content.type,
            title: message.content.title,
          })),
        });
      } catch (err) {
        ctx.log.error(err);
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
        ctx.res.end();
        return next();
      }
      ctx.status = 200;
      const userMessages = [];
      for (const msg of messages) {
        if (msg.role !== 'user') {
          continue;
        }
        let content = msg.content.content;
        if (msg.content.type === 'uiSchema') {
          const uiSchemaRepo = ctx.db.getRepository('uiSchemas');
          const schema = await uiSchemaRepo.getJsonSchema(content);
          content = JSON.stringify(convertUiSchemaToJsonSchema(schema));
        }
        userMessages.push({
          role: 'user',
          content,
        });
      }
      const msgs = [
        {
          role: 'system',
          content: employee.about,
        },
        ...userMessages,
      ];
      const Provider = providerOptions.provider;
      const provider = new Provider({
        app: ctx.app,
        serviceOptions: service.options,
        chatOptions: {
          ...modelSettings,
          messages: msgs,
        },
      });
      let stream: any;
      try {
        stream = await provider.stream();
      } catch (err) {
        ctx.log.error(err);
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
        ctx.res.end();
        return next();
      }
      let message = '';
      for await (const chunk of stream) {
        if (!chunk.content) {
          continue;
        }
        message += chunk.content;
        ctx.res.write(`data: ${JSON.stringify({ type: 'content', body: chunk.content })}\n\n`);
      }
      await ctx.db.getRepository('aiConversations.messages', sessionId).create({
        values: {
          messageId: snowflake.generate(),
          role: aiEmployee,
          content: message,
          type: 'text',
        },
      });
      ctx.res.end();
      await next();
    },
  },
};
