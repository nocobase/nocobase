/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const OPEN_VIEW_ROUTE_MODES = ['drawer', 'dialog', 'embed'] as const;
const OPEN_VIEW_ROUTE_SIZES = ['small', 'medium', 'large'] as const;

export type OpenViewRouteMode = (typeof OPEN_VIEW_ROUTE_MODES)[number];
export type OpenViewRouteSize = (typeof OPEN_VIEW_ROUTE_SIZES)[number];

export type OpenViewRouteState = {
  mode?: OpenViewRouteMode;
  size?: OpenViewRouteSize;
};

export const RUNJS_OPEN_VIEW_ROUTE_STATE = Symbol.for('nocobase.runjs.openViewRouteState');

function isOpenViewRouteMode(value: unknown): value is OpenViewRouteMode {
  return typeof value === 'string' && (OPEN_VIEW_ROUTE_MODES as readonly string[]).includes(value);
}

function isOpenViewRouteSize(value: unknown): value is OpenViewRouteSize {
  return typeof value === 'string' && (OPEN_VIEW_ROUTE_SIZES as readonly string[]).includes(value);
}

export function createOpenViewRouteState(input?: { mode?: unknown; size?: unknown }): OpenViewRouteState | undefined {
  const state: OpenViewRouteState = {};

  if (isOpenViewRouteMode(input?.mode)) {
    state.mode = input.mode;
  }
  if (isOpenViewRouteSize(input?.size)) {
    state.size = input.size;
  }

  return state.mode || state.size ? state : undefined;
}
