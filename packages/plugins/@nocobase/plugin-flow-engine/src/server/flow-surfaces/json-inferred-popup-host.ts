/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceAutoPopupHost } from './extractor/types';
import { FlowSurfaceBadRequestError } from './errors';

export const JSON_INFERRED_POPUP_HOST_DEFAULT_OPEN_VIEW_PATH = 'stepParams.popupSettings.openView';

const JSON_INFERRED_POPUP_HOST_UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

type JsonInferredPopupHostContract = Pick<
  FlowSurfaceAutoPopupHost,
  'childSurfaceKey' | 'openViewPath' | 'parentOpenViewMirrorPaths'
>;

export function assertJsonInferredPopupHostContractSupported(popupHost?: JsonInferredPopupHostContract) {
  resolveJsonInferredPopupHostOpenViewPath(popupHost);
  resolveJsonInferredPopupHostParentOpenViewMirrorPaths(popupHost);
  if (String(popupHost?.childSurfaceKey || '').trim()) {
    throw new FlowSurfaceBadRequestError(
      `JSON inferred popup host childSurfaceKey matching is not supported yet`,
      'FLOW_SURFACE_JSON_INFERRED_POPUP_HOST_CHILD_SURFACE_KEY_UNSUPPORTED',
      {
        path: 'inferredAuthoring.popupHosts.childSurfaceKey',
      },
    );
  }
}

export function resolveJsonInferredPopupHostOpenViewPath(popupHost?: JsonInferredPopupHostContract) {
  const hasExplicitPath = Object.prototype.hasOwnProperty.call(popupHost || {}, 'openViewPath');
  const rawPath = hasExplicitPath ? popupHost?.openViewPath : JSON_INFERRED_POPUP_HOST_DEFAULT_OPEN_VIEW_PATH;
  const parsed = parseJsonInferredPopupHostOpenViewPath(rawPath);
  if (!parsed && hasExplicitPath) {
    throw new FlowSurfaceBadRequestError(
      `JSON inferred popup host openViewPath must be 'stepParams.<group>.openView'`,
      'FLOW_SURFACE_JSON_INFERRED_POPUP_HOST_OPEN_VIEW_PATH_INVALID',
      {
        path: 'inferredAuthoring.popupHosts.openViewPath',
      },
    );
  }
  return parsed;
}

export function resolveJsonInferredPopupHostParentOpenViewMirrorPaths(
  popupHost?: Pick<FlowSurfaceAutoPopupHost, 'parentOpenViewMirrorPaths'>,
) {
  return (popupHost?.parentOpenViewMirrorPaths || []).map((path, index) => {
    const parsed = parseJsonInferredPopupHostParentOpenViewMirrorPath(path);
    if (!parsed) {
      throw new FlowSurfaceBadRequestError(
        `JSON inferred popup host parentOpenViewMirrorPaths[${index}] must be 'props.<key>' or 'stepParams.<group>.<key>'`,
        'FLOW_SURFACE_JSON_INFERRED_POPUP_HOST_PARENT_OPEN_VIEW_MIRROR_PATH_INVALID',
        {
          path: `inferredAuthoring.popupHosts.parentOpenViewMirrorPaths[${index}]`,
        },
      );
    }
    return parsed;
  });
}

export function resolveJsonInferredPopupHostStepParamsOpenViewPath(
  popupHost?: Pick<FlowSurfaceAutoPopupHost, 'openViewPath'>,
) {
  const openViewPath = resolveJsonInferredPopupHostOpenViewPath(popupHost);
  if (!openViewPath || openViewPath[0] !== 'stepParams') {
    return null;
  }
  return openViewPath.slice(1);
}

function parseJsonInferredPopupHostParentOpenViewMirrorPath(path?: string) {
  const normalized = String(path || '').trim();
  if (!normalized || normalized.includes('[') || normalized.includes(']') || normalized.includes('/')) {
    return null;
  }
  if (normalized.includes('\\')) {
    return null;
  }
  const segments = normalized.split('.');
  const root = segments[0];
  const validRoot =
    (root === 'props' && segments.length === 2) ||
    (root === 'decoratorProps' && segments.length === 2) ||
    (root === 'stepParams' && segments.length === 3);
  if (
    !validRoot ||
    segments.some(
      (segment) => !segment || segment.trim() !== segment || JSON_INFERRED_POPUP_HOST_UNSAFE_PATH_SEGMENTS.has(segment),
    )
  ) {
    return null;
  }
  return segments;
}

function parseJsonInferredPopupHostOpenViewPath(path?: string) {
  const normalized = String(path || '').trim();
  if (!normalized || normalized.includes('[') || normalized.includes(']') || normalized.includes('/')) {
    return null;
  }
  if (normalized.includes('\\')) {
    return null;
  }
  const segments = normalized.split('.');
  if (
    segments.length !== 3 ||
    segments[0] !== 'stepParams' ||
    segments[segments.length - 1] !== 'openView' ||
    segments.some(
      (segment) => !segment || segment.trim() !== segment || JSON_INFERRED_POPUP_HOST_UNSAFE_PATH_SEGMENTS.has(segment),
    )
  ) {
    return null;
  }
  return segments;
}
