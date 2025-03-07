/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import _ from 'lodash';

export function mergeOptions(fieldOptions, modelOptions) {
  const newOptions = {
    ...fieldOptions,
    ...modelOptions,
  };

  for (const key of Object.keys(modelOptions)) {
    if (modelOptions[key] === null && fieldOptions[key]) {
      newOptions[key] = fieldOptions[key];
    }
  }
  return newOptions;
}
