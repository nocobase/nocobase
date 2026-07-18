/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import clientAppEntryV1Schema from './client-app-entry-v1.schema.json';
import entryV1Schema from './entry-v1.schema.json';

export * from './client-app-entry';
export * from './contracts';

export const lightExtensionClientAppEntryV1Schema = clientAppEntryV1Schema;
export const lightExtensionClientAppEntryV1SchemaJson = `${JSON.stringify(clientAppEntryV1Schema, null, 2)}\n`;
export const lightExtensionEntryV1Schema = entryV1Schema;
export const lightExtensionEntryV1SchemaJson = `${JSON.stringify(entryV1Schema, null, 2)}\n`;
