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
import type { TranslationReferenceLocales, TranslationScope } from '../tasks/localization-ai-translate';

const validateParams = (ctx: Context) => {
  const {
    mode,
    locale,
    employeeUsername = 'lina',
    model,
    textIds,
    scope = 'all',
    referenceLocales,
  } = ctx.action.params.values || {};
  if (!['full', 'incremental', 'selected'].includes(mode)) {
    ctx.throw(400, 'Invalid translation mode');
  }
  if (!['all', 'builtIn', 'custom'].includes(scope)) {
    ctx.throw(400, 'Invalid translation scope');
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
    scope: scope as TranslationScope,
    referenceLocales: referenceLocales as TranslationReferenceLocales,
  };
};

const getModuleName = (row: any) => row?.module?.replace('resources.', '');

const isBuiltInText = (row: any, resources: Record<string, Record<string, string>>) => {
  const moduleName = getModuleName(row);
  return Boolean(moduleName && resources[moduleName]?.[row.text] !== undefined);
};

const hasBuiltInTranslation = (row: any, resources: Record<string, Record<string, string>>) => {
  const moduleName = getModuleName(row);
  const translation = moduleName ? resources[moduleName]?.[row.text] : undefined;
  return translation !== undefined && translation !== '';
};

const matchesScope = (row: any, resources: Record<string, Record<string, string>>, scope: TranslationScope) => {
  if (scope === 'all') {
    return true;
  }
  const isBuiltIn = isBuiltInText(row, resources);
  return scope === 'builtIn' ? isBuiltIn : !isBuiltIn;
};

const buildFindTextsOptions = (mode: string, locale: string, textIds?: Array<string | number>) => {
  const options: any = {};

  if (mode === 'selected' || textIds) {
    options.filter = {
      ...(options.filter || {}),
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

const resolveTextIdsByScope = async (
  ctx: Context,
  mode: string,
  locale: string,
  scope: TranslationScope,
  textIds?: Array<string | number>,
) => {
  if (scope === 'all' && mode !== 'incremental') {
    return textIds;
  }
  const builtInResources = await ctx.app.localeManager.getBuiltInResources('en-US');
  const targetBuiltInResources =
    mode === 'incremental' ? await ctx.app.localeManager.getBuiltInResources(locale) : undefined;
  const resolvedTextIds: Array<string | number> = [];
  const options: any = {
    fields: ['id', 'text', 'module'],
    sort: ['id'],
    chunkSize: 500,
  };
  if (textIds) {
    options.filter = {
      id: {
        $in: textIds,
      },
    };
  }
  await ctx.db.getRepository('localizationTexts').chunkWithCursor({
    ...options,
    callback: async (rows) => {
      for (const row of rows) {
        const record = typeof row.toJSON === 'function' ? row.toJSON() : row;
        if (
          matchesScope(record, builtInResources, scope) &&
          !(targetBuiltInResources && hasBuiltInTranslation(record, targetBuiltInResources))
        ) {
          resolvedTextIds.push(record.id);
        }
      }
    },
  });
  return resolvedTextIds;
};

const countTexts = async (
  ctx: Context,
  mode: string,
  locale: string,
  scope: TranslationScope,
  textIds?: Array<string | number>,
) => {
  const effectiveTextIds = await resolveTextIdsByScope(ctx, mode, locale, scope, textIds);
  return await ctx.db.getRepository('localizationTexts').count(buildFindTextsOptions(mode, locale, effectiveTextIds));
};

const getScopeTitle = (scope: TranslationScope) => {
  return {
    all: 'All entries',
    builtIn: 'Built-in entries',
    custom: 'Custom entries',
  }[scope];
};

const getTaskTitle = (mode: string, scope: TranslationScope, locale: string) => {
  if (mode === 'selected') {
    return `AI ${mode} localization translation - ${locale}`;
  }
  return `AI ${mode} localization translation - ${getScopeTitle(scope)} - ${locale}`;
};

const getAITranslatePreview = async (ctx: Context) => {
  const { mode, locale, employeeUsername, model, scope, referenceLocales, textIds } = validateParams(ctx);
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
  const count = await countTexts(ctx, mode, locale, scope, textIds);

  return {
    mode,
    locale,
    scope,
    referenceLocales,
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
  const { mode, locale, employeeUsername, model, textIds, scope, referenceLocales } = validateParams(ctx);
  const currentUserId = ctx.auth?.user?.id || ctx.state?.currentUser?.id;

  const taskManager = ctx.app.container.get('AsyncTaskManager') as AsyncTasksManager;
  if (!taskManager) {
    ctx.throw(500, 'AsyncTaskManager is not available');
  }

  const task = await taskManager.createTask(
    {
      origin: 'localization',
      type: LOCALIZATION_AI_TRANSLATE_TASK_TYPE,
      title: getTaskTitle(mode, scope, locale),
      params: {
        mode,
        locale,
        employeeUsername,
        model,
        userId: currentUserId,
        textIds,
        scope,
        referenceLocales,
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
