/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ReactNode } from 'react';

export interface AvailableAction {
  name: string;
  displayName?: ReactNode;
  onNewRecord?: boolean;
  allowConfigureFields?: boolean;
}

export interface DataSourceRecord {
  key: string;
  displayName?: ReactNode;
  type?: string;
  enabled?: boolean;
}

export interface CollectionFieldRecord {
  name: string;
  interface?: string;
  type?: string;
  target?: string;
  uiSchema?: {
    title?: ReactNode;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface RoleCollectionRecord {
  type?: string;
  name: string;
  collectionName?: string;
  title?: ReactNode;
  roleName: string;
  usingConfig?: 'strategy' | 'resourceAction';
  exists?: boolean;
  fields?: CollectionFieldRecord[];
}

export interface RoleResourceAction {
  name: string;
  fields?: string[];
  scopeId?: string | number | null;
  scope?: unknown;
}

export interface ScopeRecord {
  id: string | number;
  key?: string;
  name?: string;
  resourceName?: string | null;
  scope?: Record<string, unknown>;
}
