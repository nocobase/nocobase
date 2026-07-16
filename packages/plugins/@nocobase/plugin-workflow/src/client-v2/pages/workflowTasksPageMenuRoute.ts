/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TASK_STATUS, normalizeWorkflowTaskStatus, type WorkflowTaskStatus } from '../taskCenter';

export interface WorkflowTasksPageMenuRoute {
  taskType?: string;
  status: WorkflowTaskStatus;
  popupId?: string;
  search: string;
  hash: string;
}

export interface WorkflowTasksPageMenuRouteInput {
  pathname: string;
  pageUid?: string;
  search?: string;
  hash?: string;
}

export interface WorkflowTasksPageMenuPathInput {
  pathname: string;
  pageUid?: string;
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

const WORKFLOW_TASK_ROUTE_KEYS = new Set(['tasktype', 'status', 'popupid']);

function hasValidWorkflowTaskSuffix(segments: string[], pageIndex: number) {
  const taskSegments = segments.slice(pageIndex + 1);
  if (!taskSegments.length) {
    return true;
  }
  if (taskSegments.length % 2 !== 0) {
    return false;
  }
  for (let index = 0; index < taskSegments.length; index += 2) {
    if (!WORKFLOW_TASK_ROUTE_KEYS.has(taskSegments[index]) || !taskSegments[index + 1]) {
      return false;
    }
  }
  return true;
}

function findPageSegmentIndex(segments: string[], pageUid?: string) {
  if (!pageUid) {
    return -1;
  }
  for (let index = 0; index < segments.length; index++) {
    if (decodeSegment(segments[index]) === pageUid && hasValidWorkflowTaskSuffix(segments, index)) {
      return index;
    }
  }
  return -1;
}

export function isWorkflowTasksPageMenuPathname(pathname: string, pageUid?: string) {
  return findPageSegmentIndex(splitPathname(pathname), pageUid) !== -1;
}

export function parseWorkflowTasksPageMenuRoute(input: WorkflowTasksPageMenuRouteInput): WorkflowTasksPageMenuRoute {
  const segments = splitPathname(input.pathname);
  const pageIndex = findPageSegmentIndex(segments, input.pageUid);
  const route: WorkflowTasksPageMenuRoute = {
    status: TASK_STATUS.PENDING,
    search: input.search || '',
    hash: input.hash || '',
  };

  if (pageIndex === -1) {
    return route;
  }

  const taskSegments = segments.slice(pageIndex + 1);
  for (let index = 0; index < taskSegments.length; index += 2) {
    const key = taskSegments[index];
    const value = taskSegments[index + 1];
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

export function buildWorkflowTasksPageMenuPath(input: WorkflowTasksPageMenuPathInput) {
  const segments = splitPathname(input.pathname);
  const pageIndex = findPageSegmentIndex(segments, input.pageUid);
  const baseSegments = pageIndex === -1 ? segments : segments.slice(0, pageIndex + 1);
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
