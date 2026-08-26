/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ComponentType, ReactNode } from 'react';
import type { AvailableAction, DataSourceRecord } from './pages/permissions/types';

export type DataSourcePermissionT = (key: string, options?: Record<string, unknown>) => string;

export interface DataSourcePermissionRole {
  name: string;
  title?: string;
}

export interface DataSourcePermissionTabProps {
  activeRole?: DataSourcePermissionRole | null;
  availableActions: AvailableAction[];
  dataSource: DataSourceRecord;
  t: DataSourcePermissionT;
}

export type ComponentLoader<Props> = () => Promise<{ default: ComponentType<Props> }>;

export interface DataSourcePermissionTabOptions {
  key: string;
  label: ReactNode;
  componentLoader: ComponentLoader<DataSourcePermissionTabProps>;
  sort?: number;
}

export type DataSourcePermissionTabOptionResolver =
  | DataSourcePermissionTabOptions
  | ((props: DataSourcePermissionTabProps) => DataSourcePermissionTabOptions | null | undefined);

export class DataSourcePermissionTabRegistry {
  private readonly permissionTabs = new Map<string, DataSourcePermissionTabOptionResolver>();

  add(options: DataSourcePermissionTabOptionResolver) {
    const key = typeof options === 'function' ? `callback:${this.permissionTabs.size}` : options.key;
    this.permissionTabs.set(key, options);
  }

  getPermissionTabs(props: DataSourcePermissionTabProps) {
    return Array.from(this.permissionTabs.values())
      .map((item) => (typeof item === 'function' ? item(props) : item))
      .filter((item): item is DataSourcePermissionTabOptions => !!item)
      .sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100));
  }
}
