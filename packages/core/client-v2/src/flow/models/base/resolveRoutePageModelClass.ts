/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_PAGE_TYPE } from '../../../flow-compat/routeTypes';

export const JS_PAGE_MODEL = 'JSPageModel';
export const ROOT_PAGE_MODEL = 'RootPageModel';
export const UNSUPPORTED_V2_PAGE_TYPE = 'UNSUPPORTED_V2_PAGE_TYPE';

export interface RoutePageModelRoute {
  id?: string | number;
  schemaUid?: string;
  pageSchemaUid?: string;
  options?: unknown;
}

export interface RoutePageModelLayout {
  rootPageModelClass?: string;
}

export interface UnsupportedV2PageTypeDiagnostic {
  code: typeof UNSUPPORTED_V2_PAGE_TYPE;
  pageType: unknown;
  routeIdentity: string;
}

function readPageType(options: unknown) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return undefined;
  }
  return (options as Record<string, unknown>).pageType;
}

function getRouteIdentity(route?: RoutePageModelRoute) {
  return String(route?.id ?? route?.pageSchemaUid ?? route?.schemaUid ?? 'unknown');
}

export function resolveRoutePageModelClass(
  route?: RoutePageModelRoute,
  layout?: RoutePageModelLayout,
  onUnsupportedPageType?: (diagnostic: UnsupportedV2PageTypeDiagnostic) => void,
) {
  const fallback = layout?.rootPageModelClass || ROOT_PAGE_MODEL;
  const pageType = readPageType(route?.options);

  if (pageType == null || pageType === '') {
    return fallback;
  }
  if (pageType === JS_PAGE_TYPE) {
    return JS_PAGE_MODEL;
  }

  onUnsupportedPageType?.({
    code: UNSUPPORTED_V2_PAGE_TYPE,
    pageType,
    routeIdentity: getRouteIdentity(route),
  });
  return fallback;
}
