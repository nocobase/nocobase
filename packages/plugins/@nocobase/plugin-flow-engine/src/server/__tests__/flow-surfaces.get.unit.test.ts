/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import type { Plugin } from '@nocobase/server';
import { FlowSurfacesService } from '../flow-surfaces/service';
import type { FlowSurfaceResolveTarget, FlowSurfaceResolvedTarget } from '../flow-surfaces/types';

describe('flowSurfaces:get service', () => {
  it('should reject when the resolved target cannot load a readable tree', async () => {
    const service = new FlowSurfacesService({ db: {} } as unknown as Plugin);
    Object.defineProperty(service, 'locator', {
      configurable: true,
      get: () => ({
        resolve: async (target: FlowSurfaceResolveTarget): Promise<FlowSurfaceResolvedTarget> => ({
          target,
          uid: 'dangling-node',
          kind: 'node',
        }),
      }),
    });
    Object.defineProperty(service, 'loadResolvedNode', {
      configurable: true,
      value: async () => undefined,
    });

    await expect(service.get({ uid: 'dangling-node' })).rejects.toThrow(
      `flowSurfaces:get target 'dangling-node' could not resolve a readable surface tree`,
    );
  });
});
