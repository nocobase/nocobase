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
  type RunJSEditorProvider,
  type RunJSRegistryHost,
  type RunJSRuntimeHost,
  type RunJSSettingsDescriptorProvider,
  type RunJSSourceResolver,
} from '@nocobase/client-v2';
import { createRunJSClientHosts } from '@nocobase/runjs/client';

const defaultHosts: { registryHost: RunJSRegistryHost; runtimeHost: RunJSRuntimeHost } = createRunJSClientHosts<
  RunJSEditorProvider,
  RunJSSettingsDescriptorProvider,
  RunJSSourceResolver
>(createTestRuntimeContext);

export interface SetupRunJSTestHostsOptions {
  registryHost?: RunJSRegistryHost;
  runtimeHost?: Partial<RunJSRuntimeHost>;
}

export function createRunJSTestRuntimeHost(overrides: Partial<RunJSRuntimeHost> = {}): RunJSRuntimeHost {
  return { ...defaultHosts.runtimeHost, ...overrides };
}

export function setupRunJSTestHosts(options: SetupRunJSTestHostsOptions = {}): void {
  let disposeHosts: (() => void) | undefined;
  beforeAll(() => {
    const disposeRegistry = registerRunJSRegistryHost(options.registryHost || defaultHosts.registryHost);
    const disposeRuntime = registerRunJSRuntimeHost(createRunJSTestRuntimeHost(options.runtimeHost));
    disposeHosts = () => {
      disposeRuntime();
      disposeRegistry();
    };
  });
  afterAll(() => {
    disposeHosts?.();
    disposeHosts = undefined;
    defaultHosts.registryHost.editors.clear();
    defaultHosts.registryHost.settingsDescriptors.clear();
    defaultHosts.registryHost.sourceResolvers.clear();
  });
}

function createTestRuntimeContext(
  baseCtx: Parameters<RunJSRuntimeHost['createRuntimeContext']>[0],
  resolved: Parameters<RunJSRuntimeHost['createRuntimeContext']>[1],
): ReturnType<RunJSRuntimeHost['createRuntimeContext']> {
  const context: Record<string, unknown> = isRecord(baseCtx) ? Object.create(baseCtx) : {};
  context.settings = resolved.settings;
  context.runJsSource = {
    sourceMode: resolved.sourceMode,
    sourceBinding: resolved.sourceBinding,
    sourceMap: resolved.sourceMap,
    context: resolved.context,
  };
  return context;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
