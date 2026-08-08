/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isVscError, type VscError } from '@nocobase/runjs-workspace/server';

import { JsTemplateError } from '../../shared/errors';

export function toJsTemplateSourceError(error: VscError, projectId?: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template source operation failed', {
    status: error.status,
    details: {
      projectId,
      sourceCode: error.code,
    },
  });
}

export function normalizeVscBridgeError(error: unknown, projectId?: string): unknown {
  return isVscError(error) ? toJsTemplateSourceError(error, projectId) : error;
}
