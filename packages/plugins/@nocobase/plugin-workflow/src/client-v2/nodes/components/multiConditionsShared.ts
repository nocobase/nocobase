/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomId } from '@nocobase/flow-engine';

export const MULTI_CONDITION_BRANCH_INDEX = {
  DEFAULT: 1,
  OTHERWISE: 0,
} as const;

export type MultiConditionConfigItem = {
  uid: string;
  title?: string;
  engine?: string;
  calculation?: any;
  expression?: string;
};

export function createEmptyMultiCondition(): MultiConditionConfigItem {
  return {
    uid: randomId(),
  };
}
