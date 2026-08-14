/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerRunJSRegistryHost, registerRunJSRuntimeHost } from '@nocobase/client-v2';
import type { RunJSClientHostRegistrationPort } from '@nocobase/runjs/workspace/shared';

import { runJSRegistryHost } from './runJSRegistryHost';
import { runJSRuntimeHost } from './runJSRuntimeHost';

export type RunJSRuntimeHostRegistration = RunJSClientHostRegistrationPort<
  typeof runJSRuntimeHost,
  typeof runJSRegistryHost
>;

const clientHostRegistration: RunJSRuntimeHostRegistration = {
  registerRegistryHost: (host) => registerRunJSRegistryHost(host),
  registerRuntimeHost: (host) => registerRunJSRuntimeHost(host),
};

export function installRunJSRuntimeClientV2(
  registration: RunJSRuntimeHostRegistration = clientHostRegistration,
): () => void {
  const disposers: Array<() => void> = [];
  try {
    disposers.push(registration.registerRegistryHost({ ...runJSRegistryHost }));
    disposers.push(registration.registerRuntimeHost({ ...runJSRuntimeHost }));
  } catch (error) {
    disposeRunJSRuntime(disposers);
    throw error;
  }

  return () => disposeRunJSRuntime(disposers);
}

function disposeRunJSRuntime(disposers: Array<() => void>): void {
  while (disposers.length) {
    disposers.pop()?.();
  }
}
