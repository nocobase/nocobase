/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSRegistryHostPort } from '@nocobase/runjs/workspace/shared';
import type { RunJSEditorProvider } from '../runjs-studio/types';
import type { RunJSSettingsDescriptorProvider } from './RunJSSettingsDescriptorProviderRegistry';
import type { RunJSSourceResolver } from './types';

export type RunJSRegistryHost = RunJSRegistryHostPort<
  RunJSEditorProvider,
  RunJSSettingsDescriptorProvider,
  RunJSSourceResolver
>;

const hosts: RunJSRegistryHost[] = [];

export function registerRunJSRegistryHost(host: RunJSRegistryHost): () => void {
  hosts.push(host);
  let registered = true;
  return () => {
    if (!registered) {
      return;
    }
    registered = false;
    const index = hosts.lastIndexOf(host);
    if (index >= 0) {
      hosts.splice(index, 1);
    }
  };
}

export function getRunJSRegistryHost(): RunJSRegistryHost | undefined {
  return hosts.at(-1);
}

export function clearRunJSRegistryHosts(): void {
  hosts.length = 0;
}

export function requireRunJSRegistryHost(): RunJSRegistryHost {
  const host = getRunJSRegistryHost();
  if (!host) {
    throw new Error('RunJS client registries are not installed');
  }
  return host;
}
