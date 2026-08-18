/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_SCHEMA_URI, jsTemplateV1Schema } from '@nocobase/runjs/js-template/schema';
import type { CodeEditorJsonSchema } from '@nocobase/client-v2';

import { JS_TEMPLATE_DESCRIPTOR_FILE } from '../../constants';
import { getManagedJsTemplateRoot, normalizeWorkspacePath } from './jsTemplateWorkspaceAccess';

const JS_TEMPLATE_JSON_SCHEMA: CodeEditorJsonSchema = {
  schema: jsTemplateV1Schema,
  uri: JS_TEMPLATE_SCHEMA_URI,
};

export function resolveJsTemplateWorkspaceJsonSchema(path: string): CodeEditorJsonSchema | undefined {
  const normalizedPath = normalizeWorkspacePath(path);
  const suffix = `/${JS_TEMPLATE_DESCRIPTOR_FILE}`;
  if (!normalizedPath.endsWith(suffix)) {
    return undefined;
  }

  const entryRoot = normalizedPath.slice(0, -suffix.length);
  return getManagedJsTemplateRoot(entryRoot) ? JS_TEMPLATE_JSON_SCHEMA : undefined;
}

export function resolveInlineJsTemplateWorkspaceJsonSchema(path: string): CodeEditorJsonSchema | undefined {
  return normalizeWorkspacePath(path) === `src/client/${JS_TEMPLATE_DESCRIPTOR_FILE}`
    ? JS_TEMPLATE_JSON_SCHEMA
    : undefined;
}
