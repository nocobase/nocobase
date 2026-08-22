/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { createRoutesTableSchema } from '../routesTableSchema';

vi.mock('@nocobase/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client')>();
  return {
    ...actual,
    NocoBaseDesktopRouteType: {
      flowPage: 'flowPage',
      group: 'group',
      link: 'link',
      page: 'page',
      tabs: 'tabs',
    },
  };
});

describe('v1 routes table schema', () => {
  it('should scope desktop route management to the default AdminLayout', () => {
    const schema = createRoutesTableSchema('desktopRoutes', '/admin');
    const params = schema['x-decorator-props'].params;

    expect(params.filter).toEqual({
      'hidden.$ne': true,
      'uiLayouts.uid': 'admin-layout-model',
    });
    expect(JSON.stringify(params.filter)).not.toContain('uiLayouts.uid.$notExists');
  });

  it('should keep mobile routes management filter unchanged', () => {
    const schema = createRoutesTableSchema('mobileRoutes', '/m/page');
    const params = schema['x-decorator-props'].params;

    expect(params.filter).toEqual({
      'hidden.$ne': true,
    });
  });
});
