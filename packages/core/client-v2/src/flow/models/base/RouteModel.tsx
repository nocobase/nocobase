/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, FlowModel } from '@nocobase/flow-engine';
import {
  resolveRoutePageModelClass,
  type RoutePageModelLayout,
  type RoutePageModelRoute,
  type UnsupportedV2PageTypeDiagnostic,
} from './resolveRoutePageModelClass';

const warnedUnsupportedPageTypes = new Set<string>();

function warnUnsupportedPageTypeOnce(diagnostic: UnsupportedV2PageTypeDiagnostic) {
  const key = `${diagnostic.routeIdentity}:${String(diagnostic.pageType)}`;
  if (warnedUnsupportedPageTypes.has(key)) {
    return;
  }
  warnedUnsupportedPageTypes.add(key);
  console.warn('[NocoBase] Unsupported v2 page type; using the layout root page model.', diagnostic);
}

interface RouteModelRuntimeContext {
  currentRoute?: RoutePageModelRoute;
  layout?: RoutePageModelLayout;
}

export class RouteModel<T = DefaultStructure> extends FlowModel<T> {}

RouteModel.registerFlow({
  key: 'popupSettings',
  on: 'click',
  steps: {
    openView: {
      use: 'openView',
      defaultParams(ctx) {
        const runtimeContext = ctx as typeof ctx & RouteModelRuntimeContext;
        return {
          mode: 'embed',
          preventClose: true,
          pageModelClass: resolveRoutePageModelClass(
            runtimeContext.currentRoute,
            runtimeContext.layout,
            warnUnsupportedPageTypeOnce,
          ),
        };
      },
    },
  },
});
