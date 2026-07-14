/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockClient } from '../../MockApplication';
import { PluginFlowEngine } from '../index';

describe('PluginFlowEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not re-register actions when the same app loads twice', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createMockClient({
      plugins: [
        [
          PluginFlowEngine,
          {
            name: 'flow-engine',
          },
        ],
      ],
    });

    await app.load();
    await app.load();

    expect(app.flowEngine.getAction('openView')).toBeTruthy();
    expect(warn.mock.calls.flat().join('\n')).not.toContain("Action 'openView' is already registered");
  });
});
