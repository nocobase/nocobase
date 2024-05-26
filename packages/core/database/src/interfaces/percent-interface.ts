/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { toFixedByStep } from '@nocobase/utils';
import { BaseInterface } from './base-interface';

export class PercentInterface extends BaseInterface {
  toString(value) {
    const step = this.options?.uiSchema?.['x-component-props']?.['step'] ?? 0;
    return value && `${toFixedByStep(value * 100, step)}%`;
  }
}
