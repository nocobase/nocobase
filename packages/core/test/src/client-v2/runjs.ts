/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, beforeAll } from 'vitest';

export function setupRunJSTestHosts(): void {
  let disposeHosts: (() => void) | undefined;

  beforeAll(async () => {
    const [{ registerRunJSRegistryHost }, { registerRunJSRuntimeHost }, { runJSRegistryHost }, { runJSRuntimeHost }] =
      await Promise.all([
        import('../../../client-v2/src/flow/components/runjs-source/RunJSRegistryHost'),
        import('../../../client-v2/src/flow/components/runjs-source/RunJSRuntimeHost'),
        import('../../../runjs/src/workspace/client-v2/runJSRegistryHost'),
        import('../../../runjs/src/workspace/client-v2/runJSRuntimeHost'),
      ]);
    const disposeRegistryHost = registerRunJSRegistryHost(runJSRegistryHost);
    const disposeRuntimeHost = registerRunJSRuntimeHost(runJSRuntimeHost);
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
