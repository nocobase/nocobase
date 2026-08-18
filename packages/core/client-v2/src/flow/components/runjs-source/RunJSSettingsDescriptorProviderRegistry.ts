/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSValue } from '@nocobase/flow-engine';

import type { RunJSSourceLocator } from '../runjs-studio';
import { getRunJSRegistryHost, requireRunJSRegistryHost } from './RunJSRegistryHost';
import type {
  RunJSSourceBinding,
  RunJSSourceContext,
  RunJSSourceSettings,
  RunJSSourceSettingsDescriptor,
} from './types';

export interface RunJSSettingsDescriptorProviderInput {
  sourceMode: string;
  sourceBinding?: RunJSSourceBinding | null;
  sourceRef?: Record<string, unknown> | null;
  settings?: RunJSSourceSettings | null;
  runJs?: RunJSValue | null;
  locator?: RunJSSourceLocator;
  context?: RunJSSourceContext;
}

export interface RunJSSettingsDescriptorProvider {
  key: string;
  priority?: number;
  canHandle?: (input: RunJSSettingsDescriptorProviderInput) => boolean;
  getSettingsDescriptor: (
    input: RunJSSettingsDescriptorProviderInput,
  ) => RunJSSourceSettingsDescriptor | undefined | Promise<RunJSSourceSettingsDescriptor | undefined>;
}

export interface RunJSSettingsDescriptorProviderRegistryHost {
  registerProvider(provider: RunJSSettingsDescriptorProvider): () => void;
  getProviders(): RunJSSettingsDescriptorProvider[];
  getSettingsDescriptor(
    input: RunJSSettingsDescriptorProviderInput,
  ): Promise<RunJSSourceSettingsDescriptor | undefined>;
  clear(): void;
}

export type RunJSSettingsDescriptorProviderRegistryManager = RunJSSettingsDescriptorProviderRegistryHost;

export const RunJSSettingsDescriptorProviderRegistry: RunJSSettingsDescriptorProviderRegistryHost = {
  registerProvider(provider) {
    return requireRunJSRegistryHost().settingsDescriptors.registerProvider(provider);
  },
  getProviders() {
    return getRunJSRegistryHost()?.settingsDescriptors.getProviders() || [];
  },
  getSettingsDescriptor(input) {
    return getRunJSRegistryHost()?.settingsDescriptors.getSettingsDescriptor(input) || Promise.resolve(undefined);
  },
  clear() {
    getRunJSRegistryHost()?.settingsDescriptors.clear();
  },
};
