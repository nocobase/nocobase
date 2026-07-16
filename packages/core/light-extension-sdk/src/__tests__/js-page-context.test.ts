/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { JSBlockContext, JSPageContext, JSPageRuntimeFacade } from '@nocobase/light-extension-sdk/client';

describe('JS Page public context', () => {
  it('extends the render context with a settings-aware page facade', () => {
    type Settings = { title: string };

    expectTypeOf<JSPageContext<Settings>>().toMatchTypeOf<JSBlockContext<Settings>>();
    expectTypeOf<JSPageContext<Settings>['settings']>().toEqualTypeOf<Settings>();
    expectTypeOf<JSPageContext<Settings>['element']>().toEqualTypeOf<JSBlockContext<Settings>['element']>();
    expectTypeOf<JSPageContext<Settings>['render']>().toEqualTypeOf<JSBlockContext<Settings>['render']>();
    expectTypeOf<JSPageContext<Settings>['page']>().toEqualTypeOf<JSPageRuntimeFacade>();
  });

  it('exposes only the stable page facade fields', () => {
    expectTypeOf<keyof JSPageRuntimeFacade>().toEqualTypeOf<'uid' | 'active' | 'refresh' | 'setDocumentTitle'>();
    expectTypeOf<Extract<keyof JSPageRuntimeFacade, 'route' | 'app' | 'engine'>>().toEqualTypeOf<never>();
  });
});
