/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface LayoutRegisterOptions {
  routeName: string;
  routePath: string;
  uid: string;
  layoutModelClass: string;
  rootPageModelClass?: string;
  childPageModelClass?: string;
  authCheck?: boolean;
}

export interface LayoutDefinition extends Required<LayoutRegisterOptions> {
  rootRouteName: string;
}
