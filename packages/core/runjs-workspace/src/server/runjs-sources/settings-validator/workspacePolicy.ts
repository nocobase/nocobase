/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_KEY_PATTERN } from '@nocobase/js-template-sdk/schema';

const entryKeyPattern = new RegExp(LIGHT_EXTENSION_ENTRY_KEY_PATTERN);

export function isValidEntryName(value: string): boolean {
  return entryKeyPattern.test(value);
}
