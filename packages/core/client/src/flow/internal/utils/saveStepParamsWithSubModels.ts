/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const SAVE_STEP_PARAMS_WITH_SUB_MODELS_FLAG = '__saveStepParamsWithSubModels' as const;

export function markSaveStepParamsWithSubModels(model: unknown) {
  if (!model || (typeof model !== 'object' && typeof model !== 'function')) {
    throw new Error('[saveStepParamsWithSubModels] model is not an object');
  }
  (model as any)[SAVE_STEP_PARAMS_WITH_SUB_MODELS_FLAG] = true;
}

export async function saveStepParamsWithSubModelsIfNeeded<T>(model: unknown, fallback: () => Promise<T>): Promise<T> {
  if (!model || (typeof model !== 'object' && typeof model !== 'function')) {
    throw new Error('[saveStepParamsWithSubModels] model is not an object');
  }
  const record = model as any;

  const shouldSaveSubModels = record[SAVE_STEP_PARAMS_WITH_SUB_MODELS_FLAG] === true;
  if (!shouldSaveSubModels) {
    return await fallback();
  }

  if (typeof record.save !== 'function') {
    throw new Error('[saveStepParamsWithSubModels] model.save is not a function');
  }

  try {
    // full save (including subModels) to persist migrated field-level settings cleanup
    return await record.save();
  } finally {
    delete record[SAVE_STEP_PARAMS_WITH_SUB_MODELS_FLAG];
  }
}
