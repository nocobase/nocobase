/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowSurfaceBadRequestError } from './errors';

export const JS_PAGE_MODEL_USE = 'JSPageModel';

export function isRouteBackedPageUse(use?: string) {
  return use === 'RootPageModel' || use === JS_PAGE_MODEL_USE;
}

export function supportsPageTabs(use?: string) {
  return use === 'RootPageModel';
}

export function supportsPageBlockAuthoring(use?: string) {
  return use === 'RootPageModel';
}

export function supportsStandardPageBlueprint(use?: string) {
  return use === 'RootPageModel';
}

export function throwJSPageOperationUnsupported(action: string, use = JS_PAGE_MODEL_USE): never {
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces ${action} does not support JS page surfaces`,
    'FLOW_SURFACE_JS_PAGE_OPERATION_UNSUPPORTED',
    {
      details: {
        action,
        pageUse: use,
      },
    },
  );
}
