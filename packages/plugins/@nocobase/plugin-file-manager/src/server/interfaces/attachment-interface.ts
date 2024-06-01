/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from '@nocobase/database';
import lodash from 'lodash';
import { basename, extname } from 'path';

export class AttachmentInterface extends BaseInterface {
  async toValue(value: any, ctx?: any) {
    return this.castArray(value).map((url: string) => {
      return {
        title: basename(url),
        extname: extname(url),
        filename: basename(url),
        url,
      };
    });
  }

  toString(value: any, ctx?: any) {
    return lodash
      .castArray(value)
      .map((item) => item.url)
      .join(',');
  }
}
