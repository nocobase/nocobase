/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

import { DEFAULT_COLLECTION_BLOCK_COMMON_TEMPLATE_FILES } from './default-template-collection-block-common';
import { DEFAULT_COLLECTION_DISPLAY_BLOCK_TEMPLATE_FILES } from './default-template-collection-display-blocks';
import { DEFAULT_COLLECTION_FORM_BLOCK_TEMPLATE_FILES } from './default-template-collection-form-blocks';

export const DEFAULT_COLLECTION_BLOCK_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  ...DEFAULT_COLLECTION_BLOCK_COMMON_TEMPLATE_FILES,
  ...DEFAULT_COLLECTION_FORM_BLOCK_TEMPLATE_FILES,
  ...DEFAULT_COLLECTION_DISPLAY_BLOCK_TEMPLATE_FILES,
];
