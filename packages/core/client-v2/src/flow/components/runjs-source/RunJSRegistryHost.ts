/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSEditorRegistryHost } from '../runjs-studio/RunJSEditorRegistry';
import type {
  RunJSSettingsDescriptorProvider,
  RunJSSettingsDescriptorProviderInput,
  RunJSSettingsDescriptorProviderRegistryHost,
} from './RunJSSettingsDescriptorProviderRegistry';
import type { RunJSSourceResolverRegistryHost } from './RunJSSourceResolverRegistry';
import type { RunJSEditorProvider } from '../runjs-studio/types';
import type { RunJSSourceResolver } from './types';

export interface RunJSRegistryHost {
  editors: RunJSEditorRegistryHost;
  settingsDescriptors: RunJSSettingsDescriptorProviderRegistryHost;
  sourceResolvers: RunJSSourceResolverRegistryHost;
}

const hosts: RunJSRegistryHost[] = [];
const pendingHost = createPendingRunJSRegistryHost();

export function registerRunJSRegistryHost(host: RunJSRegistryHost): () => void {
  hosts.push(host);
  pendingHost.bind(host);
  let registered = true;
  return () => {
    if (!registered) {
      return;
    }
    registered = false;
    const index = hosts.lastIndexOf(host);
    if (index >= 0) {
      hosts.splice(index, 1);
      pendingHost.bind(hosts.at(-1));
    }
  };
}

export function getRunJSRegistryHost(): RunJSRegistryHost | undefined {
  return hosts.at(-1) || (pendingHost.hasContributions() ? pendingHost : undefined);
}

export function clearRunJSRegistryHosts(): void {
  hosts.length = 0;
  pendingHost.bind(undefined);
}

export function requireRunJSRegistryHost(): RunJSRegistryHost {
  return getRunJSRegistryHost() || pendingHost;
}

function createPendingRunJSRegistryHost(): RunJSRegistryHost & {
  bind(host: RunJSRegistryHost | undefined): void;
  hasContributions(): boolean;
} {
  const editorProviders = new Map<string, { provider: RunJSEditorProvider; dispose?: () => void }>();
  const settingsProviders = new Map<string, { provider: RunJSSettingsDescriptorProvider; dispose?: () => void }>();
  const sourceResolvers = new Map<string, { resolver: RunJSSourceResolver; dispose?: () => void }>();
  let boundHost: RunJSRegistryHost | undefined;

  const sorted = <T extends { priority?: number }>(values: T[]): T[] =>
    values
      .map((value, registrationIndex) => ({ value, registrationIndex }))
      .sort(
        (left, right) =>
          (right.value.priority ?? 0) - (left.value.priority ?? 0) || right.registrationIndex - left.registrationIndex,
      )
      .map(({ value }) => value);

  const bind = (host: RunJSRegistryHost | undefined) => {
    if (boundHost === host) return;
    for (const entry of [...editorProviders.values(), ...settingsProviders.values(), ...sourceResolvers.values()]) {
      entry.dispose?.();
      entry.dispose = undefined;
    }
    boundHost = host;
    if (!host) return;
    for (const entry of editorProviders.values()) entry.dispose = host.editors.registerProvider(entry.provider);
    for (const entry of settingsProviders.values()) {
      entry.dispose = host.settingsDescriptors.registerProvider(entry.provider);
    }
    for (const entry of sourceResolvers.values()) entry.dispose = host.sourceResolvers.registerResolver(entry.resolver);
  };

  return {
    bind,
    hasContributions: () => Boolean(editorProviders.size || settingsProviders.size || sourceResolvers.size),
    editors: {
      registerProvider(provider) {
        const entry: { provider: RunJSEditorProvider; dispose?: () => void } = { provider };
        editorProviders.set(provider.key, entry);
        if (boundHost) entry.dispose = boundHost.editors.registerProvider(provider);
        return () => {
          if (editorProviders.get(provider.key) === entry) editorProviders.delete(provider.key);
          entry.dispose?.();
        };
      },
      getProviders: () => sorted(Array.from(editorProviders.values(), ({ provider }) => provider)),
      clear() {
        for (const entry of editorProviders.values()) entry.dispose?.();
        editorProviders.clear();
      },
    },
    settingsDescriptors: {
      registerProvider(provider) {
        const entry: { provider: RunJSSettingsDescriptorProvider; dispose?: () => void } = { provider };
        settingsProviders.set(provider.key, entry);
        if (boundHost) entry.dispose = boundHost.settingsDescriptors.registerProvider(provider);
        return () => {
          if (settingsProviders.get(provider.key) === entry) settingsProviders.delete(provider.key);
          entry.dispose?.();
        };
      },
      getProviders: () => sorted(Array.from(settingsProviders.values(), ({ provider }) => provider)),
      async getSettingsDescriptor(input: RunJSSettingsDescriptorProviderInput) {
        for (const provider of sorted(Array.from(settingsProviders.values(), ({ provider }) => provider))) {
          if (provider.canHandle?.(input) === false) continue;
          const descriptor = await provider.getSettingsDescriptor(input);
          if (descriptor) return descriptor;
        }
        return undefined;
      },
      clear() {
        for (const entry of settingsProviders.values()) entry.dispose?.();
        settingsProviders.clear();
      },
    },
    sourceResolvers: {
      registerResolver(resolver) {
        const sourceMode = String(resolver.sourceMode).trim();
        const entry: { resolver: RunJSSourceResolver; dispose?: () => void } = { resolver };
        sourceResolvers.set(sourceMode, entry);
        if (boundHost) entry.dispose = boundHost.sourceResolvers.registerResolver(resolver);
        return () => {
          if (sourceResolvers.get(sourceMode) === entry) sourceResolvers.delete(sourceMode);
          entry.dispose?.();
        };
      },
      getResolver(sourceMode) {
        return sourceResolvers.get(typeof sourceMode === 'string' ? sourceMode.trim() : '')?.resolver || null;
      },
      getResolvers: () => Array.from(sourceResolvers.values(), ({ resolver }) => resolver),
      clear() {
        for (const entry of sourceResolvers.values()) entry.dispose?.();
        sourceResolvers.clear();
      },
    },
  };
}
