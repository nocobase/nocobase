/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  getWorkflowCanvasRuntimePath,
  getWorkflowExecutionRuntimePath,
  isWorkflowV2Runtime,
} from '../useWorkflowRuntimePaths';

function replacePathname(pathname: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...window.location,
      pathname,
    },
  });
}

describe('useWorkflowRuntimePaths', () => {
  afterEach(() => {
    delete window.__nocobase_modern_client_prefix__;
    delete window.__nocobase_public_path__;
    replacePathname('/');
  });

  it('uses v2 workflow routes when the current pathname is inside the modern client prefix', () => {
    window.__nocobase_modern_client_prefix__ = 'v';
    window.__nocobase_public_path__ = '/nocobase/v/';
    replacePathname('/nocobase/v/admin/settings/workflow');

    expect(isWorkflowV2Runtime()).toBe(true);
    expect(getWorkflowCanvasRuntimePath(123)).toBe('/admin/workflow/workflows/123');
    expect(getWorkflowExecutionRuntimePath(456)).toBe('/admin/workflow/executions/456');
  });

  it('keeps legacy workflow routes when reused v2 components run under the v1 settings page', () => {
    window.__nocobase_modern_client_prefix__ = 'v';
    window.__nocobase_public_path__ = '/nocobase/';
    replacePathname('/nocobase/admin/settings/workflow/workflows/123');

    expect(isWorkflowV2Runtime()).toBe(false);
    expect(getWorkflowCanvasRuntimePath(123)).toBe('/admin/settings/workflow/workflows/123');
    expect(getWorkflowExecutionRuntimePath(456)).toBe('/admin/settings/workflow/executions/456');
  });

  it('keeps legacy workflow routes when root public path is "/"', () => {
    window.__nocobase_modern_client_prefix__ = 'v';
    window.__nocobase_public_path__ = '/';
    replacePathname('/admin/settings/workflow/workflows/123');

    expect(isWorkflowV2Runtime()).toBe(false);
    expect(getWorkflowCanvasRuntimePath(123)).toBe('/admin/settings/workflow/workflows/123');
  });

  it('uses v2 workflow routes when root public path is "/v/"', () => {
    window.__nocobase_modern_client_prefix__ = 'v';
    window.__nocobase_public_path__ = '/v/';
    replacePathname('/v/admin/workflow/workflows/123');

    expect(isWorkflowV2Runtime()).toBe(true);
    expect(getWorkflowCanvasRuntimePath(123)).toBe('/admin/workflow/workflows/123');
  });

  it('falls back to pathname matching when public path is unavailable', () => {
    window.__nocobase_modern_client_prefix__ = 'v';
    replacePathname('/v/admin/workflow/workflows/123');

    expect(isWorkflowV2Runtime()).toBe(true);
  });
});
