/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from './base-interface';

export class BooleanInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return !!value;
    }

    if (typeof value === 'string') {
      if (!value) {
        return false;
      }

      if (['1', 'y', 'yes', 'true', '是'].includes(value.toLowerCase())) {
        return true;
      } else if (['0', 'n', 'no', 'false', '否'].includes(value.toLowerCase())) {
        return false;
      }
    }

    throw new Error(`Invalid value - ${JSON.stringify(value)}`);
  }

  toString(value: any, ctx?: any) {
    const enumConfig = this.options.uiSchema?.enum || [];
    if (enumConfig?.length > 0) {
      const option = enumConfig.find((item) => item.value === value);
      return option?.label;
    } else {
      const label = value ? 'True' : value === null || value === undefined ? '' : 'False';
      if (ctx?.t) {
        return ctx.t(label, { ns: 'action-export' });
      }

      return label;
    }
  }
}
