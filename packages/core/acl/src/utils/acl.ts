/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { assign } from '@nocobase/utils';
import _ from 'lodash';

export function mergeAclActionParams(sourceParams, targetParams) {
  if (_.isEmpty(sourceParams) || _.isEmpty(targetParams)) {
    return {};
  }

  // source 和 target 其中之一没有 fields 字段时, 最终希望没有此字段，只删除 sourceKey, 是因为 assign 遍历的 sourceKey
  adaptAssignParams(sourceParams, targetParams, ['fields', 'whitelist', 'appends']);

  const mergedParams = assign(targetParams, sourceParams, {
    own: (x, y) => x || y,
    filter: (x, y) => {
      if (_.isEmpty(x) || _.isEmpty(y)) {
        return {};
      }
      const xHasOr = _.has(x, '$or'),
        yHasOr = _.has(y, '$or');
      if (xHasOr && !yHasOr) {
        return { $or: [...x.$or, y] };
      }

      if (!xHasOr && yHasOr) {
        return { $or: [x, ...y.$or] };
      }

      if (xHasOr && yHasOr) {
        return { $or: [...x.$or, ...y.$or] };
      }

      return { $or: [x, y] };
    },
    fields: 'union',
    whitlist: 'union',
    appends: 'union',
  });
  return mergedParams;
}

function adaptAssignParams(source, target, keys: string[]) {
  for (const key of keys) {
    if (_.has(source, key) && !_.has(target, key)) {
      delete source.fields;
    }
  }
}
