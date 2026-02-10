/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { evaluateConditions, removeInvalidFilterItems } from '@nocobase/utils/client';

export function evaluateCondition(ctx: any, condition: any): boolean {
  const evaluator = (path: string, operator: string, value: any) => {
    if (!operator) return true;
    return ctx?.app?.jsonLogic?.apply?.({ [operator]: [path, value] });
  };
  try {
    return evaluateConditions(removeInvalidFilterItems(condition), evaluator);
  } catch {
    return false;
  }
}
