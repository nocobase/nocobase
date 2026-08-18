/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_KEY_PATTERN } from '../../../../js-template/schema';

const entryKeyPattern = new RegExp(JS_TEMPLATE_KEY_PATTERN);

export function isValidEntryName(value: string): boolean {
  return entryKeyPattern.test(value);
}
