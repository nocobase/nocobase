/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginWorkflowSQLClientV2 from '../index';
import SQLInstruction from '../SQLInstruction';

vi.mock('@nocobase/client-v2', () => ({
  Plugin: class {
    app: unknown;

    constructor(options: unknown, app: unknown) {
      this.app = app;
    }
  },
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  Instruction: class {},
}));

describe('PluginWorkflowSQLClientV2', () => {
  it('registers SQL instruction through the workflow alias', async () => {
    const registerInstruction = vi.fn();
    const app = {
      pm: {
        get: vi.fn((name: string) => (name === 'workflow' ? { registerInstruction } : undefined)),
      },
    };
    const plugin = new PluginWorkflowSQLClientV2({}, app as any);

    await plugin.load();

    expect(app.pm.get).toHaveBeenCalledWith('workflow');
    expect(registerInstruction).toHaveBeenCalledWith('sql', SQLInstruction);
  });
});
