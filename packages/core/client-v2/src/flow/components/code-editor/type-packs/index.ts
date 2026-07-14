/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { hasRunJSTypeLibraryPackLoader, registerRunJSTypeLibraryPackLoader } from '../typescriptLibraryRegistry';
import { generatedRunJSTypeLibraryPackLoaders } from './generated/loaders';

export function ensureGeneratedRunJSTypeLibraryPackLoadersRegistered(): void {
  for (const [packId, loader] of Object.entries(generatedRunJSTypeLibraryPackLoaders)) {
    if (!hasRunJSTypeLibraryPackLoader(packId)) {
      registerRunJSTypeLibraryPackLoader(packId, loader);
    }
  }
}
