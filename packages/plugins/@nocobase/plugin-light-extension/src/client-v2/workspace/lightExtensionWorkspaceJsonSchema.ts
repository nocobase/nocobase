/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_SCHEMA_URI, lightExtensionEntryV1Schema } from '@nocobase/light-extension-sdk/schema';
import type { CodeEditorJsonSchema } from '@nocobase/client-v2';

import { LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE } from '../../constants';
import { getManagedLightExtensionEntryRoot, normalizeWorkspacePath } from './lightExtensionWorkspaceAccess';

const LIGHT_EXTENSION_ENTRY_JSON_SCHEMA: CodeEditorJsonSchema = {
  schema: lightExtensionEntryV1Schema,
  uri: LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
};

export function resolveLightExtensionWorkspaceJsonSchema(path: string): CodeEditorJsonSchema | undefined {
  const normalizedPath = normalizeWorkspacePath(path);
  const suffix = `/${LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE}`;
  if (!normalizedPath.endsWith(suffix)) {
    return undefined;
  }

  const entryRoot = normalizedPath.slice(0, -suffix.length);
  return getManagedLightExtensionEntryRoot(entryRoot) ? LIGHT_EXTENSION_ENTRY_JSON_SCHEMA : undefined;
}
