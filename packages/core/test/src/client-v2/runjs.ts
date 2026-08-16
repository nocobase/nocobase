/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/// <reference types="vitest/globals" />

import {
  registerRunJSRegistryHost,
  registerRunJSRuntimeHost,
  runJSFlowContextAdapter,
  type RunJSEditorProvider,
  type RunJSRegistryHost,
  type RunJSRuntimeHost,
  type RunJSSettingsDescriptorProvider,
  type RunJSSourceResolver,
} from '@nocobase/client-v2';
import { createRunJSClientHosts, installRunJSClientHosts } from '@nocobase/runjs/client';

export interface SetupRunJSTestHostsOptions {
  registryHost?: RunJSRegistryHost;
  runtimeHost?: Partial<RunJSRuntimeHost>;
}

function createRunJSTestHosts(options: SetupRunJSTestHostsOptions = {}) {
  const productionHosts = createRunJSClientHosts<
    RunJSEditorProvider,
    RunJSSettingsDescriptorProvider,
    RunJSSourceResolver
  >({ flowContext: runJSFlowContextAdapter });

  return {
    registryHost: options.registryHost ?? productionHosts.registryHost,
    runtimeHost: { ...productionHosts.runtimeHost, ...options.runtimeHost },
  };
}

export function createRunJSTestRuntimeHost(overrides: Partial<RunJSRuntimeHost> = {}): RunJSRuntimeHost {
  return createRunJSTestHosts({ runtimeHost: overrides }).runtimeHost;
}

export function setupRunJSTestHosts(options: SetupRunJSTestHostsOptions = {}): void {
  let activeHosts: ReturnType<typeof createRunJSTestHosts> | undefined;
  let disposeHosts: (() => void) | undefined;

  const clearRegistries = () => {
    activeHosts?.registryHost.editors.clear();
    activeHosts?.registryHost.settingsDescriptors.clear();
    activeHosts?.registryHost.sourceResolvers.clear();
  };

  beforeEach(() => {
    clearRegistries();
    disposeHosts?.();
    activeHosts = createRunJSTestHosts(options);
    clearRegistries();
    disposeHosts = installRunJSClientHosts(activeHosts, {
      registerRegistryHost: registerRunJSRegistryHost,
      registerRuntimeHost: registerRunJSRuntimeHost,
    });
  });

  afterEach(() => {
    clearRegistries();
    disposeHosts?.();
    disposeHosts = undefined;
    activeHosts = undefined;
  });
}
