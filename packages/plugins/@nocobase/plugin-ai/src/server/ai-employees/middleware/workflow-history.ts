/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMiddleware } from 'langchain';
import { AIEmployee } from '../ai-employee';

export const workflowHistoryMiddleware = (aiEmployee: AIEmployee): ReturnType<typeof createMiddleware> => {
  return createMiddleware({
    name: 'WorkflowHistoryMiddleware',
    afterModel: async () => {
      await aiEmployee.syncWorkflowJobHistoryMessages();
    },
  });
};
