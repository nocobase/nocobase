/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMiddleware } from 'langchain';
import z from 'zod';
import { AIEmployee } from '../ai-employee';

export const systemPromptMiddleware = (aiEmployee: AIEmployee) => {
  return createMiddleware({
    name: 'SystemPromptMiddleware',
    contextSchema: z.object({
      ctx: z.any(),
    }),
    wrapModelCall: async (request, handler) => {
      return handler(request);
    },
  });
};
