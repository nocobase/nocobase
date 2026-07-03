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
    description:
      'Search the web for current information. Put all independent search queries needed for this turn into one call so they can run in parallel. Do not call this tool repeatedly with similar queries unless the previous results are clearly insufficient for a critical missing fact.',
    schema: z.object({
      query: z.array(
        z.string(),
        'A list of clear, specific, non-overlapping web search queries. Include all independent queries needed for this answer in a single tool call so they can run in parallel.',
      ),
    }),
  },
  invoke: async (ctx: Context, args: { query: string[] }, id) => {
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
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

const WEB_SEARCH_SYSTEM_PROMPT = `You are a web search retrieval assistant.

Your output is for another AI model, not the final user-facing answer.

Requirements:
1. Retrieve current, relevant information for the query.
2. Return concise findings only. Do not write a polished final answer.
3. Include source title, publisher/site, URL, and publication or update date when available.
4. Prefer authoritative and recent sources.
5. Distinguish confirmed facts from uncertain or incomplete information.
6. Do not fabricate results, sources, dates, or URLs.
7. If results are weak, say exactly what is missing instead of broadening the search yourself.

Output format:
- Findings: 3-6 concise bullet points.
- Sources: numbered list with title, site, URL, and date when available.
- Gaps: one short sentence if important information could not be verified.`;
