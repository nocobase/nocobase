/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export abstract class BaseInterface {
  constructor(public options: any = {}) {}

  toString(value: any, ctx?: any) {
    return value;
  }

  async toValue(str: any, ctx?: any): Promise<any> {
    return str;
  }
}
