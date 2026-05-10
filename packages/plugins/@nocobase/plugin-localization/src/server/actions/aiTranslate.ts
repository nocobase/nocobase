/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { AsyncTasksManager } from '@nocobase/plugin-async-task-manager';
import { LOCALIZATION_AI_TRANSLATE_TASK_TYPE } from '../tasks/localization-ai-translate';

const aiTranslate = async (ctx: Context, next: Next) => {
  const { mode, locale, employeeUsername = 'lina', model } = ctx.action.params.values || {};
  const currentUserId = ctx.auth?.user?.id || ctx.state?.currentUser?.id;
  if (!['full', 'incremental'].includes(mode)) {
    ctx.throw(400, 'Invalid translation mode');
  }

  const taskManager = ctx.app.container.get('AsyncTaskManager') as AsyncTasksManager;
  if (!taskManager) {
    ctx.throw(500, 'AsyncTaskManager is not available');
  }

  const task = await taskManager.createTask(
    {
      origin: 'localization',
      type: LOCALIZATION_AI_TRANSLATE_TASK_TYPE,
      title: mode === 'full' ? 'AI full localization translation' : 'AI incremental localization translation',
      params: {
        mode,
        locale: locale || ctx.get('X-Locale') || 'en-US',
        employeeUsername,
        model,
        userId: currentUserId,
      },
      createdById: currentUserId,
      cancelable: true,
    },
    {
      useQueue: true,
      context: ctx,
    },
  );

  ctx.body = task.toJSON();
  await next();
};

export default { aiTranslate };
