/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, it, vi } from 'vitest';

it('imports the Flow Engine package entry without eagerly initializing RunJS context classes', async () => {
  vi.resetModules();

  const [{ setupRunJSContexts }, flowEngine] = await Promise.all([
    import('../runjs-context/setup'),
    import('../index'),
  ]);

  await setupRunJSContexts();
  expect(flowEngine.RunJSContextRegistry.resolve('v2', 'JSPageModel')?.prototype).toBeInstanceOf(
    flowEngine.FlowRunJSContext,
  );
});
