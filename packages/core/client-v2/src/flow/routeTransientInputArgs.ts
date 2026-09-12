/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const ROUTE_TRANSIENT_INPUT_ARGS_KEY = '__nocobaseOpenViewInputArgs';

export type RouteTransientInputArgsState = {
  [ROUTE_TRANSIENT_INPUT_ARGS_KEY]?: Record<string, Record<string, unknown>>;
  usr?: RouteTransientInputArgsState;
};

export const getRouteTransientInputArgs = (state: unknown, viewUid?: string) => {
  if (!viewUid || !state || typeof state !== 'object') {
    return {};
  }

  const stateValue = state as RouteTransientInputArgsState;
  const values = (stateValue[ROUTE_TRANSIENT_INPUT_ARGS_KEY] || stateValue.usr?.[ROUTE_TRANSIENT_INPUT_ARGS_KEY])?.[
    viewUid
  ];
  return values && typeof values === 'object' ? values : {};
};
