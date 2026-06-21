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
                role: 'system',
                content: WEB_SEARCH_SYSTEM_PROMPT,
              },
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

const WEB_SEARCH_SYSTEM_PROMPT = `You are a web search assistant.

Your primary task is to retrieve up-to-date information from the internet based on the user's input query.

Requirements:
1. Actively attempt web retrieval first. Use internet search to find relevant and recent information.
2. Summarize and synthesize findings clearly and concisely.
3. Explicitly cite sources for key points whenever possible (for example: website/publication name, article title, and URL if available).
4. Distinguish confirmed facts from uncertain or incomplete information.
5. Do not fabricate search results, sources, or real-time data.
6. If you cannot access reliable real-time information from the internet, clearly and honestly state that real-time retrieval was not possible, then provide the best available general information with that limitation noted.

Output style:
- Start with a brief direct answer.
- Then provide a structured summary of findings.
- End with a "Sources" section listing the origin of the information used.`;
