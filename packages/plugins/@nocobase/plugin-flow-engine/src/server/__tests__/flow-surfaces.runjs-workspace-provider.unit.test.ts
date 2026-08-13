/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  bootstrapFlowSurfaceRunJSWorkspace,
  hasFlowSurfaceRunJSWorkspaceBootstrapPort,
  registerFlowSurfaceRunJSWorkspaceBootstrapPort,
} from '../flow-surfaces/page-surface-contract';

describe('Flow Surface RunJS workspace provider contract', () => {
  it('returns no bootstrap result without a provider', async () => {
    const app = {};

    expect(hasFlowSurfaceRunJSWorkspaceBootstrapPort(app)).toBe(false);
    await expect(bootstrapFlowSurfaceRunJSWorkspace(app, {} as never)).resolves.toBeUndefined();
  });

  it('registers and identity-safely disposes the provider', async () => {
    const app = {};
    const port = vi.fn(async () => ({ status: 'ready' as const, retryable: false }));
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(app, port);

    expect(hasFlowSurfaceRunJSWorkspaceBootstrapPort(app)).toBe(true);
    await expect(bootstrapFlowSurfaceRunJSWorkspace(app, {} as never)).resolves.toEqual({
      status: 'ready',
      retryable: false,
    });

    unregister();
    expect(hasFlowSurfaceRunJSWorkspaceBootstrapPort(app)).toBe(false);
  });
});
