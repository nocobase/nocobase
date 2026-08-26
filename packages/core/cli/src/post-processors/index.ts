/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerDataModelingPostProcessors } from './data-modeling.js';
import { registerDataSourceManagerPostProcessors } from './data-source-manager.js';

let initialized = false;

export function registerPostProcessors() {
  if (initialized) {
    return;
  }

  registerDataModelingPostProcessors();
  registerDataSourceManagerPostProcessors();
  initialized = true;
}
