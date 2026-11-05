/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type LayoutStorageScopeStorageType = 'localStorage' | 'sessionStorage' | 'memory';

export interface LayoutStorageScopeOptions {
  storageType: LayoutStorageScopeStorageType;
  prefix: string;
}

export interface LayoutRegisterOptions {
  routeName: string;
  routePath: string;
  uid: string;
  layoutModelClass: string;
  rootPageModelClass?: string;
  childPageModelClass?: string;
  authCheck?: boolean;
  storageScope?: LayoutStorageScopeOptions;
}

export interface LayoutDefinition extends Omit<Required<LayoutRegisterOptions>, 'storageScope'> {
  rootRouteName: string;
  storageScope?: LayoutStorageScopeOptions;
}
