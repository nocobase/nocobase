/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ComponentType, ReactNode } from 'react';

export interface Role {
  createdAt?: string;
  updatedAt?: string;
  name: string;
  title: string;
  description?: string;
  strategy?: {
    actions?: string[];
  };
  default?: boolean;
  hidden?: boolean;
  allowConfigure?: boolean;
  allowNewMenu?: boolean;
  snippets?: string[];
}

export interface RoleTabProps {
  active: boolean;
  role: Role | null;
  onRoleChange: (role: Role | null) => void;
}

export interface PermissionTabProps {
  activeKey: string;
  activeRole: Role | null;
  currentUserRole: Role | null;
  onRoleChange: (role: Role | null) => void;
}

export type ComponentLoader<Props> = () => Promise<{ default: ComponentType<Props> }>;

export interface RoleTabOptions {
  title: ReactNode;
  componentLoader: ComponentLoader<RoleTabProps>;
  sort?: number;
}

export interface PermissionTabOptions {
  key: string;
  label: ReactNode;
  componentLoader: ComponentLoader<PermissionTabProps>;
  sort?: number;
}

export class RolesManager {
  private readonly items = new Map<string, RoleTabOptions>();

  add(name: string, options: RoleTabOptions) {
    this.items.set(name, options);
  }

  list() {
    return Array.from(this.items.entries()).sort((a, b) => (a[1].sort ?? 100) - (b[1].sort ?? 100));
  }
}

export class ACLSettingsUI {
  private readonly permissionTabs = new Map<string, PermissionTabOptions>();

  addPermissionsTab(options: PermissionTabOptions) {
    this.permissionTabs.set(options.key, options);
  }

  getPermissionsTabs() {
    return Array.from(this.permissionTabs.values()).sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100));
  }
}
