/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/// <reference types="vitest/globals" />

import { registerRunJSRegistryHost, registerRunJSRuntimeHost } from '@nocobase/client-v2';

import { runJSRegistryHost } from './runjs/runJSRegistryHost';
import { runJSRuntimeHost } from './runjs/runJSRuntimeHost';

export function setupRunJSTestHosts(): void {
  let disposeHosts: (() => void) | undefined;

  beforeAll(() => {
    const disposeRegistryHost = registerRunJSRegistryHost({ ...runJSRegistryHost });
    const disposeRuntimeHost = registerRunJSRuntimeHost({ ...runJSRuntimeHost });
    disposeHosts = () => {
      disposeRuntimeHost();
      disposeRegistryHost();
    };
  });

  afterAll(() => {
    disposeHosts?.();
    disposeHosts = undefined;
  });
}
