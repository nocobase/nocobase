/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { RouteModel } from '../RouteModel';

describe('RouteModel page menu routes', () => {
  it('prefers the route page menu model class over the layout root page model class', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    const model = engine.createModel<RouteModel>({ uid: 'route-model', use: 'RouteModel' });
    const flow = model.getFlow('popupSettings');
    const defaultParams = flow?.steps?.openView?.defaultParams;

    const params = await defaultParams?.({
      currentRoute: {
        options: {
          pageMenuModelClass: 'DemoPageMenuModel',
        },
      },
      layout: {
        rootPageModelClass: 'MobileRootPageModel',
      },
    } as never);

    expect(params).toMatchObject({
      mode: 'embed',
      pageModelClass: 'DemoPageMenuModel',
      preventClose: true,
    });
  });
});
