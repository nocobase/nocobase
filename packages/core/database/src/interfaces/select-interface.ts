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
    const enumConfig = this.options.uiSchema?.enum || [];
    const option = enumConfig.find((item) => item.label === str);
    return option?.value || str;
  }

  toString(value: any, ctx?: any) {
    const enumConfig = this.options.uiSchema?.enum || [];
    const option = enumConfig.find((item) => item.value === value);
    return option?.label || value;
  }
}
