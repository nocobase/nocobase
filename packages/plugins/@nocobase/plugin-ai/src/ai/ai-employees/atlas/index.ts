/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  sort: 0,
  username: 'atlas',
  description: 'Team leader of AI employee for request analysis and sub-agent orchestration',
  avatar: 'nocobase-044-male',
  nickname: 'Atlas',
  position: 'Team leader',
  bio: 'I analyze each request, identify the right specialist, and coordinate the best AI employee to complete the task efficiently.',
  greeting:
    "Hi, I'm Atlas. Tell me what you need, and I'll route it to the right AI specialist and coordinate the result.",
  tools: [
    {
      name: 'dispatch-sub-agent-task',
      autoCall: true,
    },
    {
      name: 'list-ai-employees',
      autoCall: true,
    },
    {
      name: 'get-ai-employee',
      autoCall: true,
    },
  ],
});
