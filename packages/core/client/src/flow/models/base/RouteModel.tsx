/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, FlowModel } from '@nocobase/flow-engine';

export class RouteModel<T = DefaultStructure> extends FlowModel<T> {}

RouteModel.registerFlow({
  key: 'routeClickSettings',
  on: 'click',
  steps: {
    openView: {
      use: 'openView',
      defaultParams(ctx) {
        return {
          mode: 'embed',
          preventClose: true,
          pageModelClass: 'RootPageModel',
        };
      },
    },
  },
});
