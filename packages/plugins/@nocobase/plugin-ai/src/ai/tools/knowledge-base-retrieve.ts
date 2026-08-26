/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineTools } from '@nocobase/ai';
import { z } from 'zod';
import { getAIPlugin } from './sub-agents/shared';
// @ts-ignore
import pkg from '../../../package.json';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("Knowledge base retrieval", { ns: "${pkg.name}" })}}`,
    about: `{{t("Retrieve relevant content from the knowledge base.", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'knowledge-base-retrieve',
    description:
      'Search the knowledge base when you need to extract retrieval queries from the conversation, verify data returned by other tools against the knowledge base, or look up information derived from user-uploaded files.',
    schema: z.object({
      query: z
        .string()
        .describe(
          'A concise retrieval query distilled from the conversation, tool outputs, or user-uploaded file content to search the knowledge base.',
        ),
    }),
  },
  async invoke(ctx, { query }, runtime) {
    const toolCallId = runtime?.toolCallId;
    if (!toolCallId) {
      throw new Error('Missing tool call context');
    }

    const aiToolMessage = await ctx.db.getRepository('aiToolMessages').findOne({
      filter: {
        toolCallId,
      },
    });
    if (!aiToolMessage?.sessionId) {
      throw new Error(`AI tool message not found for tool call "${toolCallId}"`);
    }

    const aiConversation = await ctx.db.getRepository('aiConversations').findOne({
      filter: {
        sessionId: aiToolMessage.sessionId,
      },
    });
    const username = aiConversation?.aiEmployeeUsername;
    if (!username) {
      throw new Error(`AI conversation not found for session "${aiToolMessage.sessionId}"`);
    }

    const plugin = getAIPlugin(ctx);
    const content = await plugin.knowledgeBaseManager.retrievePrompt({
      username,
      query,
    });
    return {
      status: 'success',
      content,
    };
  },
});
