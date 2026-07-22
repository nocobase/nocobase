/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import { name as namespace } from '../../../package.json';
import { LLM_SERVICE_MODEL_ID_DUPLICATE, LLM_SERVICE_MODEL_ID_REQUIRED } from '../../common/error-codes';
import { getCustomModelIdIssues, normalizeCustomModelIds } from '../../common/llm-service-models';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const validateAndNormalizeEnabledModels = (ctx: Context) => {
  const values = ctx.action.params.values;
  if (!isRecord(values) || !('enabledModels' in values)) {
    return;
  }

  const enabledModels = normalizeCustomModelIds(values.enabledModels);
  const issue = getCustomModelIdIssues(enabledModels)[0];
  if (issue) {
    const required = issue.type === 'required';
    ctx.throw(400, {
      code: required ? LLM_SERVICE_MODEL_ID_REQUIRED : LLM_SERVICE_MODEL_ID_DUPLICATE,
      message: ctx.t(required ? 'Model ID is required' : 'Model ID already exists', { ns: namespace }),
      data: { index: issue.index },
    });
  }

  ctx.action.mergeParams(
    {
      values: {
        ...values,
        enabledModels,
      },
    },
    { values: 'overwrite' },
  );
};

export const create = async (ctx: Context, next: Next) => {
  validateAndNormalizeEnabledModels(ctx);
  await actions.create(ctx, next);
};

export const update = async (ctx: Context, next: Next) => {
  validateAndNormalizeEnabledModels(ctx);
  await actions.update(ctx, next);
};
