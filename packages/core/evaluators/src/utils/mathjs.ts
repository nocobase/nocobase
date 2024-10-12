/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as math from 'mathjs';

import { evaluate } from '.';

export default evaluate.bind(
  function (expression: string, scope = {}) {
    const result = math.evaluate(expression, scope);
    if (typeof result === 'number') {
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return null;
      }
      return math.round(result, 9);
    }
    if (result instanceof math.Matrix) {
      return result.toArray();
    }
    return result;
  },
  { replaceKey: true },
);
