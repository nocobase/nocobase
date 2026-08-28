/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginWorkflowLoopClientV2 from '../plugin';
import LoopInstruction from '../nodes/loop';

describe('PluginWorkflowLoopClientV2', () => {
  it('registers the loop instruction through the workflow client-v2 registry', async () => {
    const registerInstruction = vi.fn();
    const plugin = new PluginWorkflowLoopClientV2();

    (plugin as any).app = {
      pm: {
        get: () => ({
          registerInstruction,
        }),
      },
    };

    await plugin.load();

    expect(registerInstruction).toHaveBeenCalledWith('loop', LoopInstruction);
  });
});
