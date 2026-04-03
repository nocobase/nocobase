/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';
import PluginAIServer from '../../server';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Web search")}}',
    about: '{{t("Use web search to quickly find up-to-date information from the internet.")}}',
  },
  definition: {
    name: 'subAgentWebSearch',
    description: 'Use the query to search the web and return concise, relevant findings with source links.',
    schema: z.object({
      query: z.array(z.string(), 'A clear and specific web search query describing the information to retrieve.'),
    }),
  },
  invoke: async (ctx: Context, args: { query: string[] }, id) => {
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
    });
    if (!args.query?.length) {
      return {
        status: 'success',
        content: 'Web search not invoke correctly. There is no query parameters provided',
      };
    }

    const running = args.query.map((query) =>
      provider
        .invoke(
          {
            messages: [
              {
                role: 'user',
                content: query,
              },
            ],
          },
          {
            tags: ['langsmith:nostream'],
          },
        )
        .then((content) => content.text as string)
        .then((result) => ({ query, result })),
    );

    const result = await Promise.all(running);
    return {
      status: 'success',
      content: result,
    };
  },
});
