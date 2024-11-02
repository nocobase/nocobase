/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Handlebars } from '@nocobase/utils';

export function compile(template: Record<string, any>, data: Record<string, any>): Record<string, any> {
  if (!template) {
    return {};
  }
  const result = Object.keys(template).reduce((object, key) => {
    let c;
    let value = object[key];
    switch (typeof template[key]) {
      case 'object':
        value = compile(template[key], data);
        break;
      case 'string':
        c = Handlebars.compile(template[key]);
        value = c(data);
        break;
      default:
        break;
    }
    return Object.assign(object, { [key]: value });
  }, {});
  return result;
}
