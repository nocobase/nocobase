/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export enum NocoBaseDesktopRouteType {
  group = 'group',
  page = 'page',
  flowRoute = 'flowRoute',
  link = 'link',
  tabs = 'tabs',
  flowPage = 'flowPage',
}

/**
 * 尽量与移动端的结构保持一致
 */
export interface NocoBaseDesktopRoute {
  id?: number;
  parentId?: number;
  children?: NocoBaseDesktopRoute[];

  title?: string;
  tooltip?: string;
  icon?: string;
  schemaUid?: string;
  menuSchemaUid?: string;
  tabSchemaName?: string;
  /**
   * schemaUid 是用于存储菜单的 schema uid，pageSchemaUid 是用于存储菜单中的页面的 schema uid
   *
   * 注意：仅 type 为 page 时，pageSchemaUid 才有值
   */
  pageSchemaUid?: string;
  type?: NocoBaseDesktopRouteType;
  options?: any;
  sort?: number;
  hideInMenu?: boolean;
  enableTabs?: boolean;
  hidden?: boolean;

  // 关联字段
  roles?: Array<{
    name: string;
    title: string;
  }>;

  // 系统字段
  createdAt?: string;
  updatedAt?: string;
  createdBy?: any;
  updatedBy?: any;
}
