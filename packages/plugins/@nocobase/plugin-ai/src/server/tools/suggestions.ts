/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { z } from 'zod';
import { ToolOptions } from '../manager/tool-manager';

export const suggestions: ToolOptions = {
  name: 'suggestions',
  title: '{{t("Suggestions")}}',
  description: '{{t("Provide a list of suggested prompts for the user to choose from.")}}',
  schema: z.object({
    options: z
      .array(z.string())
      .describe(
        'A list of suggested prompts that can be presented to the user as selectable options.' +
          'Each option represents a possible next user message.',
      ),
  }),
  invoke: async (ctx: Context, _args, id) => {
    const { messageId, args } = ctx.action?.params?.values || {};
    if (messageId) {
      const messageRepo = ctx.app.db.getRepository('aiMessages');
      const message = await messageRepo.findOne({
        filterByTk: messageId,
      });
      const toolCalls = message?.toolCalls || [];
      const index = toolCalls.findIndex((toolCall: { id: string }) => toolCall.id === id);
      if (index !== -1) {
        toolCalls[index] = {
          ...toolCalls[index],
          selectedSuggestion: args?.option,
        };
        await messageRepo.update({
          filter: { messageId },
          values: {
            toolCalls,
          },
        });
      }
    }

    return {
      status: 'success',
      content: args?.option,
    };
  },
};
