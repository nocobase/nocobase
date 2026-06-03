/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type DepartmentPrimaryKey = string | number;

export interface DepartmentRecord {
  id: DepartmentPrimaryKey;
  title?: string;
  parentId?: DepartmentPrimaryKey | null;
  parent?: DepartmentRecord | null;
  children?: DepartmentRecord[];
  isLeaf?: boolean;
  roles?: RoleRecord[];
  owners?: UserRecord[];
  departmentsUsers?: {
    isOwner?: boolean;
  };
}

export interface RoleRecord {
  name: string;
  title?: string;
}

export interface UserRecord {
  id: DepartmentPrimaryKey;
  nickname?: string;
  username?: string;
  phone?: string;
  email?: string;
  mainDepartmentId?: DepartmentPrimaryKey | null;
  departments?: DepartmentRecord[];
}

export function getDepartmentTitle(record?: Pick<DepartmentRecord, 'title' | 'parent'> | null): string {
  if (!record) {
    return '';
  }
  const title = record.title || '';
  return record.parent ? `${getDepartmentTitle(record.parent)} / ${title}` : title;
}
