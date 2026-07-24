/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscError } from '../vsc-file/public-api';
import { isVscError } from '../vsc-file/public-api';

import { LightExtensionError } from '../../shared/errors';

export function toLightExtensionSourceError(error: VscError, repoId?: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Light extension source operation failed', {
    status: error.status,
    details: {
      repoId,
      sourceCode: error.code,
    },
  });
}

export function normalizeVscBridgeError(error: unknown, repoId?: string): unknown {
  return isVscError(error) ? toLightExtensionSourceError(error, repoId) : error;
}
