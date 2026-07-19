/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export const lightExtensionEntryV1SchemaFilePath = resolve(__dirname, 'entry-v1.schema.json');
export const lightExtensionEntryV1SchemaFileContent = readFileSync(lightExtensionEntryV1SchemaFilePath, 'utf8');
export const lightExtensionEntryV1SchemaSha256 = createHash('sha256')
  .update(lightExtensionEntryV1SchemaFileContent)
  .digest('hex');
