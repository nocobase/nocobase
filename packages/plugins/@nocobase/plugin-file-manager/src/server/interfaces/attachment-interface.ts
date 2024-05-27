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

export class AttachmentInterface extends BaseInterface {
  toString(value: any, ctx?: any) {
    return lodash
      .castArray(value)
      .map((item) => item.url)
      .join(',');
  }
}
