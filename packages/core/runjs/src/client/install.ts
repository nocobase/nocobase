/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSClientHostRegistrationPort,
  RunJSContributionPort,
  RunJSEditorProviderPort,
  RunJSRegistryHostPort,
  RunJSRuntimeHostPort,
  RunJSSettingsDescriptorProviderPort,
  RunJSSourceResolverPort,
} from '../workspace/shared/client-ports';
import { createRunJSRegistryHost } from './runJSRegistryHost';
import { createRunJSRuntimeHost } from './runtime';

export interface RunJSClientHosts<
  TEditorProvider extends RunJSContributionPort = RunJSEditorProviderPort,
  TSettingsProvider extends RunJSSettingsDescriptorProviderPort = RunJSSettingsDescriptorProviderPort,
  TResolver extends RunJSSourceResolverPort = RunJSSourceResolverPort,
> {
  registryHost: RunJSRegistryHostPort<TEditorProvider, TSettingsProvider, TResolver>;
  runtimeHost: RunJSRuntimeHostPort;
}

export function createRunJSClientHosts<
  TEditorProvider extends RunJSContributionPort = RunJSEditorProviderPort,
  TSettingsProvider extends RunJSSettingsDescriptorProviderPort = RunJSSettingsDescriptorProviderPort,
  TResolver extends RunJSSourceResolverPort = RunJSSourceResolverPort,
>(
  createRuntimeContext: RunJSRuntimeHostPort['createRuntimeContext'],
): RunJSClientHosts<TEditorProvider, TSettingsProvider, TResolver> {
  const registryHost = createRunJSRegistryHost<TEditorProvider, TSettingsProvider, TResolver>();
  return {
    registryHost,
    runtimeHost: createRunJSRuntimeHost({ createRuntimeContext, sourceResolvers: registryHost.sourceResolvers }),
  };
}

export function installRunJSClientHosts<TRuntimeHost, TRegistryHost>(
  registration: RunJSClientHostRegistrationPort<TRuntimeHost, TRegistryHost>,
  hosts: { registryHost: TRegistryHost; runtimeHost: TRuntimeHost },
): () => void {
  const disposers: Array<() => void> = [];
  try {
    disposers.push(registration.registerRegistryHost(hosts.registryHost));
    disposers.push(registration.registerRuntimeHost(hosts.runtimeHost));
  } catch (error) {
    disposeRunJSClientHosts(disposers);
    throw error;
  }

  return () => disposeRunJSClientHosts(disposers);
}

function disposeRunJSClientHosts(disposers: Array<() => void>): void {
  while (disposers.length) {
    disposers.pop()?.();
  }
}
