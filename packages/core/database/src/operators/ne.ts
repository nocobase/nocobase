/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from 'sequelize';

export default {
  $ne(val, ctx) {
    if (Array.isArray(val)) {
      return {
        [Op.notIn]: val,
      };
    }
    return val === null
      ? {
          [Op.ne]: null,
        }
      : {
          [Op.or]: {
            [Op.ne]: val,
            [Op.is]: null,
          },
        };
  },
} as Record<string, any>;
