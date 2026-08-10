/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSEditorProvider } from './types';
import { getRunJSRegistryHost, requireRunJSRegistryHost } from '../runjs-source/RunJSRegistryHost';

export interface RunJSEditorRegistryHost {
  registerProvider(provider: RunJSEditorProvider): () => void;
  getProviders(): RunJSEditorProvider[];
  clear(): void;
}

export const RunJSEditorRegistry: RunJSEditorRegistryHost = {
  registerProvider(provider) {
    return requireRunJSRegistryHost().editors.registerProvider(provider);
  },
  getProviders() {
    return getRunJSRegistryHost()?.editors.getProviders() || [];
  },
  clear() {
    getRunJSRegistryHost()?.editors.clear();
  },
};
