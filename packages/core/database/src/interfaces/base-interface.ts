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

  /**
   * cast value to string
   * @param value
   * @param ctx
   */
  toString(value: any, ctx?: any) {
    return value;
  }

  /**
   * parse string to value
   * @param str
   * @param ctx
   */
  async toValue(str: any, ctx?: any): Promise<any> {
    return str;
  }

  /**
   * cast value to array
   * eg: 'a,b,c' => ['a', 'b', 'c']
   * eg: ['a', 'b', 'c'] => ['a', 'b', 'c']
   * @param value
   * @param splitter
   */
  castArray(value: any, splitter?: string) {
    let values: string[] = [];
    if (!value) {
      values = [];
    } else if (typeof value === 'string') {
      values = value.split(splitter || /,|，|、/);
    } else if (Array.isArray(value)) {
      values = value;
    }
    return values.map((v) => this.trim(v)).filter(Boolean);
  }

  trim(value: any) {
    return typeof value === 'string' ? value.trim() : value;
  }
}
