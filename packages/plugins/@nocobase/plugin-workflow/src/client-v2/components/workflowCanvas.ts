/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';

export type WorkflowRevision = {
  id: number | string;
  createdAt?: string;
  current?: boolean;
  enabled?: boolean;
  versionStats?: { executed?: number };
};

export type WorkflowCanvasRecord = {
  // Optional because the canvas context (`WorkflowCanvasFlowContextValue.workflow`) is itself `WorkflowCanvasRecord |
  // null`, and downstream consumers (e.g. the approval pro-plugin's association `approval.workflow`) may hold a
  // partially loaded record without `id`. Every internal canvas read already guards with `workflow?.id`, so the type
  // was over-promising — this aligns it with usage.
  id?: number | string;
  key?: string;
  title?: string;
  type?: string;
  sync?: boolean;
  enabled?: boolean;
  current?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: any;
  updatedBy?: any;
  stats?: { executed?: number };
  versionStats?: { executed?: number };
  [key: string]: any;
};

export function normalizeRecordResponse(response: any): WorkflowCanvasRecord | null {
  return response?.data?.data || response?.data || null;
}

export function formatUser(user: any) {
  return user?.nickname || user?.username || user?.email || user?.id || '-';
}

export function formatTime(value?: string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}
