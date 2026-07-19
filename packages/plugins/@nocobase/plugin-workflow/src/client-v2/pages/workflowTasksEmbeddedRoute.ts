/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TASK_STATUS, normalizeWorkflowTaskStatus, type WorkflowTaskStatus } from '../taskCenter';

export interface WorkflowTasksEmbeddedRoute {
  taskType?: string;
  status: WorkflowTaskStatus;
  popupId?: string;
  search: string;
  hash: string;
}

export interface WorkflowTasksEmbeddedRouteInput {
  pathname: string;
  viewUid?: string;
  search?: string;
  hash?: string;
}

export interface WorkflowTasksEmbeddedPathInput {
  pathname: string;
  viewUid?: string;
  route: {
    taskType?: string;
    status?: string;
    popupId?: string | number;
  };
}

function splitPathname(pathname: string) {
  return pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/').filter(Boolean);
}

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function encodeSegment(segment: string | number) {
  return encodeURIComponent(String(segment));
}

function findViewSegmentIndex(segments: string[], viewUid?: string) {
  if (!viewUid) {
    return -1;
  }
  for (let index = segments.length - 1; index >= 1; index--) {
    if (segments[index - 1] === 'view' && decodeSegment(segments[index]) === viewUid) {
      return index;
    }
  }
  return -1;
}

export function parseWorkflowTasksEmbeddedRoute(input: WorkflowTasksEmbeddedRouteInput): WorkflowTasksEmbeddedRoute {
  const segments = splitPathname(input.pathname);
  const viewIndex = findViewSegmentIndex(segments, input.viewUid);
  const route: WorkflowTasksEmbeddedRoute = {
    status: TASK_STATUS.PENDING,
    search: input.search || '',
    hash: input.hash || '',
  };

  if (viewIndex === -1) {
    return route;
  }

  const embeddedSegments = segments.slice(viewIndex + 1);
  for (let index = 0; index < embeddedSegments.length; index += 2) {
    const key = embeddedSegments[index];
    const value = embeddedSegments[index + 1];
    if (!value) {
      continue;
    }
    const decodedValue = decodeSegment(value);
    if (key === 'tasktype') {
      route.taskType = decodedValue;
    } else if (key === 'status') {
      route.status = normalizeWorkflowTaskStatus(decodedValue);
    } else if (key === 'popupid') {
      route.popupId = decodedValue;
    }
  }

  return route;
}

export function buildWorkflowTasksEmbeddedPath(input: WorkflowTasksEmbeddedPathInput) {
  const segments = splitPathname(input.pathname);
  const viewIndex = findViewSegmentIndex(segments, input.viewUid);
  const baseSegments = viewIndex === -1 ? segments : segments.slice(0, viewIndex + 1);
  const routeSegments = [...baseSegments];
  const status = normalizeWorkflowTaskStatus(input.route.status);

  if (input.route.taskType) {
    routeSegments.push('tasktype', encodeSegment(input.route.taskType));
  }
  if (input.route.taskType || input.route.status) {
    routeSegments.push('status', encodeSegment(status));
  }
  if (input.route.popupId !== undefined && input.route.popupId !== null && input.route.popupId !== '') {
    routeSegments.push('popupid', encodeSegment(input.route.popupId));
  }

  return `/${routeSegments.join('/')}`;
}
