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
import PluginAIServer from '@nocobase/plugin-ai';
import { LOCALIZATION_AI_TRANSLATE_TASK_TYPE } from '../tasks/localization-ai-translate';

const validateParams = (ctx: Context) => {
  const { mode, locale, employeeUsername = 'lina', model, textIds } = ctx.action.params.values || {};
  if (!['full', 'incremental', 'selected'].includes(mode)) {
    ctx.throw(400, 'Invalid translation mode');
  }
  if (mode === 'selected' && (!Array.isArray(textIds) || !textIds.length)) {
    ctx.throw(400, 'Please select the records you want to translate');
  }
  return {
    mode,
    locale: locale || ctx.get('X-Locale') || 'en-US',
    employeeUsername,
    model,
    textIds,
  };
};

const buildFindTextsOptions = (mode: string, locale: string, textIds?: Array<string | number>) => {
  const options: any = {};

  if (mode === 'selected') {
    options.filter = {
      id: {
        $in: textIds || [],
      },
    };
  }

  if (mode === 'incremental') {
    options.include = [{ association: 'translations', where: { locale }, required: false }];
    options.where = {
      '$translations.id$': null,
    };
  }

  return options;
};

const getAITranslatePreview = async (ctx: Context) => {
  const { mode, locale, employeeUsername, model, textIds } = validateParams(ctx);
  const aiPlugin = ctx.app.pm.get('ai') as PluginAIServer;
  if (!aiPlugin?.aiEmployeesManager) {
    ctx.throw(500, 'AI plugin is not available');
  }

  const employee = await aiPlugin.aiEmployeesManager.getEmployee(employeeUsername);
  if (!employee) {
    ctx.throw(400, `AI employee "${employeeUsername}" not found`);
  }
  const resolvedModel = await aiPlugin.aiEmployeesManager.resolveModel(employee, model);
  const { model: modelName, service } = await aiPlugin.aiManager.getLLMService(resolvedModel);
  const providerMeta = aiPlugin.aiManager.llmProviders.get(service.provider);
  const count = await ctx.db.getRepository('localizationTexts').count(buildFindTextsOptions(mode, locale, textIds));

  return {
    mode,
    locale,
    count,
    provider: service.provider,
    providerTitle: providerMeta?.title,
    llmService: service.name,
    llmServiceTitle: service.title,
    model: modelName,
  };
};

const aiTranslatePreview = async (ctx: Context, next: Next) => {
  ctx.body = await getAITranslatePreview(ctx);
  await next();
};

const aiTranslate = async (ctx: Context, next: Next) => {
  const { mode, locale, employeeUsername, model, textIds } = validateParams(ctx);
  const currentUserId = ctx.auth?.user?.id || ctx.state?.currentUser?.id;

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
        locale,
        employeeUsername,
        model,
        userId: currentUserId,
        textIds,
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

export default { aiTranslate, aiTranslatePreview };
