/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from '@nocobase/client';

export interface TabItem {
  id: number | string;
  url?: string;
  title: string;
  options: any;
  parentId?: number | string;
  children?: TabItem[];
}

const url = '/mobile/tabs';

export function useTabList() {
  return useRequest<{ data: TabItem[] }>({ url, action: 'list' });
}

export function useUpdateTab(data: TabItem) {
  return useRequest({ url, action: 'update', data });
}

export function useCreateTab(data: TabItem) {
  return useRequest({ url, action: 'create', data });
}

export function useDestroyTab(id: number | string) {
  return useRequest({ url, action: 'destroy', params: { filterByTk: id } });
}
