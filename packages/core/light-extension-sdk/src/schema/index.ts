/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import entryV1Schema from './entry-v1.schema.json';

export * from './contracts';

export const lightExtensionEntryV1Schema = entryV1Schema;
export const lightExtensionEntryV1SchemaJson = `${JSON.stringify(entryV1Schema, null, 2)}\n`;
