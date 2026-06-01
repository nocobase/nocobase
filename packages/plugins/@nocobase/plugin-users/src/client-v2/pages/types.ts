/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface Role {
  name: string;
  title: string;
}

export interface User {
  id: number;
  nickname?: string;
  username?: string;
  email?: string;
  phone?: string;
  roles?: Role[];
}

export interface ListPayload<RecordType extends object> {
  data?: RecordType[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    count?: number;
  };
}

export function toListPayload<RecordType extends object>(responseData: unknown): ListPayload<RecordType> {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as ListPayload<RecordType>;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
    meta: payload.meta,
  };
}
