/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { castArray } from 'lodash';
import { Op } from 'sequelize';

export default {
  $in(val, ctx) {
    return {
      [Op.in]: val == null ? [] : castArray(val),
    };
  },
} as Record<string, any>;
