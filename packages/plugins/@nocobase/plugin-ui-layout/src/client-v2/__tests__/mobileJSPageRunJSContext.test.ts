/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

describe('MobileJSPageModel RunJS context', () => {
  it.each(['before', 'after'] as const)(
    'registers the page context when the plugin loads %s context setup',
    async (order) => {
      vi.resetModules();
      const flowEngine = await import('@nocobase/flow-engine');
      const { registerMobileJSPageRunJSContext } = await import('../mobileJSPageRunJSContext');

      if (order === 'before') {
        registerMobileJSPageRunJSContext();
        await flowEngine.setupRunJSContexts();
      } else {
        await flowEngine.setupRunJSContexts();
        registerMobileJSPageRunJSContext();
      }

      await vi.waitFor(() => {
        expect(flowEngine.RunJSContextRegistry.resolve('v2', 'MobileJSPageModel')).toBe(flowEngine.JSPageRunJSContext);
      });
      expect(flowEngine.RunJSContextRegistry.getMeta('v2', 'MobileJSPageModel')).toEqual({ scenes: ['page'] });

      registerMobileJSPageRunJSContext();
      expect(flowEngine.RunJSContextRegistry.resolve('v1', 'MobileJSPageModel')).toBe(flowEngine.JSPageRunJSContext);
    },
  );
});
