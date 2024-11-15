/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from './base-interface';

export class SelectInterface extends BaseInterface {
  async toValue(str: string, ctx?: any): Promise<any> {
    if (!str) {
      return null;
    }

    const enumConfig = this.options.uiSchema?.enum || [];
    const option = enumConfig.find((item) => item.label === str);
    if (option) {
      return option.value;
    }

    const valueOption = enumConfig.find((item) => item.value === str);
    if (valueOption) {
      return valueOption.value;
    }

    throw new Error(`"${str}" is not a valid option in ${ctx.field.name} field.`);
  }

  toString(value: any, ctx?: any) {
    const enumConfig = this.options.uiSchema?.enum || [];
    const option = enumConfig.find((item) => item.value === value);

    if (option) {
      if (ctx?.t) {
        return ctx.t(option.label, { ns: 'lm-collections' });
      }

      return option.label;
    }

    return value;
  }
}
